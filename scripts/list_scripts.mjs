import fs from 'fs';
import https from 'https';

const html = fs.readFileSync('deploy_dist/index.html', 'utf8');
const re = /<script[^>]+src=["']([^"']+)["']/g;
let m;
const scripts = [];
while ((m = re.exec(html)) !== null) {
  scripts.push(m[1]);
}
console.log('Scripts count:', scripts.length);

async function checkAll() {
  for (const s of scripts) {
    const res = await new Promise(r => {
      https.get('https://suhaperfumes.com' + s, res => {
        r({ status: res.statusCode, size: res.headers['content-length'] });
      }).on('error', e => r({ error: e.message }));
    });
    console.log(s, '=>', res);
  }
}
checkAll();
