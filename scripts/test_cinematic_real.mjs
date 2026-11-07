import sharp from 'sharp';

async function testCinematicStudioBackground(srcPath, outPath) {
  const targetW = 1080;
  const targetH = 1440;

  // Resize and center original photo
  const resizedBottle = await sharp(srcPath)
    .resize(targetW, targetH, { fit: 'cover', position: 'center' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bottleData = resizedBottle.data;

  // Sample background color at top-left and top-right margins
  let bgR = 0, bgG = 0, bgB = 0, count = 0;
  for (let y = 0; y < 150; y += 10) {
    for (let x = 0; x < targetW; x += 10) {
      if (x < 180 || x > targetW - 180) {
        const p = (y * targetW + x) * 3;
        bgR += bottleData[p];
        bgG += bottleData[p+1];
        bgB += bottleData[p+2];
        count++;
      }
    }
  }
  bgR /= count; bgG /= count; bgB /= count;

  // Background SVG with 3 channels
  const bgSvg = Buffer.from(`
    <svg width="${targetW}" height="${targetH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="halo" cx="50%" cy="48%" r="48%">
          <stop offset="0%" stop-color="#24211a" />
          <stop offset="50%" stop-color="#141312" />
          <stop offset="100%" stop-color="#09090b" />
        </radialGradient>
        <radialGradient id="goldGlow" cx="50%" cy="50%" r="35%">
          <stop offset="0%" stop-color="#d4af37" stop-opacity="0.32" />
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

  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const idx = (y * targetW + x) * 3;

      const r = bottleData[idx], g = bottleData[idx+1], b = bottleData[idx+2];
      const bgR_val = bgData[idx], bgG_val = bgData[idx+1], bgB_val = bgData[idx+2];

      // Distance from center of bottle
      const dx = (x - targetW / 2) / (targetW / 2);
      const dy = (y - targetH / 2) / (targetH / 2);
      const distFromCenter = Math.sqrt(dx*dx * 1.5 + dy*dy);

      // Color distance to sampled backdrop
      const cDist = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);

      let bottleWeight = 0;
      if (distFromCenter < 0.85) {
        if (cDist > 25) {
          bottleWeight = 1.0;
        } else if (cDist > 12) {
          bottleWeight = (cDist - 12) / 13;
        } else {
          bottleWeight = 0.0;
        }
      }

      if (distFromCenter > 0.65) {
        const falloff = Math.max(0, (0.85 - distFromCenter) / 0.20);
        bottleWeight *= falloff;
      }

      output[idx]   = Math.round(r * bottleWeight + bgR_val * (1 - bottleWeight));
      output[idx+1] = Math.round(g * bottleWeight + bgG_val * (1 - bottleWeight));
      output[idx+2] = Math.round(b * bottleWeight + bgB_val * (1 - bottleWeight));
    }
  }

  await sharp(output, { raw: { width: targetW, height: targetH, channels: 3 } })
    .jpeg({ quality: 92 })
    .toFile(outPath);

  console.log(`Saved ${outPath}`);
}

async function run() {
  await testCinematicStudioBackground('scripts/all_zip_images/IMG-20261103-WA0153.jpg', 'scripts/test_real_cinematic_100.jpg');
  await testCinematicStudioBackground('scripts/all_zip_images/IMG-20261103-WA0061.jpg', 'scripts/test_real_cinematic_35.jpg');
}

run().catch(console.error);
