async function test() {
  const res = await fetch('https://suhaperfumes.com/');
  console.log('HTML status:', res.status);
  const html = await res.text();
  console.log('HTML length:', html.length);

  // find all script and link src/href
  const scripts = [...html.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
  const links = [...html.matchAll(/href="([^"]+\.css)"/g)].map(m => m[1]);
  const allAssets = [...new Set([...scripts, ...links])];
  console.log('Total unique assets in HTML:', allAssets.length);

  let failedCount = 0;
  for (const asset of allAssets) {
    const url = asset.startsWith('http') ? asset : 'https://suhaperfumes.com' + (asset.startsWith('/') ? '' : '/') + asset;
    try {
      const aRes = await fetch(url);
      if (aRes.status !== 200) {
        console.error('FAILED ASSET:', url, '-> Status:', aRes.status);
        failedCount++;
      } else {
        console.log('OK:', asset, 'size:', aRes.headers.get('content-length'));
      }
    } catch (e) {
      console.error('ERROR FETCHING:', url, e.message);
      failedCount++;
    }
  }

  // Also test manifest files:
  const buildManifestMatch = html.match(/\/_next\/static\/([^\/]+)\/_buildManifest\.js/);
  if (buildManifestMatch) {
    const buildId = buildManifestMatch[1];
    console.log('Detected Build ID:', buildId);
    const manifests = [
      `https://suhaperfumes.com/_next/static/${buildId}/_buildManifest.js`,
      `https://suhaperfumes.com/_next/static/${buildId}/_ssgManifest.js`
    ];
    for (const mUrl of manifests) {
      const mRes = await fetch(mUrl);
      console.log('Manifest:', mUrl, 'Status:', mRes.status);
      if (mRes.status !== 200) failedCount++;
    }
  } else {
    console.log('No build manifest found in HTML');
  }

  console.log(`\nResult: ${failedCount} assets failed.`);
}

test().catch(console.error);

