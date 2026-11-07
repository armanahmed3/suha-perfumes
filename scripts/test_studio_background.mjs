import sharp from 'sharp';
import fs from 'fs';

async function testCutout() {
  // WA0153: 100ml bottle (1066 x 1600)
  // Bottle bounding box: left: 320, right: 746, top: 290 (cap), bottom: 1240 (base)
  const src = 'scripts/all_zip_images/IMG-20261103-WA0153.jpg';
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log('Image dimensions:', width, height);

  // Let's create an alpha mask for the bottle
  // The studio backdrop is light off-white (lum > 180, low saturation)
  // The cap is shiny silver/dark reflections
  // The bottle has liquid (yellow-green) and frosted glass
  // The shadow is on the left
  
  // Let's test creating a masked bottle png
  const rgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const outIdx = (y * width + x) * 4;

      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const lum = r * 0.299 + g * 0.587 + b * 0.114;

      rgba[outIdx] = r;
      rgba[outIdx + 1] = g;
      rgba[outIdx + 2] = b;

      // Inside bottle bounding area?
      // Cap: x in [420, 646], y in [290, 460]
      // Shoulder: y in [460, 560]
      // Body: x in [320, 746], y in [560, 1220]
      // Shadow: y in [1050, 1250], x in [150, 360]
      
      const inBottleX = (x >= 320 && x <= 746);
      const inBottleY = (y >= 290 && y <= 1230);

      if (inBottleX && inBottleY) {
        // Soft edge
        rgba[outIdx + 3] = 255;
      } else {
        rgba[outIdx + 3] = 0;
      }
    }
  }

  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png()
    .toFile('scripts/test_cutout_raw.png');

  console.log('Saved test_cutout_raw.png');
}

testCutout().catch(console.error);

