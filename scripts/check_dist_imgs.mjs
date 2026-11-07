import fs from 'fs';

const html = fs.readFileSync('deploy_dist/index.html', 'utf8');
console.log('HTML length:', html.length);

const re = /<img[^>]+src=["']([^"']+)["']/g;
let m;
const imgs = [];
while ((m = re.exec(html)) !== null) {
  imgs.push(m[1]);
}
console.log('Total img tags in index.html:', imgs.length);
imgs.forEach(src => console.log(' ->', src));

// Check if /_next/image exists anywhere in index.html or js bundles
const hasNextImg = html.includes('/_next/image');
console.log('Does HTML contain /_next/image?', hasNextImg);

