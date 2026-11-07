import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Let's create an accurate label SVG overlay for the large frosted bottle
// Label area on large bottle WA0153 (1066 x 1600):
// X center: 533, Y center: 1040, Width: 320, Height: 260
function makeLargeLabelSvg(text, emblemB64) {
  const lines = Array.isArray(text) ? text : [text];
  const lineTspans = lines.map((l, i) => 
    `<tspan x="200" dy="${i === 0 ? 0 : 34}">${l}</tspan>`
  ).join('');

  return Buffer.from(`
    <svg width="400" height="340" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="0.4" />
        </filter>
      </defs>
      <!-- Logo emblem -->
      <image href="data:image/png;base64,${emblemB64}" x="160" y="10" width="80" height="80" opacity="0.9" />
      
      <!-- Brand title -->
      <text x="200" y="125" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="34" font-weight="600" letter-spacing="3" fill="#151515" opacity="0.92">SUHA</text>
      <text x="200" y="152" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="16" font-weight="500" letter-spacing="6" fill="#2a2a2a" opacity="0.88">PERFUMES</text>
      
      <!-- Impression line -->
      <text x="200" y="186" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-style="italic" font-size="22" font-weight="500" fill="#222" opacity="0.9">Impression of</text>
      
      <!-- Fragrance Name -->
      <text x="200" y="235" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-size="28" font-weight="bold" letter-spacing="2" fill="#111" opacity="0.92" filter="url(#soft)">
        ${lineTspans}
      </text>
    </svg>
  `);
}

async function test() {
  const emblemB64 = fs.readFileSync('public/images/logo-icon.png').toString('base64');
  
  // Base large bottle: WA0153 (Office For Man)
  // Let's blank out the old label text cleanly using the frosted glass texture around it
  const baseMeta = await sharp('scripts/all_zip_images/IMG-20261103-WA0153.jpg').metadata();
  console.log('Base meta:', baseMeta.width, baseMeta.height);

  // We can sample a patch of frosted bottle or blur the label region slightly to erase existing text
  // Coordinates of label in WA0153: left: 340, top: 880, width: 380, height: 320
  const cleanBase = await sharp('scripts/all_zip_images/IMG-20261103-WA0153.jpg')
    .composite([
      // A soft frosted patch covering old label
      {
        input: Buffer.from(`
          <svg width="360" height="300">
            <ellipse cx="180" cy="150" rx="160" ry="130" fill="#d8d5b8" opacity="0.85" filter="blur(15px)" />
          </svg>
        `),
        top: 890,
        left: 350
      },
      // New authentic label
      {
        input: makeLargeLabelSvg(['SAUVAGE', 'DIOR'], emblemB64),
        top: 870,
        left: 333
      }
    ])
    .resize(1080, 1440, { fit: 'cover' })
    .jpeg({ quality: 92 })
    .toFile('scripts/test_sauvage_large.jpg');

  console.log('Generated test_sauvage_large.jpg');
}

test();

