import ftp from 'basic-ftp';

async function fixChmod() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  client.timeout = 10000;

  try {
    await client.access({
      host: '66.94.103.134',
      user: 'admin@suhaperfumes.com',
      password: 'dd2244889',
      port: 21,
    });
    console.log('Connected to FTP control connection on port 21!');

    const cmds = [
      'SITE CHMOD 755 _next',
      'SITE CHMOD 755 _next/static',
      'SITE CHMOD 755 _next/static/chunks',
      'SITE CHMOD 755 _next/static/RvSWtzzTK6bzZtWwny2Qp',
      'SITE CHMOD 755 api',
      'SITE CHMOD 755 images',
      'SITE CHMOD 755 images/products',
      'SITE CHMOD 644 index.html',
      'SITE CHMOD 644 .htaccess'
    ];

    for (const cmd of cmds) {
      try {
        const res = await client.send(cmd);
        console.log(`> ${cmd} -> ${res.code} ${res.message}`);
      } catch (e) {
        console.warn(`Warning on ${cmd}:`, e.message);
      }
    }

  } catch (err) {
    console.error('FTP Error:', err.message);
  } finally {
    client.close();
  }
}

fixChmod().catch(console.error);

