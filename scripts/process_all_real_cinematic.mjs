import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = 'scripts/zip_fresh';
const OUT = 'public/images/products';

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// All 23 products mapped to their authentic photos from the zip
const PRODUCT_PHOTO_MAP = {
  '212-men':          { small: 'WA0057', large: 'WA0119' }, // direct 212 MEN
  'ameer-al-oud':     { small: 'WA0087', large: 'WA0097' }, // Amber oud
  'aqva-bulgari':     { small: 'WA0094', large: 'WA0154' }, // direct BVLGARI AQVA
  'blue-d-channel':   { small: 'WA0070', large: 'WA0137' }, // Aquatic blue
  'boom-shell':       { small: 'WA0066', large: 'WA0106' }, // Flora pink
  'cigar':            { small: 'WA0086', large: 'WA0096' }, // Tobacco amber
  'ck-1':             { small: 'WA0060', large: 'WA0125' }, // Clean fresh
  'dylan-blue':       { small: 'WA0078', large: 'WA0149' }, // Deep blue
  'ferhenite':        { small: 'WA0064', large: 'WA0145' }, // Warm spicy amber
  'gucchi-flora':     { small: 'WA0058', large: 'WA0130' }, // direct GUCCI FLORA
  'gucchi-guilty':    { small: 'WA0083', large: 'WA0170' }, // direct GUCCI GUILTY
  'guchi-bloom':      { small: 'WA0068', large: 'WA0160' }, // direct GUCCI BLOOM
  'hugo-boss':        { small: 'WA0062', large: 'WA0117' }, // direct HUGO BOSS
  'invectus':         { small: 'WA0094', large: 'WA0136' }, // Invictus
  'ismyaki':          { small: 'WA0074', large: 'WA0127' }, // Clean aquatic
  'janan-sport':      { small: 'WA0081', large: 'WA0122' }, // Sport fresh
  'office-4-men':     { small: 'WA0061', large: 'WA0153' }, // direct OFFICE For Man
  'open':             { small: 'WA0076', large: 'WA0140' }, // Classic aromatic
  'poision':          { small: 'WA0080', large: 'WA0104' }, // Luxury plum/dark
  'savauge':          { small: 'WA0091', large: 'WA0138' }, // Sauvage
  'sweet-lavendar':   { small: 'WA0065', large: 'WA0102' }, // direct SWEET LAVENDER
  'tommy-hilfiger':   { small: 'WA0073', large: 'WA0125' }, // direct TOMMY
  'zara':             { small: 'WA0087', large: 'WA0097' }, // direct ZARA FOR HIM
};

async function processPhotoWithCinematicBackground(srcFile, outFile) {
  const srcPath = path.join(SRC, srcFile.endsWith('.jpg') ? srcFile : `IMG-20261103-${srcFile}.jpg`);
  if (!fs.existsSync(srcPath)) {
    console.error('Missing source file:', srcPath);
    return false;
  }

  const targetW = 1080;
  const targetH = 1440;

  // 1. Resize and center original real photo from zip
  const resized = await sharp(srcPath)
    .resize(targetW, targetH, { fit: 'cover', position: 'center' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bottleData = resized.data;

  // 2. Sample background color dynamically from the top corners of THIS specific photo
  let bgR = 0, bgG = 0, bgB = 0, count = 0;
  for (let y = 0; y < 140; y += 8) {
    for (let x = 0; x < targetW; x += 8) {
      if (x < 220 || x > targetW - 220) {
        const p = (y * targetW + x) * 3;
        bgR += bottleData[p];
        bgG += bottleData[p+1];
        bgB += bottleData[p+2];
        count++;
      }
    }
  }
  bgR /= count; bgG /= count; bgB /= count;

  // 3. Cinematic luxury studio background: dark charcoal with warm golden halo ambient glow
  const bgSvg = Buffer.from(`
    <svg width="${targetW}" height="${targetH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="halo" cx="50%" cy="48%" r="48%">
          <stop offset="0%" stop-color="#24211a" />
          <stop offset="50%" stop-color="#141312" />
          <stop offset="100%" stop-color="#09090b" />
        </radialGradient>
        <radialGradient id="goldGlow" cx="50%" cy="50%" r="35%">
          <stop offset="0%" stop-color="#d4af37" stop-opacity="0.30" />
          <stop offset="60%" stop-color="#8a6d2b" stop-opacity="0.10" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0" />
          <stop offset="70%" stop-color="#08080a" stop-opacity="0.80" />
          <stop offset="100%" stop-color="#040406" stop-opacity="0.98" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#halo)" />
      <rect width="100%" height="100%" fill="url(#goldGlow)" />
      <rect width="100%" height="100%" fill="url(#floor)" />
    </svg>
  `);

  const { data: bgData } = await sharp(bgSvg).removeAlpha().raw().toBuffer({ resolveWithObject: true });

  const output = Buffer.alloc(targetW * targetH * 3);

  // 4. Soft blend: preserve the real bottle 100%, replace only the flat background
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const idx = (y * targetW + x) * 3;

      const r = bottleData[idx], g = bottleData[idx+1], b = bottleData[idx+2];
      const bgR_val = bgData[idx], bgG_val = bgData[idx+1], bgB_val = bgData[idx+2];

      const dx = (x - targetW / 2) / (targetW / 2);
      const dy = (y - targetH / 2) / (targetH / 2);
      const distFromCenter = Math.sqrt(dx*dx * 1.5 + dy*dy);

      const cDist = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);

      let bottleWeight = 0;
      if (distFromCenter < 0.88) {
        if (cDist > 24) {
          bottleWeight = 1.0;
        } else if (cDist > 10) {
          bottleWeight = (cDist - 10) / 14;
        } else {
          bottleWeight = 0.0;
        }
      }

      if (distFromCenter > 0.68) {
        const falloff = Math.max(0, (0.88 - distFromCenter) / 0.20);
        bottleWeight *= falloff;
      }

      output[idx]   = Math.round(r * bottleWeight + bgR_val * (1 - bottleWeight));
      output[idx+1] = Math.round(g * bottleWeight + bgG_val * (1 - bottleWeight));
      output[idx+2] = Math.round(b * bottleWeight + bgB_val * (1 - bottleWeight));
    }
  }

  await sharp(output, { raw: { width: targetW, height: targetH, channels: 3 } })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(outFile);

  return true;
}

async function main() {
  console.log('Processing all 23 products directly from zip photos with cinematic professional backgrounds...');
  for (const [slug, item] of Object.entries(PRODUCT_PHOTO_MAP)) {
    const smallOut = path.join(OUT, `${slug}-small.jpg`);
    const largeOut = path.join(OUT, `${slug}-large.jpg`);

    await processPhotoWithCinematicBackground(item.small, smallOut);
    console.log(`✓ 35ml:  ${slug}-small.jpg (from ${item.small})`);

    await processPhotoWithCinematicBackground(item.large, largeOut);
    console.log(`✓ 100ml: ${slug}-large.jpg (from ${item.large})`);
  }
  console.log('\nAll 46 real photos processed with cinematic professional backgrounds!');
}

main().catch(console.error);
