/**
 * Builds the final real-product image set from the zip photos.
 * - Copies the best photo per product/size to public/images/products/{slug}-{size}.jpg
 * - Deletes every other image in public/images/products (removes AI-generated files)
 * - Writes scripts/photo_map.json documenting the selection
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SRC = '/home/z/my-project/upload/products';
const OUT_DIR = '/home/z/my-project/public/images/products';

// hand-verified mapping from contact-sheet reading (filename badge -> product+size)
const PICKS = {
  // ---- small bottles (white spray pump) ----
  '212-men':          { small: 'WA0057', large: null },            // only small exists
  'invectus':         { small: 'WA0094', large: null },            // only small exists
  'sweet-lavendar':   { small: 'WA0088', large: null },            // only small exists (purple liquid)
  'gucchi-flora':     { small: 'WA0058', large: 'WA0106' },
  'hugo-boss':        { small: 'WA0059', large: 'WA0117' },
  'office-4-men':     { small: 'WA0074', large: 'WA0153' },
  'zara':             { small: 'WA0076', large: 'WA0097' },
  // ---- large bottles (frosted, silver cap) ----
  'gucchi-guilty':    { small: null, large: 'WA0170' },            // only large exists
  'guchi-bloom':      { small: null, large: 'WA0107' },            // only large exists
  'tommy-hilfiger':   { small: null, large: 'WA0103' },            // only large exists
  'aqva-bulgari':     { small: null, large: 'WA0154' },            // only large exists
};

// 12 products with NO real photos: ameer-al-oud, blue-d-channel, boom-shell, cigar,
// ck-1, dylan-blue, ferhenite, ismyaki, janan-sport, open, poision, savauge

fs.mkdirSync(OUT_DIR, { recursive: true });

// 1) wipe the folder completely (removes all AI-generated images)
for (const f of fs.readdirSync(OUT_DIR)) {
  fs.unlinkSync(path.join(OUT_DIR, f));
}

// 2) copy + optimize the real photos
const used = new Set();
const photoMap = {};

for (const [slug, sizes] of Object.entries(PICKS)) {
  photoMap[slug] = {};
  for (const size of ['small', 'large']) {
    const wa = sizes[size];
    if (!wa) continue;
    const src = path.join(SRC, `IMG-20261103-${wa}.jpg`);
    if (!fs.existsSync(src)) { console.error('MISSING SOURCE', src); continue; }
    const out = path.join(OUT_DIR, `${slug}-${size}.jpg`);
    // keep the photo's own background; mild polish for consistency
    await sharp(src)
      .resize({ width: 1080, withoutEnlargement: true })
      .modulate({ brightness: 1.06, saturation: 1.05 })
      .sharpen({ sigma: 0.7 })
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(out);
    used.add(wa);
    photoMap[slug][size] = `/images/products/${slug}-${size}.jpg`;
    console.log('copied', `${slug}-${size}.jpg`, '<-', wa);
  }
}

fs.writeFileSync('/home/z/my-project/scripts/photo_map.json', JSON.stringify(photoMap, null, 2));
console.log('\nDone. Files in output:', fs.readdirSync(OUT_DIR).length);
console.log('Products with real photos:', Object.keys(PICKS).length);
