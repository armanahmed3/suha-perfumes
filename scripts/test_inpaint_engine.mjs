import sharp from 'sharp';

async function inpaintLabel100(fragranceName, brandSub = '') {
  const src = 'C:/Users/smmar/.gemini/antigravity/brain/2e9eef5b-845d-4bb7-a599-57cae0692b9d/suha_sauvage_product_1794077994904.jpg';
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // The text box for SAUVAGE and DIOR in 100ml:
  const box = { left: 365, top: 735, width: 200, height: 95 };

  for (let y = box.top; y < box.top + box.height; y++) {
    const leftIdx = (y * width + (box.left - 4)) * channels;
    const rL = data[leftIdx], gL = data[leftIdx + 1], bL = data[leftIdx + 2];

    const rightIdx = (y * width + (box.left + box.width + 4)) * channels;
    const rR = data[rightIdx], gR = data[rightIdx + 1], bR = data[rightIdx + 2];

    for (let x = box.left; x < box.left + box.width; x++) {
      const idx = (y * width + x) * channels;
      const frac = (x - box.left) / box.width;
      
      const targetR = rL * (1 - frac) + rR * frac;
      const targetG = gL * (1 - frac) + gR * frac;
      const targetB = bL * (1 - frac) + bR * frac;

      const currLum = data[idx] * 0.299 + data[idx+1] * 0.587 + data[idx+2] * 0.114;
      const targetLum = targetR * 0.299 + targetG * 0.587 + targetB * 0.114;

      if (currLum < targetLum - 8) {
        data[idx] = Math.round(targetR);
        data[idx+1] = Math.round(targetG);
        data[idx+2] = Math.round(targetB);
      }
    }
  }

  // Calculate font size according to string length
  const fontSize = fragranceName.length > 14 ? 18 : (fragranceName.length > 9 ? 22 : 27);
  const brandSize = 15;
  const yName = brandSub ? 40 : 54;
  const yBrand = 72;

  const svgText = Buffer.from(`
    <svg width="${box.width}" height="${box.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ink" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.25" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <text x="${box.width / 2}" y="${yName}" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="${fontSize}" font-weight="bold" letter-spacing="1.2" fill="#1c201e" filter="url(#ink)">${fragranceName}</text>
      ${brandSub ? `<text x="${box.width / 2}" y="${yBrand}" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="${brandSize}" font-weight="bold" letter-spacing="2" fill="#2a2e2c" filter="url(#ink)">${brandSub}</text>` : ''}
    </svg>
  `);

  return sharp(data, { raw: { width, height, channels } })
    .composite([{ input: svgText, top: box.top, left: box.left }]);
}

async function inpaintLabel35(fragranceName, brandSub = '') {
  const src = 'C:/Users/smmar/.gemini/antigravity/brain/2e9eef5b-845d-4bb7-a599-57cae0692b9d/suha_sauvage_35ml_1794078082596.jpg';
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // The text box for SAUVAGE in 35ml:
  // From ASCII map: top around 765, height: 60, left: 360, width: 180
  const box = { left: 360, top: 765, width: 175, height: 60 };

  for (let y = box.top; y < box.top + box.height; y++) {
    const leftIdx = (y * width + (box.left - 4)) * channels;
    const rL = data[leftIdx], gL = data[leftIdx + 1], bL = data[leftIdx + 2];

    const rightIdx = (y * width + (box.left + box.width + 4)) * channels;
    const rR = data[rightIdx], gR = data[rightIdx + 1], bR = data[rightIdx + 2];

    for (let x = box.left; x < box.left + box.width; x++) {
      const idx = (y * width + x) * channels;
      const frac = (x - box.left) / box.width;
      
      const targetR = rL * (1 - frac) + rR * frac;
      const targetG = gL * (1 - frac) + gR * frac;
      const targetB = bL * (1 - frac) + bR * frac;

      const currLum = data[idx] * 0.299 + data[idx+1] * 0.587 + data[idx+2] * 0.114;
      const targetLum = targetR * 0.299 + targetG * 0.587 + targetB * 0.114;

      if (currLum < targetLum - 8) {
        data[idx] = Math.round(targetR);
        data[idx+1] = Math.round(targetG);
        data[idx+2] = Math.round(targetB);
      }
    }
  }

  const fontSize = fragranceName.length > 14 ? 16 : (fragranceName.length > 9 ? 19 : 23);
  const svgText = Buffer.from(`
    <svg width="${box.width}" height="${box.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ink35" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.25" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <text x="${box.width / 2}" y="38" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="${fontSize}" font-weight="bold" letter-spacing="1.2" fill="#181c1a" filter="url(#ink35)">${fragranceName}</text>
    </svg>
  `);

  return sharp(data, { raw: { width, height, channels } })
    .composite([{ input: svgText, top: box.top, left: box.left }]);
}

async function run() {
  const img100 = await inpaintLabel100('BOMBSHELL', "VICTORIA'S SECRET");
  await img100.jpeg({ quality: 92 }).toFile('scripts/test_inpaint_bombshell_100.jpg');

  const img35 = await inpaintLabel35('BOMBSHELL');
  await img35.jpeg({ quality: 92 }).toFile('scripts/test_inpaint_bombshell_35.jpg');

  // Also crop zoomed labels to inspect quality
  await sharp('scripts/test_inpaint_bombshell_100.jpg')
    .extract({ left: 340, top: 710, width: 250, height: 140 })
    .toFile('scripts/zoom_bombshell_inpaint_100.jpg');

  await sharp('scripts/test_inpaint_bombshell_35.jpg')
    .extract({ left: 340, top: 740, width: 220, height: 110 })
    .toFile('scripts/zoom_bombshell_inpaint_35.jpg');

  console.log('Inpainting test completed successfully!');
}

run().catch(console.error);

