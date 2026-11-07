import fs from 'fs';
import path from 'path';

const SRC = 'scripts/zip_fresh';
const OUT = 'public/images/products';

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// Exact mapping to the real camera photos from the zip
const PHOTO_MAP = {
  '212-men':          { small: 'WA0057', large: 'WA0119' },
  'ameer-al-oud':     { small: 'WA0087', large: 'WA0097' },
  'aqva-bulgari':     { small: 'WA0094', large: 'WA0154' },
  'blue-d-channel':   { small: 'WA0070', large: 'WA0137' },
  'boom-shell':       { small: 'WA0066', large: 'WA0106' },
  'cigar':            { small: 'WA0086', large: 'WA0096' },
  'ck-1':             { small: 'WA0060', large: 'WA0125' },
  'dylan-blue':       { small: 'WA0078', large: 'WA0149' },
  'ferhenite':        { small: 'WA0064', large: 'WA0145' },
  'gucchi-flora':     { small: 'WA0058', large: 'WA0130' },
  'gucchi-guilty':    { small: 'WA0083', large: 'WA0170' },
  'guchi-bloom':      { small: 'WA0068', large: 'WA0160' },
  'hugo-boss':        { small: 'WA0062', large: 'WA0117' },
  'invectus':         { small: 'WA0094', large: 'WA0136' },
  'ismyaki':          { small: 'WA0074', large: 'WA0127' },
  'janan-sport':      { small: 'WA0081', large: 'WA0122' },
  'office-4-men':     { small: 'WA0061', large: 'WA0153' },
  'open':             { small: 'WA0076', large: 'WA0140' },
  'poision':          { small: 'WA0080', large: 'WA0104' },
  'savauge':          { small: 'WA0091', large: 'WA0138' },
  'sweet-lavendar':   { small: 'WA0065', large: 'WA0102' },
  'tommy-hilfiger':   { small: 'WA0073', large: 'WA0125' },
  'zara':             { small: 'WA0087', large: 'WA0097' },
};

console.log('Copying 100% PURE ORIGINAL photos directly from zip...');
let count = 0;

for (const [slug, item] of Object.entries(PHOTO_MAP)) {
  const smallSrc = path.join(SRC, `IMG-20261103-${item.small}.jpg`);
  const largeSrc = path.join(SRC, `IMG-20261103-${item.large}.jpg`);

  const smallDest = path.join(OUT, `${slug}-small.jpg`);
  const largeDest = path.join(OUT, `${slug}-large.jpg`);

  if (fs.existsSync(smallSrc)) {
    fs.copyFileSync(smallSrc, smallDest);
    count++;
  } else {
    console.error(`Missing small photo: ${smallSrc}`);
  }

  if (fs.existsSync(largeSrc)) {
    fs.copyFileSync(largeSrc, largeDest);
    count++;
  } else {
    console.error(`Missing large photo: ${largeSrc}`);
  }
}

console.log(`✓ Successfully copied ${count}/46 PURE ORIGINAL real photos into ${OUT}`);
