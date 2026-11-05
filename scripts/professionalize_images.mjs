/**
 * Professionalizes every real SUHA product photo:
 * 1. (prep) copies sharper source picks from the zip with mild polish
 * 2. (edit) runs each photo through z-ai image-edit → luxury studio background
 *    (bottle kept unchanged, background replaced with dark + gold brand look)
 *
 * Usage:  bun scripts/professionalize_images.mjs prep|test|all|one <slug-size>
 */
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SRC = '/home/z/my-project/upload/products';
const OUT_DIR = '/home/z/my-project/public/images/products';
const MODE = process.argv[2] || 'test';
const ONE = process.argv[3] || '';

// sharper source photos (hand-verified from contact sheets) for images worth upgrading
const PREP_PICKS = {
  '212-men-small': 'WA0082',
  'office-4-men-small': 'WA0061',
  'gucchi-flora-small': 'WA0093',
  'hugo-boss-small': 'WA0062',
  'zara-small': 'WA0087',
  'gucchi-flora-large': 'WA0130',
  'tommy-hilfiger-large': 'WA0125',
};

// final catalog of the 15 real product images
const ALL = [
  '212-men-small', 'office-4-men-small', 'office-4-men-large',
  'gucchi-flora-small', 'gucchi-flora-large',
  'hugo-boss-small', 'hugo-boss-large',
  'zara-small', 'zara-large',
  'sweet-lavendar-small', 'invectus-small',
  'gucchi-guilty-large', 'guchi-bloom-large',
  'tommy-hilfiger-large', 'aqva-bulgari-large',
];

const PROMPT = [
  'Keep the perfume bottle completely unchanged and natural, exactly as in the original photo: same cap, same glass, same liquid color, same label with the exact same text as in the original photo, same label colors, same sharpness. Do not add glow, do not tint, do not redraw or modify the bottle or its label.',
  'Replace ONLY the background: elegant dark charcoal-black luxury studio backdrop, soft warm golden gradient light glowing behind the bottle, glossy dark reflective table surface with a faint mirror reflection under the bottle, soft professional studio lighting.',
  'Photorealistic high-end product photography.',
].join(' ');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function prep() {
  for (const [slugSize, wa] of Object.entries(PREP_PICKS)) {
    const src = path.join(SRC, `IMG-20261103-${wa}.jpg`);
    if (!fs.existsSync(src)) { console.error('missing source', src); continue; }
    const out = path.join(OUT_DIR, `${slugSize}.jpg`);
    await sharp(src)
      .resize({ width: 1080, withoutEnlargement: true })
      .modulate({ brightness: 1.06, saturation: 1.05 })
      .sharpen({ sigma: 0.7 })
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(out);
    console.log('prep', slugSize, '<-', wa);
  }
}

async function editOne(zai, slugSize) {
  const file = path.join(OUT_DIR, `${slugSize}.jpg`);
  const inputBuf = await fs.promises.readFile(file);
  const dataUrl = `data:image/jpeg;base64,${inputBuf.toString('base64')}`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await zai.images.generations.edit({
        prompt: PROMPT,
        images: [{ url: dataUrl }],
        size: '1024x1024',
      });
      const b64 = res?.data?.[0]?.base64;
      if (!b64) throw new Error('empty response');
      const png = Buffer.from(b64, 'base64');
      const tmp = `/tmp/edit_${slugSize}.png`;
      fs.writeFileSync(tmp, png);
      await sharp(tmp)
        .resize({ width: 1024, height: 1024, fit: 'cover' })
        .jpeg({ quality: 90, mozjpeg: true })
        .toFile(file);
      console.log('✓ edited', slugSize);
      return true;
    } catch (err) {
      const msg = String(err?.message || err);
      console.error(`  attempt ${attempt} failed for ${slugSize}: ${msg.slice(0, 140)}`);
      if (attempt < 4) await sleep(15000 * attempt);
    }
  }
  console.error('✗ GIVING UP', slugSize);
  return false;
}

async function main() {
  if (MODE === 'prep') { await prep(); return; }

  const zai = await ZAI.create();
  let list = ALL;
  if (MODE === 'test') list = ['212-men-small'];
  if (MODE === 'one' && ONE) list = [ONE];
  if (MODE === 'prep+test') { await prep(); list = ['212-men-small']; }
  if (MODE === 'rest') list = ALL.filter((s) => s !== '212-men-small'); // 212-men-small already finalized
  if (MODE === 'list' && ONE) list = ONE.split(','); // comma-separated batch

  let ok = 0;
  for (const slugSize of list) {
    const done = await editOne(zai, slugSize);
    if (done) ok++;
    await sleep(4000); // pace the API
  }
  console.log(`\nDone: ${ok}/${list.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
