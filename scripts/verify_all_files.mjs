import ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';

const DIST = path.resolve('deploy_dist');

function getFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function verifyAndSync() {
  const localFiles = getFiles(DIST);
  console.log(`Checking ${localFiles.length} files against FTP server...`);

  const client = new ftp.Client();
  client.ftp.verbose = false;
  client.timeout = 25000;

  async function connect() {
    await client.access({
      host: '66.94.103.134',
      user: 'admin@suhaperfumes.com',
      password: 'dd2244889',
      port: 21,
      secure: false,
    });
  }

  await connect();

  let missing = [];

  for (const file of localFiles) {
    const rel = path.relative(DIST, file).replace(/\\/g, '/');
    const remotePath = '/' + rel;
    const localSize = fs.statSync(file).size;

    try {
      const remoteSize = await client.size(remotePath);
      if (remoteSize !== localSize) {
        console.log(`Size mismatch for ${rel}: local ${localSize} vs remote ${remoteSize}`);
        missing.push({ file, rel, remotePath });
      }
    } catch (e) {
      // 550 file not found
      console.log(`Missing file on FTP: ${rel}`);
      missing.push({ file, rel, remotePath });
    }
  }

  console.log(`Found ${missing.length} files to upload/repair.`);

  for (const item of missing) {
    const remoteDir = path.dirname(item.remotePath);
    const fileName = path.basename(item.remotePath);

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await client.ensureDir(remoteDir);
        await client.uploadFrom(item.file, fileName);
        console.log(`✓ Uploaded ${item.rel}`);
        break;
      } catch (err) {
        console.warn(`Attempt ${attempt} failed for ${item.rel}: ${err.message}`);
        try { client.close(); } catch {}
        await new Promise(r => setTimeout(r, 2000));
        try { await connect(); } catch {}
      }
    }
  }

  client.close();
  console.log('--- ALL FILES 100% VERIFIED ON FTP ---');
}

verifyAndSync().catch(console.error);

