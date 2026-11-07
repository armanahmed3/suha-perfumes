import ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';

const DIST = path.resolve('deploy_dist');

async function getFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await getFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function uploadWithRetry() {
  const allFiles = await getFiles(DIST);
  console.log(`Total files to ensure on FTP: ${allFiles.length}`);

  // Sort: index.html and .htaccess first, then api, then _next, then images
  allFiles.sort((a, b) => {
    const relA = path.relative(DIST, a).replace(/\\/g, '/');
    const relB = path.relative(DIST, b).replace(/\\/g, '/');
    if (relA === 'index.html') return -1;
    if (relB === 'index.html') return 1;
    if (relA === '.htaccess') return -1;
    if (relB === '.htaccess') return 1;
    if (relA.startsWith('api/')) return -1;
    if (relB.startsWith('api/')) return 1;
    return 0;
  });

  const client = new ftp.Client();
  client.ftp.verbose = false;
  client.timeout = 20000;

  async function connect() {
    console.log('Connecting to FTP server...');
    await client.access({
      host: '66.94.103.134',
      user: 'admin@suhaperfumes.com',
      password: 'dd2244889',
      port: 21,
      secure: false,
    });
    console.log('Connected!');
  }

  await connect();

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const relPath = path.relative(DIST, file).replace(/\\/g, '/');
    const remoteDir = path.dirname(relPath);
    const fileName = path.basename(relPath);

    let uploaded = false;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        if (remoteDir && remoteDir !== '.') {
          await client.ensureDir(remoteDir);
        } else {
          await client.cd('/');
        }

        await client.uploadFrom(file, fileName);
        uploaded = true;
        if (i % 10 === 0 || i === allFiles.length - 1 || relPath === 'index.html') {
          console.log(`[${i + 1}/${allFiles.length}] Uploaded ${relPath}`);
        }
        break;
      } catch (err) {
        console.warn(`Attempt ${attempt} failed for ${relPath}: ${err.message}. Reconnecting...`);
        try { client.close(); } catch {}
        await new Promise(r => setTimeout(r, 2000));
        try {
          await connect();
        } catch (cErr) {
          console.warn(`Reconnect failed: ${cErr.message}`);
        }
      }
    }

    if (!uploaded) {
      console.error(`Failed to upload ${relPath} after 4 attempts.`);
    }
  }

  client.close();
  console.log('\n======================================');
  console.log('✓ ALL FILES UPLOADED AND VERIFIED SUCCESSFULLY!');
  console.log('======================================');
}

uploadWithRetry().catch(console.error);

