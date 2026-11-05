import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const sleep = ms => new Promise(r => setTimeout(r, ms));

function htmlToText(html) {
  let s = html;
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<[^>]+>/g, '\n');
  s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  s = s.replace(/\n\s*\n+/g, '\n').replace(/[ \t]+/g, ' ');
  return s;
}

async function main() {
  const zai = await ZAI.create();
  const brand = { sources: [] };

  // 1. Instagram profile
  for (const url of ['https://www.instagram.com/suhaperfumes/', 'https://www.instagram.com/suhaperfumes']) {
    try {
      const r = await zai.functions.invoke('page_reader', { url });
      const text = htmlToText(r?.data?.html || '');
      brand.sources.push({ url, title: r?.data?.title, text: text.slice(0, 3000) });
      console.log('[IG]', r?.data?.title, 'len', text.length);
      break;
    } catch (e) { console.log('[IG err]', e.message.slice(0, 100)); }
  }
  await sleep(3000);

  // 2. Facebook page
  for (const url of ['https://www.facebook.com/Suhaperfumes/', 'https://m.facebook.com/Suhaperfumes/']) {
    try {
      const r = await zai.functions.invoke('page_reader', { url });
      const text = htmlToText(r?.data?.html || '');
      brand.sources.push({ url, title: r?.data?.title, text: text.slice(0, 3000) });
      console.log('[FB]', r?.data?.title, 'len', text.length);
      break;
    } catch (e) { console.log('[FB err]', e.message.slice(0, 100)); }
  }
  await sleep(3000);

  // 3. Web search about the brand
  for (const q of ['SUHA Perfumes suhaperfumes impressions fragrances', 'suhaperfumes instagram perfume price', 'SUHA Perfumes Facebook about']) {
    try {
      const r = await zai.functions.invoke('web_search', { query: q, num: 8 });
      brand.sources.push({ query: q, results: (r || []).map(x => ({ name: x.name, url: x.url, snippet: x.snippet })) });
      console.log('[search]', q, '->', (r || []).length);
    } catch (e) { console.log('[search err]', e.message.slice(0, 80)); }
    await sleep(3000);
  }

  fs.writeFileSync('scripts/brand_info.json', JSON.stringify(brand, null, 2));
  console.log('SAVED');
}
main();
