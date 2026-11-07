import ftp from 'basic-ftp';
import { enterPassiveModeIPv4 } from 'basic-ftp/dist/transfer.js';

async function testOne() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  client.timeout = 20000;
  client.prepareTransfer = enterPassiveModeIPv4;

  try {
    await client.access({
      host: '66.94.103.134',
      user: 'admin@suhaperfumes.com',
      password: 'dd2244889',
      port: 21,
    });
    console.log('Connected! Uploading one test image...');
    await client.uploadFrom('public/images/products/savauge-large.jpg', '/images/products/savauge-large.jpg');
    console.log('✓ Successfully uploaded savauge-large.jpg via FTP!');
  } catch (err) {
    console.error('Upload error:', err.message);
  } finally {
    client.close();
  }
}

testOne().catch(console.error);

