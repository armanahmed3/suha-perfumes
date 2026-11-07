import sharp from 'sharp';

async function testDylanBlue() {
  const src100 = 'C:/Users/smmar/.gemini/antigravity/brain/2e9eef5b-845d-4bb7-a599-57cae0692b9d/suha_sauvage_product_1794077994904.jpg';
  const { data: data100, info: info100 } = await sharp(src100).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info100;

  // Inpaint label on 100ml
  const box100 = { left: 365, top: 735, width: 200, height: 95 };
  for (let y = box100.top; y < box100.top + box100.height; y++) {
    const leftIdx = (y * width + (box100.left - 4)) * channels;
    const rL = data100[leftIdx], gL = data100[leftIdx + 1], bL = data100[leftIdx + 2];
    const rightIdx = (y * width + (box100.left + box100.width + 4)) * channels;
    const rR = data100[rightIdx], gR = data100[rightIdx + 1], bR = data100[rightIdx + 2];

    for (let x = box100.left; x < box100.left + box100.width; x++) {
      const idx = (y * width + x) * channels;
      const frac = (x - box100.left) / box100.width;
      const targetR = rL * (1 - frac) + rR * frac;
      const targetG = gL * (1 - frac) + gR * frac;
      const targetB = bL * (1 - frac) + bR * frac;

      const currLum = data100[idx] * 0.299 + data100[idx+1] * 0.587 + data100[idx+2] * 0.114;
      const targetLum = targetR * 0.299 + targetG * 0.587 + targetB * 0.114;

      if (currLum < targetLum - 8) {
        data100[idx] = Math.round(targetR);
        data100[idx+1] = Math.round(targetG);
        data100[idx+2] = Math.round(targetB);
      }
    }
  }

  // Label text SVG
  const svgText100 = Buffer.from(`
    <svg width="${box100.width}" height="${box100.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ink" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.25" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <text x="${box100.width / 2}" y="38" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="22" font-weight="bold" letter-spacing="1.2" fill="#1c201e" filter="url(#ink)">DYLAN BLUE</text>
      <text x="${box100.width / 2}" y="70" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="16" font-weight="bold" letter-spacing="2" fill="#2a2e2c" filter="url(#ink)">VERSACE</text>
    </svg>
  `);

  // Subtle blue liquid tint on the glass shoulder and lower flacon (excluding label)
  // Bottle body is 275..730, 410..980
  const blueTint100 = Buffer.from(`
    <svg width="455" height="570" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="blueGlow" cx="50%" cy="48%" r="48%">
          <stop offset="0%" stop-color="#1d4ed8" stop-opacity="0.22" />
          <stop offset="60%" stop-color="#2563eb" stop-opacity="0.14" />
          <stop offset="100%" stop-color="#1e3a8a" stop-opacity="0.0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#blueGlow)" />
    </svg>
  `);

  await sharp(data100, { raw: { width, height, channels } })
    .composite([
      { input: blueTint100, top: 410, left: 275, blend: 'screen' },
      { input: svgText100, top: box100.top, left: box100.left }
    ])
    .jpeg({ quality: 92 })
    .toFile('scripts/test_dylan_100.jpg');

  console.log('Saved test_dylan_100.jpg');
}

testDylanBlue().catch(console.error);

