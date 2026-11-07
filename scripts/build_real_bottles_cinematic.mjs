import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Master real photo sources from user's zip:
// Large 100ml: WA0153 (1066 x 1600) - Real Suha Perfumes 100ml frosted flacon with silver cap
// Small 35ml:  WA0061 (1066 x 1600) - Real Suha Perfumes 35ml slender spray bottle with white pump
const REAL_100_SRC = 'scripts/all_zip_images/IMG-20261103-WA0153.jpg';
const REAL_35_SRC  = 'scripts/all_zip_images/IMG-20261103-WA0061.jpg';

const OUT_DIR = 'public/images/products';

const PRODUCTS = [
  { slug: '212-men', name: '212 MEN', brand: 'CAROLINA HERRERA' },
  { slug: 'ameer-al-oud', name: 'AMEER AL OUD', brand: 'LATTAFA' },
  { slug: 'aqva-bulgari', name: 'AQVA BVLGARI', brand: 'BVLGARI' },
  { slug: 'blue-d-channel', name: 'BLEU DE CHANEL', brand: 'CHANEL' },
  { slug: 'boom-shell', name: 'BOMBSHELL', brand: "VICTORIA'S SECRET" },
  { slug: 'cigar', name: 'CIGAR', brand: 'REMY LATOUR' },
  { slug: 'ck-1', name: 'CK ONE', brand: 'CALVIN KLEIN' },
  { slug: 'dylan-blue', name: 'DYLAN BLUE', brand: 'VERSACE' },
  { slug: 'ferhenite', name: 'FAHRENHEIT', brand: 'DIOR' },
  { slug: 'gucchi-flora', name: 'GUCCI FLORA', brand: 'GUCCI' },
  { slug: 'gucchi-guilty', name: 'GUCCI GUILTY', brand: 'GUCCI' },
  { slug: 'guchi-bloom', name: 'GUCCI BLOOM', brand: 'GUCCI' },
  { slug: 'hugo-boss', name: 'HUGO BOSS', brand: 'HUGO BOSS' },
  { slug: 'invectus', name: 'INVICTUS', brand: 'PACO RABANNE' },
  { slug: 'ismyaki', name: 'ISSEY MIYAKE', brand: "L'EAU D'ISSEY" },
  { slug: 'janan-sport', name: 'JANAN SPORT', brand: 'J. FRAGRANCES' },
  { slug: 'office-4-men', name: 'OFFICE FOR MAN', brand: 'FRAGRANCE ONE' },
  { slug: 'open', name: 'OPEN', brand: 'ROGER & GALLET' },
  { slug: 'poision', name: 'POISON', brand: 'DIOR' },
  { slug: 'savauge', name: 'SAUVAGE', brand: 'DIOR' },
  { slug: 'sweet-lavendar', name: 'SWEET LAVENDER', brand: 'SUHA EXCLUSIVE' },
  { slug: 'tommy-hilfiger', name: 'TOMMY HILFIGER', brand: 'TOMMY' },
  { slug: 'zara', name: 'ZARA FOR HIM', brand: 'ZARA MAN' }
];

