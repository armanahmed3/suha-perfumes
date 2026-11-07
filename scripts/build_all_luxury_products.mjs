import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const MASTER_100_PATH = 'C:/Users/smmar/.gemini/antigravity/brain/2e9eef5b-845d-4bb7-a599-57cae0692b9d/suha_sauvage_product_1794077994904.jpg';
const MASTER_35_PATH = 'C:/Users/smmar/.gemini/antigravity/brain/2e9eef5b-845d-4bb7-a599-57cae0692b9d/suha_sauvage_35ml_1794078082596.jpg';
const OUTPUT_DIR = 'public/images/products';

const PRODUCTS = [
  {
    slug: 'savauge',
    name: 'SAUVAGE',
    brand: 'DIOR',
    tint: '#eab308',
    skipIfGemini: true
  },
  {
    slug: '212-men',
    name: '212 MEN',
    brand: 'CAROLINA HERRERA',
    tint: '#94a3b8',
    skipIfGemini: true
  },
  {
    slug: 'ameer-al-oud',
    name: 'AMEER AL OUD',
    brand: 'LATTAFA',
    tint: '#b45309',
    skipIfGemini: true
  },
  {
    slug: 'blue-d-channel',
    name: 'BLEU DE CHANEL',
    brand: 'CHANEL',
    tint: '#1d4ed8',
    skipIfGemini: true
  },
  {
    slug: 'gucchi-flora',
    name: 'GUCCI FLORA',
    brand: 'GUCCI',
    tint: '#f43f5e',
    skipIfGemini: true
  },
  {
    slug: 'invectus',
    name: 'INVICTUS',
    brand: 'PACO RABANNE',
    tint: '#38bdf8',
    skipIfGemini: true
  },
  {
    slug: 'gucchi-guilty',
    name: 'GUCCI GUILTY',
    brand: 'GUCCI',
    tint: '#d97706',
    skip100IfGemini: true
  },
  {
    slug: 'aqva-bulgari',
    name: 'AQVA BVLGARI',
    brand: 'BVLGARI',
    tint: '#0ea5e9'
  },
  {
    slug: 'boom-shell',
    name: 'BOMBSHELL',
    brand: "VICTORIA'S SECRET",
    tint: '#ec4899'
  },
  {
    slug: 'cigar',
    name: 'CIGAR',
    brand: 'REMY LATOUR',
    tint: '#92400e'
  },
  {
    slug: 'ck-1',
    name: 'CK ONE',
    brand: 'CALVIN KLEIN',
    tint: '#cbd5e1'
  },
  {
    slug: 'dylan-blue',
    name: 'DYLAN BLUE',
    brand: 'VERSACE',
    tint: '#2563eb'
  },
  {
    slug: 'ferhenite',
    name: 'FAHRENHEIT',
    brand: 'DIOR',
    tint: '#ea580c'
  },
  {
    slug: 'guchi-bloom',
    name: 'GUCCI BLOOM',
    brand: 'GUCCI',
    tint: '#fb7185'
  },
  {
    slug: 'hugo-boss',
    name: 'HUGO BOSS',
    brand: 'HUGO BOSS',
    tint: '#d97706'
  },
  {
    slug: 'ismyaki',
    name: 'ISSEY MIYAKE',
    brand: "L'EAU D'ISSEY",
    tint: '#7dd3fc'
  },
  {
    slug: 'janan-sport',
    name: 'JANAN SPORT',
    brand: 'J. FRAGRANCES',
    tint: '#22c55e'
  },
  {
    slug: 'office-4-men',
    name: 'OFFICE FOR MAN',
    brand: 'FRAGRANCE ONE',
    tint: '#eab308'
  },
  {
    slug: 'open',
    name: 'OPEN',
    brand: 'ROGER & GALLET',
    tint: '#b45309'
  },
  {
    slug: 'poision',
    name: 'POISON',
    brand: 'DIOR',
    tint: '#7e22ce'
  },
  {
    slug: 'sweet-lavendar',
    name: 'SWEET LAVENDER',
    brand: 'SUHA EXCLUSIVE',
    tint: '#a855f7'
  },
  {
    slug: 'tommy-hilfiger',
    name: 'TOMMY HILFIGER',
    brand: 'TOMMY',
    tint: '#eab308'
  },
  {
    slug: 'zara',
    name: 'ZARA FOR HIM',
    brand: 'ZARA MAN',
    tint: '#d97706'
  }
];

