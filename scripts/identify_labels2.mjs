/**
 * Improved label reading: sends full photo + enhanced label crop, open OCR, fuzzy match in code.
 * Output: scripts/image_map2.json
 */
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const SRC = '/home/z/my-project/upload/products';
const PREP = '/home/z/my-project/scripts/prep';
const OUT = '/home/z/my-project/scripts/image_map2.json';

const PROMPT = `You see two images of the same perfume bottle: the first is the full photo, the second is a zoomed + brightened crop of its printed label.

Task 1: Read ALL words printed on the label, exactly as written, top to bottom. The brand line "SUHA PERFUMES" and "Impression of" are always there — what matters is the PRODUCT NAME after "Impression of".
Task 2: Classify the bottle: "small" = small clear bottle with white plastic spray pump cap; "large" = big frosted glass bottle with silver metal screw cap.

Answer ONLY with compact JSON, no markdown:
{"text":"<all words you can read on the label>","product":"<just the product name part>","bottle":"small|large"}`;

function norm(s) {
  return (s || '').toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// slug -> [product display name, [aliases/keywords]]
const CATALOG = [
  ['212-men', '212 Men', ['212 MEN', '212']],
  ['ameer-al-oud', 'Ameer al Oud', ['AMEER AL OUD', 'AMEER UL OUD', 'AMEERAL OUD', 'AMBER AL OUD', 'AMEER', 'AL OUD', 'OUDH']],
  ['aqva-bulgari', 'Aqva Bulgari', ['AQVA', 'BVLGARI', 'BULGARI', 'AQVA BVLGARI', 'BVLGARI AQVA']],
  ['blue-d-channel', 'Blue D channel', ['BLUE DE CHANNEL', 'BLUE D CHANNEL', 'BLEU DE CHANNEL', 'BLUE CHANNEL', 'D CHANNEL', 'BLUE DE', 'BLEU DE']],
  ['boom-shell', 'Boom Shell', ['BOOM SHELL', 'BOOMSHLL', 'BOMB SHELL', 'BOMBSHELL', 'BOOM']],
  ['cigar', 'Cigar', ['CIGAR']],
  ['ck-1', 'CK-1', ['CK ONE', 'CK 1', 'CK1', 'CK-1', 'CALVIN KLEIN']],
  ['dylan-blue', 'Dylan Blue', ['DYLAN BLUE', 'DYLAN', 'DILLON BLUE']],
  ['ferhenite', 'Ferhenite', ['FAHRENHEIT', 'FERHENITE', 'FAHRENITE', 'FERENHITE', 'FAHRENHEIT DIOR', 'CHRISTIAN DIOR']],
  ['gucchi-flora', 'Gucchi Flora', ['GUCCI FLORA', 'GUCCHI FLORA', 'GUCI FLORA', 'FLORA GORGEOUS', 'FLORA']],
  ['gucchi-guilty', 'Gucchi Guilty', ['GUCCI GUILTY', 'GUCCHI GUILTY', 'GUCI GUILTY', 'GUILTY']],
  ['guchi-bloom', 'Guchi Bloom', ['GUCCI BLOOM', 'GUCCHI BLOOM', 'GUCI BLOOM', 'BLOOM']],
  ['hugo-boss', 'Hugo Boss', ['HUGO BOSS', 'HUGO', 'BOSS']],
  ['invectus', 'Invectus', ['INVICTUS', 'INVECTUS', 'INVICTOS', 'PACO RABANNE']],
  ['ismyaki', 'Ismyaki', ['ISMYAKI', 'ISMAYAKI', 'ISUMYAKI', 'ISMIYAKI']],
  ['janan-sport', 'Janan Sport', ['JANAN SPORT', 'JANAN', 'JANAAN']],
  ['office-4-men', 'Office 4 Men', ['OFFICE FOR MAN', 'OFFICE 4 MEN', 'OFFICE FOR MEN', 'OFFICE FOR MAN.', 'OFFICE']],
  ['open', 'Open', ['OPEN']],
  ['poision', 'Poision', ['POISON', 'POISION', 'POIZON', 'POISON GIRL', 'HYPNOTIC POISON']],
  ['savauge', 'Savauge', ['SAUVAGE', 'SAVAUGE', 'SOVAGE', 'SAUVAG', 'DIOR SAUVAGE', 'SAUVAGE DIOR']],
  ['sweet-lavendar', 'Sweet Lavendar', ['SWEET LAVENDER', 'SWEET LAVENDAR', 'SWEET LAVANDER', 'LAVENDER', 'LAVENDAR']],
  ['tommy-hilfiger', 'Tommy Hilfiger', ['TOMMY HILFIGER', 'TOMMY', 'HILFIGER', 'TOMMY GIRL', 'TOMMY BOY']],
  ['zara', 'Zara', ['ZARA', 'ZARA MAN', 'ZARA FOR HIM']],
];

const NOTE = { '212-men': 1, 'ameer-al-oud': 2, 'aqva-bulgari': 1, 'blue-d-channel': 2, 'boom-shell': 2, 'cigar': 1, 'ck-1': 2, 'dylan-blue': 1, 'ferhenite': 1, 'gucchi-flora': 1, 'gucchi-guilty': 1, 'guchi-bloom': 2, 'hugo-boss': 1, 'invectus': 1, 'ismyaki': 1, 'janan-sport': 2, 'office-4-men': 1, 'open': 2, 'poision': 1, 'savauge': 2, 'sweet-lavendar': 2, 'tommy-hilfiger': 2, 'zara': 2 };

function matchProduct(text) {
  const t = norm(text);
  if (!t || t.length < 3) return { slug: null, score: 0 };

  // 1) direct keyword hits (longest keyword wins)
  let best = { slug: null, score: 0 };
  for (const [slug, , aliases] of CATALOG) {
    for (const a of aliases) {
      const na = norm(a);
      if (na.length >= 3 && t.includes(na)) {
        const score = na.length / Math.max(t.length, na.length) + 0.4;
        if (score > best.score) best = { slug, score };
      }
    }
  }
  if (best.slug) return best;

  // 2) fuzzy: sequence similarity against aliases
  for (const [slug, , aliases] of CATALOG) {
    for (const a of aliases) {
      const na = norm(a);
      const s = sim(t, na);
      if (s > best.score) best = { slug, score: s };
    }
  }
  return best.score >= 0.62 ? best : { slug: null, score: best.score };
}

function sim(a, b) {
  if (!a || !b) return 0;
  if (a.includes(b) || b.includes(a)) return 0.85 + Math.min(a.length, b.length) / 40;
  // token overlap
  const at = new Set(a.split(' ').filter(w => w.length > 2));
  const bt = new Set(b.split(' ').filter(w => w.length > 2));
  let inter = 0;
  for (const w of at) if (bt.has(w)) inter++;
  const tok = inter / Math.max(at.size, bt.size || 1);
  // char sequence ratio
  const seq = seqRatio(a, b);
  return Math.max(tok, seq);
}

function seqRatio(a, b) {
  const la = a.length, lb = b.length;
  if (!la || !lb) return 0;
  let matches = 0;
  const win = 2;
  for (let i = 0; i + win <= lb; i++) {
    const sub = b.slice(i, i + win);
    if (a.includes(sub)) matches++;
  }
  return matches / Math.max(la, lb) * 0.9;
}

async function main() {
  const zai = await ZAI.create();
  const files = fs.readdirSync(SRC).filter(f => f.endsWith('.jpg')).sort();
  const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  const queue = files.filter(f => !existing[f] || existing[f].slug === 'UNKNOWN');
  console.log(`Total: ${files.length}, to process: ${queue.length}`);

  const CONCURRENCY = 2;
  let done = 0;

  async function worker(list) {
    for (const f of list) {
      const b64full = fs.readFileSync(path.join(SRC, f)).toString('base64');
      const b64prep = fs.readFileSync(path.join(PREP, f)).toString('base64');
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await zai.chat.completions.createVision({
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: PROMPT },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64full}` } },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64prep}` } },
              ]
            }],
            thinking: { type: 'disabled' }
          });
          let raw = res.choices[0]?.message?.content || '';
          raw = raw.replace(/```json|```/g, '').trim();
          const m = raw.match(/\{[\s\S]*\}/);
          const parsed = m ? JSON.parse(m[0]) : { text: '', product: '', bottle: 'unknown' };
          const { slug, score } = matchProduct(`${parsed.product || ''} ${parsed.text || ''}`);
          existing[f] = {
            text: parsed.text || '', product: parsed.product || '',
            bottle: parsed.bottle || 'unknown',
            slug: slug || 'UNKNOWN',
            score: Number(score.toFixed(2)),
          };
          break;
        } catch (e) {
          const is429 = /429|Too many/i.test(e.message || '');
          console.error(`  ${f} attempt ${attempt} failed: ${e.message}`);
          if (attempt === 3) existing[f] = { text: '', product: '', bottle: 'unknown', slug: 'UNKNOWN', score: 0, error: e.message };
          await new Promise(r => setTimeout(r, is429 ? 6000 * attempt : 1500 * attempt));
        }
      }
      // throttle between requests
      await new Promise(r => setTimeout(r, 900));
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

  const summary = {};
  for (const [f, v] of Object.entries(existing)) {
    const k = `${v.slug} | ${v.bottle}`;
    summary[k] = (summary[k] || 0) + 1;
  }
  console.log('\n=== SUMMARY ===');
  for (const [k, c] of Object.entries(summary).sort()) console.log(`${c}\t${k}`);
  const unknowns = Object.entries(existing).filter(([, v]) => v.slug === 'UNKNOWN').map(([f]) => f);
  console.log('\nUnknown:', unknowns.length, unknowns);
}

main().catch(e => { console.error(e); process.exit(1); });
