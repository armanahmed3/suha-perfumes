import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

// SUHA product -> target original fragrance search queries
const PRODUCTS = [
  { slug: '212-men', name: '212 Men', query: 'fragrantica 212 Men Carolina Herrera men' },
  { slug: 'ameer-al-oud', name: 'Ameer al Oud', query: 'fragrantica Ameer Al Oudh Intense Oud Lattafa' },
  { slug: 'aqva-bulgari', name: 'Aqva Bulgari', query: 'fragrantica Aqva Pour Homme Bvlgari men' },
  { slug: 'blue-d-channel', name: 'Blue D channel', query: 'fragrantica Bleu de Chanel men' },
  { slug: 'boom-shell', name: 'Boom Shell', query: 'fragrantica Bombshell Victoria Secret perfume' },
  { slug: 'cigar', name: 'Cigar', query: 'fragrantica Cigar Remy Latour men' },
  { slug: 'ck-1', name: 'CK-1', query: 'fragrantica CK One Calvin Klein' },
  { slug: 'dylan-blue', name: 'Dylan Blue', query: 'fragrantica Dylan Blue Versace men' },
  { slug: 'ferhenite', name: 'Ferhenite', query: 'fragrantica Fahrenheit Dior men' },
  { slug: 'gucchi-flora', name: 'Gucchi Flora', query: 'fragrantica Flora by Gucci perfume women' },
  { slug: 'gucchi-guilty', name: 'Gucchi Guilty', query: 'fragrantica Gucci Guilty Eau de Toilette women' },
  { slug: 'guchi-bloom', name: 'Guchi Bloom', query: 'fragrantica Gucci Bloom women' },
  { slug: 'hugo-boss', name: 'Hugo Boss', query: 'fragrantica Boss Bottled Hugo Boss men' },
  { slug: 'invectus', name: 'Invectus', query: 'fragrantica Invictus Paco Rabanne men' },
  { slug: 'ismyaki', name: 'Ismyaki', query: 'fragrantica LEau dIssey Issey Miyake women' },
  { slug: 'janan-sport', name: 'Janan Sport', query: 'Janan Sport perfume fragrantica men' },
  { slug: 'office-4-men', name: 'Office 4 Men', query: 'fragrantica Office for Men Fragrance One' },
  { slug: 'open', name: 'Open', query: 'fragrantica Open perfume men cologne' },
  { slug: 'poision', name: 'Poision', query: 'fragrantica Poison Dior women' },
  { slug: 'savauge', name: 'Savauge', query: 'fragrantica Sauvage Dior men' },
  { slug: 'sweet-lavendar', name: 'Sweet Lavendar', query: 'sweet lavender perfume fragrance notes' },
  { slug: 'tommy-hilfiger', name: 'Tommy Hilfiger', query: 'fragrantica Tommy Hilfiger Tommy men' },
  { slug: 'zara', name: 'Zara', query: 'fragrantica Zara Vibrant Leather men' },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { out[idx] = await fn(items[idx], idx); } catch (e) { out[idx] = { error: e.message }; }
    }
  });
  await Promise.all(workers);
  return out;
}

function htmlToText(html) {
  let s = html;
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<[^>]+>/g, '\n');
  s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  s = s.replace(/\n\s*\n+/g, '\n').replace(/[ \t]+/g, ' ');
  return s;
}

async function searchUrl(zai, query) {
  try {
    const r = await zai.functions.invoke('web_search', { query, num: 6 });
    const frag = (r || []).find(x => (x.url || '').includes('fragrantica.com/perfume'));
    return frag ? frag.url : null;
  } catch (e) { return null; }
}

async function extract(zai, p, url, htmlText) {
  const prompt = `You are a perfume data extractor. Below is text scraped from a Fragrantica page for the perfume "${p.name}" (SUHA Perfumes sells an "impression"/inspired version of it).
${url ? `Source URL: ${url}` : ''}
Extract and return ONLY valid JSON (no markdown) with this shape:
{"found": true/false, "originalName": "...", "brand": "...", "year": 2000, "gender": "Men|Women|Unisex", "description": "2-3 sentence marketing description of the scent", "topNotes": [".."], "heartNotes": [".."], "baseNotes": [".."], "accords": [".."], "longevity": "...", "sillage": "...", "season": [".."], "matchConfidence": "high|medium|low"}
If the page text does not clearly relate to the intended perfume, set found=false. Description should be rich, luxurious copy about the fragrance character.

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
  const results = [];

  // Step 1: resolve URLs (concurrency 3)
  const withUrls = await mapLimit(PRODUCTS, 3, async (p) => {
    const url = await searchUrl(zai, p.query);
    console.log(`[url] ${p.slug} -> ${url}`);
    return { ...p, url };
  });

  // Step 2: read pages (concurrency 2) + extract
  const done = await mapLimit(withUrls, 2, async (p) => {
    let data = { found: false };
    if (p.url) {
      try {
        const page = await zai.functions.invoke('page_reader', { url: p.url });
        const text = htmlToText(page?.data?.html || '');
        data = await extract(zai, p, p.url, text);
      } catch (e) {
        console.log(`[read-fail] ${p.slug}: ${e.message}`);
      }
    }
    console.log(`[done] ${p.slug} found=${data.found}`);
    return { slug: p.slug, name: p.name, sourceUrl: p.url, ...data };
  });

  fs.writeFileSync('scripts/scraped_products.json', JSON.stringify(done, null, 2));
  console.log('Saved', done.length, 'products');
}
main();
