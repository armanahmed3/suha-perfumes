import sharp from 'sharp';
import fs from 'fs';

// Let's test background replacement on WA0153 (large bottle, Office For Man)
async function testReplaceBackground() {
  const src = 'scripts/all_zip_images/IMG-20261103-WA0153.jpg';
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Let's analyze the background color around the edges (corners and top):
  // Let's sample background color from the top border:
  let bgR = 0, bgG = 0, bgB = 0, bgSamples = 0;
  for (let x = 0; x < width; x += 10) {
    for (let y = 0; y < 100; y += 10) {
      const idx = (y * width + x) * channels;
      bgR += data[idx];
      bgG += data[idx+1];
      bgB += data[idx+2];
      bgSamples++;
    }
  }
  bgR /= bgSamples;
  bgG /= bgSamples;
  bgB /= bgSamples;
  console.log(`Average background RGB: ${Math.round(bgR)}, ${Math.round(bgG)}, ${Math.round(bgB)}`);

  // Let's create an alpha mask based on color distance from the background:
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const outIdx = (y * width + x) * 4;

      const r = data[idx], g = data[idx+1], b = data[idx+2];
      rgba[outIdx] = r;
      rgba[outIdx+1] = g;
      rgba[outIdx+2] = b;

      // Color distance from background
      const dr = r - bgR;
      const dg = g - bgG;
      const db = b - bgB;
      const dist = Math.sqrt(dr*dr + dg*dg + db*db);

      // Also bottle bounding region constraint:
      // The bottle is roughly in x in [300, 760], y in [520, 1380]
      const insideBox = (x >= 280 && x <= 780 && y >= 520 && y <= 1380);

      if (!insideBox) {
        rgba[outIdx+3] = 0;
      } else {
        // Soft alpha ramp
        if (dist < 12) {
          rgba[outIdx+3] = 0;
        } else if (dist < 28) {
          rgba[outIdx+3] = Math.round(((dist - 12) / 16) * 255);
        } else {
          rgba[outIdx+3] = 255;
        }
      }
    }
  }

  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png()
    .toFile('scripts/test_cutout_clean.png');

  // Now create a cinematic dark luxury background:
  const studioBg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="halo" cx="50%" cy="55%" r="45%">
          <stop offset="0%" stop-color="#c5a059" stop-opacity="0.35" />
          <stop offset="50%" stop-color="#9a7b38" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#0a0a0c" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#18181b" stop-opacity="0.0" />
          <stop offset="65%" stop-color="#121214" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#050507" stop-opacity="1.0" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="#09090b" />
      <rect width="100%" height="100%" fill="url(#halo)" />
      <rect width="100%" height="100%" fill="url(#floor)" />
    </svg>
  `);

  await sharp(studioBg)
    .composite([
      { input: 'scripts/test_cutout_clean.png', blend: 'over' }
    ])
    .jpeg({ quality: 92 })
    .toFile('scripts/test_studio_replaced.jpg');

  console.log('Saved test_studio_replaced.jpg');
}

testReplaceBackground().catch(console.error);
