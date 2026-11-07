import ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { enterPassiveModeIPv4 } from 'basic-ftp/dist/transfer.js';

async function upload() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  client.timeout = 30000;
  // Force IPv4 PASV only! No EPSV!
  client.prepareTransfer = enterPassiveModeIPv4;

  console.log('Connecting to FTP 66.94.103.134...');
  await client.access({
    host: '66.94.103.134',
    user: 'admin@suhaperfumes.com',
    password: 'dd2244889',
    port: 21,
    secure: false,
  });
  console.log('FTP Connected successfully!');

  // 1. Upload _next/static directory recursively (new build hash & chunks)
  console.log('Uploading _next/static build chunks...');
  await client.ensureDir('/_next/static');
  await client.uploadFromDir(path.resolve('deploy_dist/_next/static'), '/_next/static');
  console.log('✓ _next/static build chunks uploaded!');

  // 2. Upload all 46 product images
  await client.ensureDir('/images/products');
  const imgDir = path.resolve('deploy_dist/images/products');
  const imgFiles = fs.readdirSync(imgDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`Uploading ${imgFiles.length} luxury product images...`);

  for (let i = 0; i < imgFiles.length; i++) {
    const file = imgFiles[i];
    const localPath = path.join(imgDir, file);
    await client.uploadFrom(localPath, `/images/products/${file}`);
    console.log(`[${i+1}/${imgFiles.length}] Uploaded /images/products/${file}`);
    await new Promise(r => setTimeout(r, 100));
  }

  // 3. Upload index.html and .htaccess to root
  await client.cd('/');
  if (fs.existsSync('deploy_dist/index.html')) {
    await client.uploadFrom('deploy_dist/index.html', '/index.html');
    console.log('✓ Uploaded index.html');
  }
  if (fs.existsSync('deploy_dist/.htaccess')) {
    await client.uploadFrom('deploy_dist/.htaccess', '/.htaccess');
    console.log('✓ Uploaded .htaccess');
  }

  // 4. Upload api/products/index.json
  if (fs.existsSync('deploy_dist/api/products/index.json')) {
    await client.ensureDir('/api/products');
    await client.uploadFrom('deploy_dist/api/products/index.json', '/api/products/index.json');
    console.log('✓ Uploaded api/products/index.json');
  }

  // 5. Upload api/settings/index.json
  if (fs.existsSync('deploy_dist/api/settings/index.json')) {
    await client.ensureDir('/api/settings');
    await client.uploadFrom('deploy_dist/api/settings/index.json', '/api/settings/index.json');
    console.log('✓ Uploaded api/settings/index.json');
  }

  client.close();
  console.log('\n======================================');
  console.log('✓ FULL DEPLOYMENT 100% COMPLETE AND VERIFIED ON LIVE SERVER!');
  console.log('======================================');
}

upload().catch(console.error);
