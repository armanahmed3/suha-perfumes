/**
 * Reads every product photo label via VLM to build a precise image->product mapping.
 * Output: scripts/image_map.json  { "IMG-...-WA0056.jpg": { label, bottle, confidence } }
 */
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const SRC = '/home/z/my-project/upload/products';
const OUT = '/home/z/my-project/scripts/image_map.json';

const PRODUCTS = [
  '212 Men', 'Ameer al Oud', 'Aqva Bulgari', 'Blue D Chanel', 'Boom Shell', 'Cigar',
  'CK One', 'Dylan Blue', 'Fahrenheit', 'Gucci Flora', 'Gucci Guilty', 'Gucci Bloom',
  'Hugo Boss', 'Invictus', 'Ismyaki', 'Janan Sport', 'Office For Man', 'Open',
  'Poison', 'Sauvage', 'Sweet Lavender', 'Tommy Hilfiger', 'Zara'
];

const PROMPT = `This is a photo of a perfume bottle from the brand "SUHA Perfumes" (impression/inspired perfumes). The bottle has a printed label that says "SUHA PERFUMES - Impression of <PRODUCT NAME>".

Read the product name printed on the label EXACTLY. It is one of these (note possible misspellings on label):
212 Men, Ameer al Oud / Al Oud / Ameer, Aqva Bulgari / Bulgari Aqua, Blue D Chanel / D Chanel, Boom Shell, Cigar, CK One, Dylan Blue, Fahrenheit, Gucci Flora / Flora, Gucci Guilty / Guilty, Gucci Bloom / Bloom, Hugo Boss / Boss, Invictus, Ismyaki, Janan Sport, Office For Man / Office, Open, Poison, Sauvage, Sweet Lavender / Lavendar, Tommy Hilfiger / Tommy, Zara / Zara For Him / Zara Oud.

Also tell the bottle type: "small" = small clear bottle with white spray pump (roughly 35ml), "large" = larger frosted glass bottle with silver metal cap (roughly 100ml).

Answer ONLY with compact JSON:
{"label":"<exact visible product words>","match":"<one product name from the list or UNKNOWN>","bottle":"small|large","confidence":"high|medium|low"}`;

async function main() {
  const zai = await ZAI.create();
  const files = fs.readdirSync(SRC).filter(f => f.endsWith('.jpg')).sort();
  const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  const queue = files.filter(f => !existing[f] || existing[f].match === 'UNKNOWN');
  console.log(`Total: ${files.length}, to process: ${queue.length}`);

  const CONCURRENCY = 6;
  let done = 0;

  async function worker(ids) {
    for (const f of ids) {
      const fp = path.join(SRC, f);
      const b64 = fs.readFileSync(fp).toString('base64');
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await zai.chat.completions.createVision({
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: PROMPT },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } }
              ]
            }],
            thinking: { type: 'disabled' }
          });
          let raw = res.choices[0]?.message?.content || '';
          raw = raw.replace(/```json|```/g, '').trim();
          const m = raw.match(/\{[\s\S]*\}/);
          const parsed = m ? JSON.parse(m[0]) : { label: '', match: 'UNKNOWN', bottle: 'unknown', confidence: 'low' };
          existing[f] = parsed;
          break;
        } catch (e) {
          console.error(`  ${f} attempt ${attempt} failed: ${e.message}`);
          if (attempt === 3) existing[f] = { label: '', match: 'UNKNOWN', bottle: 'unknown', confidence: 'low', error: e.message };
          await new Promise(r => setTimeout(r, 1500 * attempt));
        }
      }
      done++;
      if (done % 10 === 0) {
        fs.writeFileSync(OUT, JSON.stringify(existing, null, 2));
        console.log(`Progress: ${done}/${queue.length}`);
      }
    }
  }

  const buckets = Array.from({ length: CONCURRENCY }, () => []);
  queue.forEach((f, i) => buckets[i % CONCURRENCY].push(f));
  await Promise.all(buckets.map(b => worker(b)));

  fs.writeFileSync(OUT, JSON.stringify(existing, null, 2));

  // Summary
  const summary = {};
  for (const [f, v] of Object.entries(existing)) {
    const k = `${v.match} | ${v.bottle}`;
    summary[k] = (summary[k] || 0) + 1;
  }
  console.log('\n=== SUMMARY ===');
  for (const [k, c] of Object.entries(summary).sort()) console.log(`${c}\t${k}`);
  console.log('\nUnknown files:', Object.entries(existing).filter(([, v]) => v.match === 'UNKNOWN').map(([f]) => f));
}

main().catch(e => { console.error(e); process.exit(1); });
