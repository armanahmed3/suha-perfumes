import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const PRODUCTS = [
  { slug: 'ameer-al-oud', liquid: 'rich dark amber oud liquid with golden hues', accent: 'warm amber glow' },
  { slug: 'blue-d-channel', liquid: 'deep navy blue liquid', accent: 'cool blue glow' },
  { slug: 'boom-shell', liquid: 'soft blush pink liquid', accent: 'gentle pink glow' },
  { slug: 'cigar', liquid: 'rich tobacco amber brown liquid', accent: 'warm golden glow' },
  { slug: 'ck-1', liquid: 'crystal clear liquid with a light green tint', accent: 'fresh mint glow' },
  { slug: 'dylan-blue', liquid: 'deep ocean blue liquid', accent: 'mediterranean blue glow' },
  { slug: 'ferhenite', liquid: 'intense burnt orange amber liquid', accent: 'fiery warm glow' },
  { slug: 'ismyaki', liquid: 'pale straw yellow liquid', accent: 'soft white glow' },
  { slug: 'janan-sport', liquid: 'vibrant sporty green liquid', accent: 'fresh green glow' },
  { slug: 'open', liquid: 'deep crimson red liquid', accent: 'bold red glow' },
  { slug: 'poision', liquid: 'mysterious deep purple liquid', accent: 'dark violet glow' },
  { slug: 'savauge', liquid: 'steel blue grey gradient liquid', accent: 'rugged blue glow' },
];

const STYLE = 'Luxury perfume product photography: a cylindrical frosted glass perfume bottle with a brushed silver metal cap, filled with LIQUID_COLOR. Bottle has a small elegant blank cream label. Standing centered on white silk fabric with soft folds, soft diffused studio lighting, ACCENT_LIGHT, shallow depth of field, premium minimalist aesthetic, photorealistic, high quality, 8k product shot.';

async function main() {
  const zai = await ZAI.create();
  for (const p of PRODUCTS) {
    const out = `public/images/products/${p.slug}-large.jpg`;
    if (fs.existsSync(out)) { console.log('skip', p.slug); continue; }
    const prompt = STYLE.replace('LIQUID_COLOR', p.liquid).replace('ACCENT_LIGHT', p.accent);
    try {
      const r = await zai.images.generations.create({ prompt, size: '864x1152' });
      fs.writeFileSync(out, Buffer.from(r.data[0].base64, 'base64'));
      console.log('ok', p.slug);
    } catch (e) {
      console.log('fail', p.slug, e.message.slice(0, 80));
    }
    await new Promise(r => setTimeout(r, 1500));
  }
}
main();
