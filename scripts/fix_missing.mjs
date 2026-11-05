import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const sleep = ms => new Promise(r => setTimeout(r, ms));
function htmlToText(html) {
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\n\s*\n+/g, '\n').replace(/[ \t]+/g, ' ');
  return s;
}

async function main() {
  const zai = await ZAI.create();
  const data = JSON.parse(fs.readFileSync('scripts/scraped_products.json', 'utf8'));

  // 1. Fix boom-shell -> original Bombshell 2010
  try {
    const r = await zai.functions.invoke('web_search', { query: 'fragrantica Bombshell Victoria Secret 2010 eau de parfum', num: 6 });
    const frag = (r || []).find(x => (x.url || '').includes('fragrantica.com/perfume'));
    if (frag) {
      await sleep(3000);
      const page = await zai.functions.invoke('page_reader', { url: frag.url });
      await sleep(3000);
      const text = htmlToText(page?.data?.html || '');
      const prompt = `Extract perfume data. Return ONLY JSON: {"found":true,"originalName":"...","brand":"...","year":2000,"gender":"Men|Women|Unisex","description":"2-3 sentences","topNotes":[],"heartNotes":[],"baseNotes":[],"accords":[],"longevity":"...","sillage":"...","season":[".."]}\nPAGE:\n${text.slice(0,12000)}`;
      const res = await zai.chat.completions.create({ messages: [{ role: 'user', content: prompt }], thinking: { type: 'disabled' } });
      const m = (res?.choices?.[0]?.message?.content || '').match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        const idx = data.findIndex(d => d.slug === 'boom-shell');
        data[idx] = { ...data[idx], sourceUrl: frag.url, ...parsed };
        console.log('boom-shell fixed:', parsed.originalName);
      }
    }
  } catch (e) { console.log('boom-shell err:', e.message.slice(0, 100)); }
  await sleep(2500);

  // 2. Generate Sweet Lavender house fragrance data
  const prompt = `SUHA Perfumes (Karachi, Pakistan) sells "Sweet Lavender" — a lavender-forward impression fragrance. Return ONLY JSON: {"found":true,"originalName":"Sweet Lavender","brand":"SUHA Perfumes House Blend","year":2024,"gender":"Unisex","description":"3 sentences about a sweet calming lavender fragrance with vanilla and musk","topNotes":[".."],"heartNotes":[".."],"baseNotes":[".."],"accords":[".."],"longevity":"...","sillage":"...","season":[".."]}`;
  const res = await zai.chat.completions.create({ messages: [{ role: 'user', content: prompt }], thinking: { type: 'disabled' } });
  const m2 = (res?.choices?.[0]?.message?.content || '').match(/\{[\s\S]*\}/);
  if (m2) {
    const parsed = JSON.parse(m2[0]);
    const idx = data.findIndex(d => d.slug === 'sweet-lavendar');
    data[idx] = { ...data[idx], ...parsed };
    console.log('sweet-lavendar generated');
  }

  fs.writeFileSync('scripts/scraped_products.json', JSON.stringify(data, null, 2));
  console.log('DONE', data.filter(d => d.found).length, '/', data.length);
}
main();
