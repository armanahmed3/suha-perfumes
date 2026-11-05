import ZAI from 'z-ai-web-dev-sdk';

async function main() {
  const zai = await ZAI.create();
  try {
    const result = await zai.functions.invoke('page_reader', { url: 'https://www.fragrantica.com/perfume/Dior/Sauvage-31861.html' });
    console.log('CODE:', result.code);
    console.log('TITLE:', result.data?.title);
    const html = result.data?.html || '';
    console.log('HTML LEN:', html.length);
    console.log(html.slice(0, 600));
  } catch (e) {
    console.log('ERR', e.message);
  }
}
main();
