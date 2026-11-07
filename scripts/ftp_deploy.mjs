import ftp from 'basic-ftp';
import path from 'path';

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  client.timeout = 30000;

  try {
    console.log('Connecting to FTP 66.94.103.134...');
    await client.access({
      host: '66.94.103.134',
      user: 'admin@suhaperfumes.com',
      password: 'dd2244889',
      port: 21,
      secure: false,
    });

    console.log('Connected! Uploading deploy_dist to root...');
    const localDir = path.resolve('deploy_dist');
    await client.uploadFromDir(localDir);

    console.log('\n======================================');
    console.log('✓ DEPLOYMENT TO FTP COMPLETED SUCCESSFULLY!');
    console.log('======================================');
  } catch (err) {
    console.error('FTP Deployment failed:', err);
  } finally {
    client.close();
  }
}

deploy();

