import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('scripts/all_zip_images').filter(f => f.endsWith('.jpg')).sort();
console.log('Total files:', files.length);

if (!fs.existsSync('scripts/contact_sheets')) fs.mkdirSync('scripts/contact_sheets', { recursive: true });

async function makeSheet(sheetIdx, fileSubset) {
  const tileW = 400;
  const tileH = 550;
  const cols = 4;
  const rows = Math.ceil(fileSubset.length / cols);
  const sheetW = cols * tileW;
  const sheetH = rows * tileH;

  const composites = [];
  for (let i = 0; i < fileSubset.length; i++) {
    const fn = fileSubset[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * tileW;
    const y = row * tileH;

    const buf = await sharp(path.join('scripts/all_zip_images', fn))
      .resize(tileW, tileH - 50, { fit: 'contain', background: '#181818' })
      .toBuffer();

    const waNumber = fn.replace('IMG-20261103-', '').replace('.jpg', '');
    const svgLabel = Buffer.from(
      `<svg width="${tileW}" height="50">
        <rect width="100%" height="100%" fill="#000000"/>
        <text x="50%" y="33" fill="#FFD700" font-size="24" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">${waNumber}</text>
      </svg>`
    );

    composites.push({ input: buf, top: y, left: x });
    composites.push({ input: svgLabel, top: y + tileH - 50, left: x });
  }

  await sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 3,
      background: { r: 20, g: 20, b: 20 }
    }
  })
  .composite(composites)
  .jpeg({ quality: 85 })
  .toFile(`scripts/contact_sheets/sheet_${sheetIdx}.jpg`);
  console.log(`Saved sheet_${sheetIdx}.jpg with ${fileSubset.length} images`);
}

async function run() {
  const batchSize = 12;
  let sheetIdx = 0;
  for (let i = 0; i < files.length; i += batchSize) {
    const subset = files.slice(i, i + batchSize);
    await makeSheet(sheetIdx++, subset);
  }
}
run();

