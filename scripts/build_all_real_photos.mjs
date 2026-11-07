import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = 'scripts/all_zip_images';
const OUT = 'public/images/products';

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// All 23 products mapped to high-quality studio photos from the zip
const PRODUCT_PHOTO_MAP = {
  '212-men':          { small: 'WA0082', large: 'WA0119' }, // WA0082 = direct 212 MEN
  'ameer-al-oud':     { small: 'WA0087', large: 'WA0097' }, // Amber/gold oud aesthetic
  'aqva-bulgari':     { small: 'WA0094', large: 'WA0154' }, // WA0154 = direct BVLGARI AQVA
  'blue-d-channel':   { small: 'WA0070', large: 'WA0137' }, // WA0137 = Aquatic blue
  'boom-shell':       { small: 'WA0066', large: 'WA0106' }, // WA0106 = Flora pink
  'cigar':            { small: 'WA0086', large: 'WA0096' }, // Warm tobacco amber
  'ck-1':             { small: 'WA0060', large: 'WA0125' }, // Fresh clean unisex
  'dylan-blue':       { small: 'WA0078', large: 'WA0149' }, // Aquatic deep blue
  'ferhenite':        { small: 'WA0064', large: 'WA0145' }, // Amber warm spicy
  'gucchi-flora':     { small: 'WA0093', large: 'WA0130' }, // WA0093/WA0130 = direct GUCCI FLORA
  'gucchi-guilty':    { small: 'WA0083', large: 'WA0170' }, // WA0170 = direct GUCCI GUILTY
  'guchi-bloom':      { small: 'WA0068', large: 'WA0107' }, // WA0107 = direct GUCCI BLOOM
  'hugo-boss':        { small: 'WA0062', large: 'WA0117' }, // WA0062 = direct HUGO BOSS
  'invectus':         { small: 'WA0094', large: 'WA0136' }, // WA0094 = direct INVICTUS
  'ismyaki':          { small: 'WA0074', large: 'WA0127' }, // Clean fresh
  'janan-sport':      { small: 'WA0081', large: 'WA0122' }, // Sport fresh
  'office-4-men':     { small: 'WA0061', large: 'WA0153' }, // WA0061/WA0153 = direct OFFICE For Man
  'open':             { small: 'WA0076', large: 'WA0140' }, // Classic masculine
  'poision':          { small: 'WA0080', large: 'WA0104' }, // WA0080 = purple Sweet Lavender / luxury
  'savauge':          { small: 'WA0091', large: 'WA0138' }, // Executive masculine
  'sweet-lavendar':   { small: 'WA0088', large: 'WA0102' }, // WA0088 = direct SWEET LAVENDER (purple)
  'tommy-hilfiger':   { small: 'WA0073', large: 'WA0125' }, // WA0125 = direct TOMMY
  'zara':             { small: 'WA0087', large: 'WA0097' }, // WA0087/WA0097 = direct ZARA FOR HIM
};

async function processPhoto(srcFile, outFile) {
  const srcPath = path.join(SRC, srcFile);
  if (!fs.existsSync(srcPath)) {
    console.error('Source missing:', srcPath);
    return false;
  }

  await sharp(srcPath)
    .resize(1080, 1440, {
      fit: 'cover',
      position: 'center'
    })
    .modulate({
      brightness: 1.04,
      saturation: 1.05
    })
    .sharpen({ sigma: 0.6 })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(outFile);

  return true;
}

async function main() {
  console.log('Generating real product photos for all 23 fragrances (46 total files)...');
  let count = 0;

  for (const [slug, sizes] of Object.entries(PRODUCT_PHOTO_MAP)) {
    // 1. Small bottle (35ml)
    const smallSrc = `IMG-20261103-${sizes.small}.jpg`;
    const smallOut = path.join(OUT, `${slug}-small.jpg`);
    const okSmall = await processPhoto(smallSrc, smallOut);
    if (okSmall) count++;

    // 2. Large bottle (100ml)
    const largeSrc = `IMG-20261103-${sizes.large}.jpg`;
    const largeOut = path.join(OUT, `${slug}-large.jpg`);
    const okLarge = await processPhoto(largeSrc, largeOut);
    if (okLarge) count++;

    console.log(`✓ ${slug}: small (${sizes.small}) & large (${sizes.large})`);
  }

  console.log(`\nDone! Successfully processed ${count} real product images in ${OUT}`);

  // Save the mapping to photo_map.json
  const photoMap = {};
  for (const slug of Object.keys(PRODUCT_PHOTO_MAP)) {
    photoMap[slug] = {
      small: `/images/products/${slug}-small.jpg`,
      large: `/images/products/${slug}-large.jpg`
    };
  }
  fs.writeFileSync('scripts/photo_map.json', JSON.stringify(photoMap, null, 2));
  console.log('Updated scripts/photo_map.json');
}

main().catch(console.error);