function escapeXml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function processReal100(prod) {
  const { data, info } = await sharp(REAL_100_SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // Inpaint label on real bottle (WA0153 has "OFFICE For Man" at left: 395, top: 1030, width: 275, height: 90)
  const box = { left: 395, top: 1030, width: 275, height: 90 };
  for (let y = box.top; y < box.top + box.height; y++) {
    const leftIdx = (y * width + (box.left - 6)) * 3;
    const rL = data[leftIdx], gL = data[leftIdx + 1], bL = data[leftIdx + 2];
    const rightIdx = (y * width + (box.left + box.width + 6)) * 3;
    const rR = data[rightIdx], gR = data[rightIdx + 1], bR = data[rightIdx + 2];

    for (let x = box.left; x < box.left + box.width; x++) {
      const idx = (y * width + x) * 3;
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

  // Exact matching serif typography on label
  const fontSize = prod.name.length > 14 ? 20 : (prod.name.length > 9 ? 24 : 28);
  const brandSize = 18;
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
      <text x="${box.width / 2}" y="34" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="${fontSize}" font-weight="bold" letter-spacing="1.2" fill="#1b2114" opacity="0.92" filter="url(#ink)">${escapeXml(prod.name)}</text>
      ${prod.brand ? `<text x="${box.width / 2}" y="66" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="${brandSize}" font-weight="bold" letter-spacing="1.8" fill="#1b2114" opacity="0.88" filter="url(#ink)">${escapeXml(prod.brand)}</text>` : ''}
    </svg>
  `);

  const inpainted = await sharp(data, { raw: { width, height, channels: 3 } })
    .composite([{ input: svgText, top: box.top, left: box.left }])
    .png()
    .toBuffer();

  // Now apply the cinematic studio background:
  const targetW = 1080;
  const targetH = 1440;

  const resized = await sharp(inpainted)
    .resize(targetW, targetH, { fit: 'cover', position: 'center' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bottleData = resized.data;

  // Background SVG: cinematic luxury dark charcoal with gold halo glow
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
  const bgR = 125, bgG = 132, bgB = 124;

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

  const outPath = path.join(OUT_DIR, `${prod.slug}-large.jpg`);
  await sharp(output, { raw: { width: targetW, height: targetH, channels: 3 } })
    .jpeg({ quality: 92 })
    .toFile(outPath);

  console.log(`✓ Real 100ml: ${outPath} (${prod.name})`);
}

async function processReal35(prod) {
  const { data, info } = await sharp(REAL_35_SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // Inpaint label on real 35ml bottle (WA0061 has "OFFICE For Man" at left: 410, top: 1040, width: 250, height: 80)
  const box = { left: 410, top: 1040, width: 250, height: 80 };
  for (let y = box.top; y < box.top + box.height; y++) {
    const leftIdx = (y * width + (box.left - 6)) * 3;
    const rL = data[leftIdx], gL = data[leftIdx + 1], bL = data[leftIdx + 2];
    const rightIdx = (y * width + (box.left + box.width + 6)) * 3;
    const rR = data[rightIdx], gR = data[rightIdx + 1], bR = data[rightIdx + 2];

    for (let x = box.left; x < box.left + box.width; x++) {
      const idx = (y * width + x) * 3;
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

  const fontSize = prod.name.length > 14 ? 18 : (prod.name.length > 9 ? 22 : 26);
  const svgText = Buffer.from(`
    <svg width="${box.width}" height="${box.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ink35" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <text x="${box.width / 2}" y="48" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="${fontSize}" font-weight="bold" letter-spacing="1.2" fill="#1b2114" opacity="0.92" filter="url(#ink35)">${escapeXml(prod.name)}</text>
    </svg>
  `);

  const inpainted = await sharp(data, { raw: { width, height, channels: 3 } })
    .composite([{ input: svgText, top: box.top, left: box.left }])
    .png()
    .toBuffer();

  const targetW = 1080;
  const targetH = 1440;

  const resized = await sharp(inpainted)
    .resize(targetW, targetH, { fit: 'cover', position: 'center' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bottleData = resized.data;

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
  const bgR = 121, bgG = 128, bgB = 121;

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

  const outPath = path.join(OUT_DIR, `${prod.slug}-small.jpg`);
  await sharp(output, { raw: { width: targetW, height: targetH, channels: 3 } })
    .jpeg({ quality: 92 })
    .toFile(outPath);

  console.log(`✓ Real 35ml:  ${outPath} (${prod.name})`);
}

async function main() {
  console.log('Generating real bottle photos with cinematic professional backgrounds...');
  for (const prod of PRODUCTS) {
    await processReal100(prod);
    await processReal35(prod);
  }
  console.log('\nAll 23 products built using the original real bottles with cinematic studio backgrounds!');
}

main().catch(console.error);
