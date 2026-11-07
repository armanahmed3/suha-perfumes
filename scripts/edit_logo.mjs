import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function main() {
  const input = 'C:/Users/smmar/.gemini/antigravity/brain/2e9eef5b-845d-4bb7-a599-57cae0692b9d/.user_uploaded/media_1793983251280_68c10edb.png';
  const { data, info } = await sharp(input)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  
  // Icon bounding box: X [193..366], Y [32..302]
  // Let's add slight margin
  const margin = 10;
  const cropMinX = Math.max(0, 193 - margin);
  const cropMaxX = Math.min(width - 1, 366 + margin);
  const cropMinY = Math.max(0, 32 - margin);
  const cropMaxY = Math.min(height - 1, 302 + margin);

  const cropW = cropMaxX - cropMinX + 1;
  const cropH = cropMaxY - cropMinY + 1;

  console.log('Cropping icon to:', { cropW, cropH });

  const iconBuffer = Buffer.alloc(cropW * cropH * 4);

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcX = cropMinX + x;
      const srcY = cropMinY + y;
      const srcIdx = (srcY * width + srcX) * 4;
      const destIdx = (y * cropW + x) * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      // Calculate distance from pure white (255, 255, 255)
      const diffR = 255 - r;
      const diffG = 255 - g;
      const diffB = 255 - b;

      // Color difference / saturation from white
      // Gold has strong difference in Blue (diffB is largest)
      const maxDiff = Math.max(diffR, diffG, diffB);

      if (maxDiff <= 4) {
        // Pure white background
        iconBuffer[destIdx] = 0;
        iconBuffer[destIdx + 1] = 0;
        iconBuffer[destIdx + 2] = 0;
        iconBuffer[destIdx + 3] = 0;
      } else {
        // Alpha calculation with smooth ramp
        // If maxDiff is small (e.g. 5-30), smooth anti-aliased edge
        let alpha = Math.min(1, maxDiff / 140);
        // Apply smoothstep curve for crisp anti-aliasing
        alpha = Math.pow(alpha, 0.85);

        // To prevent white fringe on dark backgrounds, unmix white:
        // P = alpha * F + (1 - alpha) * 255 => F = (P - 255 * (1 - alpha)) / alpha
        const aVal = Math.max(alpha, 0.05);
        let unmixedR = Math.round((r - 255 * (1 - aVal)) / aVal);
        let unmixedG = Math.round((g - 255 * (1 - aVal)) / aVal);
        let unmixedB = Math.round((b - 255 * (1 - aVal)) / aVal);

        // Clamp
        unmixedR = Math.max(0, Math.min(255, unmixedR));
        unmixedG = Math.max(0, Math.min(255, unmixedG));
        unmixedB = Math.max(0, Math.min(255, unmixedB));

        // Preserve vibrant gold saturation
        iconBuffer[destIdx] = unmixedR;
        iconBuffer[destIdx + 1] = unmixedG;
        iconBuffer[destIdx + 2] = unmixedB;
        iconBuffer[destIdx + 3] = Math.round(alpha * 255);
      }
    }
  }

  // Make square padded icon (e.g. 512x512 with icon centered)
  const size = 512;
  const scale = (size * 0.82) / Math.max(cropW, cropH);
  const targetW = Math.round(cropW * scale);
  const targetH = Math.round(cropH * scale);

  const resizedIcon = await sharp(iconBuffer, {
    raw: { width: cropW, height: cropH, channels: 4 }
  })
    .resize(targetW, targetH, { fit: 'contain' })
    .png()
    .toBuffer();

  const padX = Math.round((size - targetW) / 2);
  const padY = Math.round((size - targetH) / 2);

  // Composite onto transparent 512x512 canvas
  const finalIcon = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: resizedIcon, top: padY, left: padX }])
    .png()
    .toBuffer();

  // Save to public images
  fs.writeFileSync('public/images/logo-icon.png', finalIcon);
  fs.writeFileSync('public/images/logo-gold.png', finalIcon);
  fs.writeFileSync('public/images/logo.png', finalIcon);
  fs.writeFileSync('src/app/favicon.png', finalIcon);
  fs.writeFileSync('public/favicon.png', finalIcon);

  console.log('✓ Successfully created transparent logo icon at public/images/logo-icon.png and logo-gold.png');
}

main().catch(console.error);
