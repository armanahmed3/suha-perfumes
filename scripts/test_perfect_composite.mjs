import sharp from 'sharp';
import fs from 'fs';

// Master 100ml image:
// suha_sauvage_product_1794077994904.jpg
// Dimensions: 896 x 1200
// Label text region for fragrance name:
// center X: 504, Y: 720 to 800, width: 200, height: 80
// Paper background color: #eae8e3

// Master 35ml image:
// suha_sauvage_35ml_1794078082596.jpg
// Dimensions: 896 x 1200
// Label text region for fragrance name:
// center X: 500, Y: 690 to 760, width: 180, height: 70
// Paper background color: #f5f5f5

function makeLabelOverlay100(nameText, brandSubText = '') {
  return Buffer.from(`
    <svg width="220" height="90" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#eae8e3" />
      <text x="110" y="${brandSubText ? '36' : '52'}" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="${nameText.length > 10 ? '22' : '26'}" font-weight="bold" letter-spacing="1.5" fill="#111111">${nameText}</text>
      ${brandSubText ? `<text x="110" y="66" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="18" font-weight="600" letter-spacing="2" fill="#222222">${brandSubText}</text>` : ''}
    </svg>
  `);
}

function makeLabelOverlay35(nameText) {
  return Buffer.from(`
    <svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f6f6f6" />
      <text x="100" y="48" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="${nameText.length > 10 ? '20' : '24'}" font-weight="bold" letter-spacing="1.2" fill="#151515">${nameText}</text>
    </svg>
  `);
}

async function testBombshell() {
  const master100 = 'C:/Users/smmar/.gemini/antigravity/brain/2e9eef5b-845d-4bb7-a599-57cae0692b9d/suha_sauvage_product_1794077994904.jpg';
  const master35 = 'C:/Users/smmar/.gemini/antigravity/brain/2e9eef5b-845d-4bb7-a599-57cae0692b9d/suha_sauvage_35ml_1794078082596.jpg';

  // 100ml Bombshell
  // Liquid tint: pink/blush overlay in bottle body region (x: 275..730, y: 410..980)
  const tint100 = Buffer.from(`
    <svg width="455" height="570">
      <defs>
        <radialGradient id="pinkGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ff6699" stop-opacity="0.32" />
          <stop offset="70%" stop-color="#ff3388" stop-opacity="0.22" />
          <stop offset="100%" stop-color="#ff0066" stop-opacity="0.0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#pinkGlow)" />
    </svg>
  `);

  await sharp(master100)
    .composite([
      { input: tint100, top: 410, left: 275, blend: 'screen' },
      { input: makeLabelOverlay100('BOMBSHELL', "VICTORIA'S SECRET"), top: 720, left: 394 }
    ])
    .jpeg({ quality: 92 })
    .toFile('scripts/test_bombshell_100ml.jpg');

  // 35ml Bombshell
  const tint35 = Buffer.from(`
    <svg width="220" height="600">
      <defs>
        <linearGradient id="pink35" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ff3388" stop-opacity="0.0" />
          <stop offset="30%" stop-color="#ff66aa" stop-opacity="0.28" />
          <stop offset="70%" stop-color="#ff66aa" stop-opacity="0.28" />
          <stop offset="100%" stop-color="#ff3388" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#pink35)" />
    </svg>
  `);

  await sharp(master35)
    .composite([
      { input: tint35, top: 380, left: 390, blend: 'screen' },
      { input: makeLabelOverlay35('BOMBSHELL'), top: 695, left: 400 }
    ])
    .jpeg({ quality: 92 })
    .toFile('scripts/test_bombshell_35ml.jpg');

  console.log('Saved test_bombshell 100ml and 35ml');
}

testBombshell().catch(console.error);

