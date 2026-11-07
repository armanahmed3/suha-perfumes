import sharp from 'sharp';

async function test() {
  const src = 'scripts/all_zip_images/IMG-20261103-WA0153.jpg';
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Exact region of "OFFICE For Man" on WA0153
  const box = { left: 395, top: 1030, width: 275, height: 90 };

  for (let y = box.top; y < box.top + box.height; y++) {
    const leftIdx = (y * width + (box.left - 6)) * channels;
    const rL = data[leftIdx], gL = data[leftIdx + 1], bL = data[leftIdx + 2];

    const rightIdx = (y * width + (box.left + box.width + 6)) * channels;
    const rR = data[rightIdx], gR = data[rightIdx + 1], bR = data[rightIdx + 2];

    for (let x = box.left; x < box.left + box.width; x++) {
      const idx = (y * width + x) * channels;
      const frac = (x - box.left) / box.width;
      
      const targetR = rL * (1 - frac) + rR * frac;
      const targetG = gL * (1 - frac) + gR * frac;
      const targetB = bL * (1 - frac) + bR * frac;

      const currLum = data[idx] * 0.299 + data[idx+1] * 0.587 + data[idx+2] * 0.114;
      const targetLum = targetR * 0.299 + targetG * 0.587 + targetB * 0.114;

      if (currLum < targetLum - 6) {
        data[idx] = Math.round(targetR);
        data[idx+1] = Math.round(targetG);
        data[idx+2] = Math.round(targetB);
      }
    }
  }

  // Exact matching typography:
  // "Impression of" ends at ~1025.
  // The first line starts at ~1052 (baseline), second line at ~1085 (baseline).
  const svgText = Buffer.from(`
    <svg width="${box.width}" height="${box.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ink" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <text x="${box.width / 2}" y="32" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="28" font-weight="bold" letter-spacing="1.2" fill="#1b2114" opacity="0.92" filter="url(#ink)">SAUVAGE</text>
      <text x="${box.width / 2}" y="62" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="20" font-weight="bold" letter-spacing="1.5" fill="#1b2114" opacity="0.92" filter="url(#ink)">DIOR</text>
    </svg>
  `);

  await sharp(data, { raw: { width, height, channels } })
    .composite([
      { input: svgText, top: box.top, left: box.left }
    ])
    .resize(1080, 1440, { fit: 'cover' })
    .jpeg({ quality: 92 })
    .toFile('scripts/test_perfect_sauvage2.jpg');

  console.log('Saved test_perfect_sauvage2.jpg');
}

test();

