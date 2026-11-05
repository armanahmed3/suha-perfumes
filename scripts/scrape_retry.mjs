import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const existing = JSON.parse(fs.readFileSync('scripts/scraped_products.json', 'utf8'));
const missing = existing.filter(d => !d.found).map(d => d.slug);
console.log('Retrying:', missing.join(', '));

const PRODUCT_INFO = {
  'aqva-bulgari': { name: 'Aqva Bulgari', query: 'fragrantica Aqva Pour Homme Bvlgari' },
  'blue-d-channel': { name: 'Blue D channel', query: 'fragrantica Bleu de Chanel Eau de Toilette' },
  'boom-shell': { name: 'Boom Shell', query: 'fragrantica Bombshell Victoria\'s Secret' },
  'cigar': { name: 'Cigar', query: 'fragrantica Cigar Remy Latour' },
  'ck-1': { name: 'CK-1', query: 'fragrantica CK One Calvin Klein' },
  'dylan-blue': { name: 'Dylan Blue', query: 'fragrantica Dylan Blue Versace' },
  'ferhenite': { name: 'Ferhenite', query: 'fragrantica Fahrenheit Christian Dior' },
  'gucchi-flora': { name: 'Gucchi Flora', query: 'fragrantica Flora by Gucci' },
  'gucchi-guilty': { name: 'Gucchi Guilty', query: 'fragrantica Gucci Guilty Eau de Toilette' },
  'guchi-bloom': { name: 'Guchi Bloom', query: 'fragrantica Gucci Bloom' },
  'hugo-boss': { name: 'Hugo Boss', query: 'fragrantica Boss Bottled Hugo Boss' },
  'invectus': { name: 'Invectus', query: 'fragrantica Invictus Rabanne' },
  'ismyaki': { name: 'Ismyaki', query: 'fragrantica LEau dIssey Issey Miyake' },
  'poision': { name: 'Poision', query: 'fragrantica Poison Dior' },
  'savauge': { name: 'Savauge', query: 'fragrantica Sauvage Dior' },
  'sweet-lavendar': { name: 'Sweet Lavendar', query: 'sweet lavender fragrance notes aromatherapy' },
  'tommy-hilfiger': { name: 'Tommy Hilfiger', query: 'fragrantica Tommy Tommy Hilfiger men cologne' },
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

function htmlToText(html) {
  let s = html;
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<[^>]+>/g, '\n');
  s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  s = s.replace(/\n\s*\n+/g, '\n').replace(/[ \t]+/g, ' ');
  return s;
}

async function extract(zai, p, url, htmlText) {
  const prompt = `You are a perfume data extractor. Below is text scraped from a Fragrantica page for the perfume "${p.name}" (SUHA Perfumes sells an "impression"/inspired version of it).
${url ? `Source URL: ${url}` : ''}
Extract and return ONLY valid JSON (no markdown) with this shape:
{"found": true/false, "originalName": "...", "brand": "...", "year": 2000, "gender": "Men|Women|Unisex", "description": "2-3 sentence marketing description of the scent", "topNotes": [".."], "heartNotes": [".."], "baseNotes": [".."], "accords": [".."], "longevity": "...", "sillage": "...", "season": [".."], "matchConfidence": "high|medium|low"}
If the page text does not clearly relate to the intended perfume, set found=false.

PAGE TEXT (truncated):
${htmlText.slice(0, 14000)}`;
  const res = await zai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    thinking: { type: 'disabled' },
  });
  const txt = res?.choices?.[0]?.message?.content || '';
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) return { found: false, parseError: txt.slice(0, 200) };
  try { return JSON.parse(m[0]); } catch { return { found: false, parseError: 'json' }; }
}

async function main() {
  const zai = await ZAI.create();
  for (const slug of missing) {
    const p = PRODUCT_INFO[slug];
    if (!p) continue;
    try {
      // search
      let url = null;
      for (let a = 0; a < 2 && !url; a++) {
        try {
          const r = await zai.functions.invoke('web_search', { query: p.query, num: 6 });
          const frag = (r || []).find(x => (x.url || '').includes('fragrantica.com/perfume'));
          url = frag ? frag.url : null;
        } catch (e) { console.log(`  search err ${slug}: ${e.message.slice(0,80)}`); await sleep(6000); }
      }
      console.log(`[${slug}] url=${url}`);
      await sleep(3000);
      let data = { found: false };
      if (url) {
        try {
          const page = await zai.functions.invoke('page_reader', { url });
          await sleep(3000);
          const text = htmlToText(page?.data?.html || '');
          data = await extract(zai, p, url, text);
        } catch (e) { console.log(`  read err ${slug}: ${e.message.slice(0,80)}`); }
      }
      const idx = existing.findIndex(x => x.slug === slug);
      existing[idx] = { ...existing[idx], sourceUrl: url, ...data };
      console.log(`[${slug}] found=${data.found}`);
    } catch (e) {
      console.log(`[${slug}] fatal: ${e.message.slice(0, 100)}`);
    }
    await sleep(2500);
    fs.writeFileSync('scripts/scraped_products.json', JSON.stringify(existing, null, 2));
  }
  console.log('COMPLETE');
}
main();
