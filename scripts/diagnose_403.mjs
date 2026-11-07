import ftp from 'basic-ftp';
import { enterPassiveModeIPv4 } from 'basic-ftp/dist/transfer.js';

async function diagnose() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  client.timeout = 15000;
  client.prepareTransfer = enterPassiveModeIPv4;

  try {
    await client.access({
      host: '66.94.103.134',
      user: 'admin@suhaperfumes.com',
      password: 'dd2244889',
      port: 21,
    });
    console.log('Connected to FTP!');

    console.log('\n--- ROOT LISTING ---');
    const rootList = await client.list('/');
    for (const item of rootList) {
      console.log(item.rawModifiedAt, item.permissions, item.size, item.name);
    }

    console.log('\n--- _next LISTING ---');
    try {
      const nextList = await client.list('/_next');
      for (const item of nextList) {
        console.log(item.rawModifiedAt, item.permissions, item.size, item.name);
      }
    } catch (e) {
      console.error('Error listing /_next:', e.message);
    }

    console.log('\n--- _next/static LISTING ---');
    try {
      const staticList = await client.list('/_next/static');
      for (const item of staticList) {
        console.log(item.rawModifiedAt, item.permissions, item.size, item.name);
      }
    } catch (e) {
      console.error('Error listing /_next/static:', e.message);
    }

    console.log('\n--- _next/static/chunks LISTING ---');
    try {
      const chunksList = await client.list('/_next/static/chunks');
      console.log(`Found ${chunksList.length} files in /_next/static/chunks`);
      for (const item of chunksList.slice(0, 10)) {
        console.log(item.rawModifiedAt, item.permissions, item.size, item.name);
      }
    } catch (e) {
      console.error('Error listing /_next/static/chunks:', e.message);
    }

  } catch (err) {
    console.error('FTP Error:', err);
  } finally {
    client.close();
  }
}

diagnose().catch(console.error);

