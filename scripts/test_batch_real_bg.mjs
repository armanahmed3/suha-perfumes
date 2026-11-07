import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = 'scripts/zip_fresh';

async function processPhotoWithCinematicBackground(srcFile, outFile) {
  const srcPath = path.join(SRC, srcFile.endsWith('.jpg') ? srcFile : `IMG-20261103-${srcFile}.jpg`);
  if (!fs.existsSync(srcPath)) {
    console.error('Missing source file:', srcPath);
    return false;
  }

  const targetW = 1080;
  const targetH = 1440;

  // 1. Resize and center original photo
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

  // 3. Cinematic studio background SVG: dark luxury charcoal with warm golden halo ambient glow
  const bgSvg = Buffer.from(`
    <svg width="${targetW}" height="${targetH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="halo" cx="50%" cy="48%" r="48%">
          <stop offset="0%" stop-color="#26231c" />
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

  // 4. Soft blend: preserve the real bottle 100%, replace the flat background
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const idx = (y * targetW + x) * 3;

      const r = bottleData[idx], g = bottleData[idx+1], b = bottleData[idx+2];
      const bgR_val = bgData[idx], bgG_val = bgData[idx+1], bgB_val = bgData[idx+2];

      // Distance from center of frame (bottle is centered)
      const dx = (x - targetW / 2) / (targetW / 2);
      const dy = (y - targetH / 2) / (targetH / 2);
      const distFromCenter = Math.sqrt(dx*dx * 1.5 + dy*dy);

      // Color distance from the photo's background
      const cDist = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);

      let bottleWeight = 0;
      if (distFromCenter < 0.88) {
        if (cDist > 24) {
          // Definitely bottle feature
          bottleWeight = 1.0;
        } else if (cDist > 10) {
          // Soft anti-aliased edge
          bottleWeight = (cDist - 10) / 14;
        } else {
          bottleWeight = 0.0;
        }
      }

      // Smooth vignette falloff near the canvas borders
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

  console.log(`✓ Processed ${srcFile} -> ${outFile}`);
  return true;
}

async function test() {
  const testFiles = ['WA0154', 'WA0170', 'WA0130', 'WA0107', 'WA0082', 'WA0088'];
  for (const f of testFiles) {
    await processPhotoWithCinematicBackground(f, `scripts/test_out_${f}.jpg`);
  }
}

test().catch(console.error);