function escapeXml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function generate100ml(prod) {
  const { data, info } = await sharp(MASTER_100_PATH).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Inpaint label text region
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

  // Typography overlay
  const fontSize = prod.name.length > 14 ? 18 : (prod.name.length > 9 ? 22 : 26);
  const brandSize = 15;
  const yName = prod.brand ? 38 : 52;
  const yBrand = 68;

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
      <text x="${box.width / 2}" y="${yName}" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="${fontSize}" font-weight="bold" letter-spacing="1.2" fill="#1c201e" filter="url(#ink)">${escapeXml(prod.name)}</text>
      ${prod.brand ? `<text x="${box.width / 2}" y="${yBrand}" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="${brandSize}" font-weight="bold" letter-spacing="2" fill="#2a2e2c" filter="url(#ink)">${escapeXml(prod.brand)}</text>` : ''}
    </svg>
  `);

  // Liquid tint overlay
  const liquidTint = Buffer.from(`
    <svg width="455" height="570" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="liquidGlow" cx="50%" cy="48%" r="48%">
          <stop offset="0%" stop-color="${prod.tint}" stop-opacity="0.22" />
          <stop offset="65%" stop-color="${prod.tint}" stop-opacity="0.12" />
          <stop offset="100%" stop-color="${prod.tint}" stop-opacity="0.0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#liquidGlow)" />
    </svg>
  `);

  const outPath = path.join(OUTPUT_DIR, `${prod.slug}-large.jpg`);
  await sharp(data, { raw: { width, height, channels } })
    .composite([
      { input: liquidTint, top: 410, left: 275, blend: 'screen' },
      { input: svgText, top: box.top, left: box.left }
    ])
    .jpeg({ quality: 92 })
    .toFile(outPath);

  console.log(`✓ 100ml: ${outPath} (${prod.name})`);
}

async function generate35ml(prod) {
  const { data, info } = await sharp(MASTER_35_PATH).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Inpaint label region on 35ml
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

  const fontSize = prod.name.length > 14 ? 16 : (prod.name.length > 9 ? 19 : 23);
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
      <text x="${box.width / 2}" y="38" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="${fontSize}" font-weight="bold" letter-spacing="1.2" fill="#181c1a" filter="url(#ink35)">${escapeXml(prod.name)}</text>
    </svg>
  `);

  const liquidTint = Buffer.from(`
    <svg width="220" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="liquid35" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${prod.tint}" stop-opacity="0.0" />
          <stop offset="25%" stop-color="${prod.tint}" stop-opacity="0.22" />
          <stop offset="75%" stop-color="${prod.tint}" stop-opacity="0.22" />
          <stop offset="100%" stop-color="${prod.tint}" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#liquid35)" />
    </svg>
  `);

  const outPath = path.join(OUTPUT_DIR, `${prod.slug}-small.jpg`);
  await sharp(data, { raw: { width, height, channels } })
    .composite([
      { input: liquidTint, top: 380, left: 390, blend: 'screen' },
      { input: svgText, top: box.top, left: box.left }
    ])
    .jpeg({ quality: 92 })
    .toFile(outPath);

  console.log(`✓ 35ml:  ${outPath} (${prod.name})`);
}

async function main() {
  console.log('Generating luxury studio master bottle photography for all products...');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const prod of PRODUCTS) {
    // 100ml
    if (prod.skipIfGemini || prod.skip100IfGemini) {
      console.log(`- 100ml: Skipping ${prod.slug} (kept Gemini original)`);
    } else {
      await generate100ml(prod);
    }

    // 35ml
    if (prod.skipIfGemini) {
      console.log(`- 35ml:  Skipping ${prod.slug} (kept Gemini original)`);
    } else {
      await generate35ml(prod);
    }
  }

  console.log('\nAll 23 products generated with 100ml & 35ml distinct bottles & matching labels!');
}

main().catch(console.error);
