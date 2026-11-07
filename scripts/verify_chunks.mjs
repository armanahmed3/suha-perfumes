import https from 'https';
import fs from 'fs';

const html = fs.readFileSync('deploy_dist/index.html', 'utf8');
const re = /src=["'](\/_next\/static\/[^"']+)["']/g;
let m;
const scripts = [];
while ((m = re.exec(html)) !== null) {
  scripts.push(m[1]);
}
console.log('Script chunks count:', scripts.length);

async function test() {
  for (const s of scripts.slice(0, 5)) {
    await new Promise(r => {
      https.get('https://suhaperfumes.com' + s, res => {
        console.log(s, '-> status:', res.statusCode, 'size:', res.headers['content-length']);
        r();
      });
    });
  }
}
test();

