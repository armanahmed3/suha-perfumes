import https from 'https';

https.get('https://suhaperfumes.com/', (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('HTML length:', html.length);
    const regex = /<img[^>]+src=["']([^"']+)["']/g;
    let match;
    const found = [];
    while ((match = regex.exec(html)) !== null) {
      found.push(match[1]);
    }
    console.log('Found', found.length, 'img src tags:');
    console.log(found);

    // Also check if any Next.js images or background images exist
    const prodImgMatches = [...html.matchAll(/\/images\/products\/[a-zA-Z0-9_-]+\.jpg/g)].map(m => m[0]);
    console.log('Found product image paths in HTML:', prodImgMatches.length);
    console.log(prodImgMatches.slice(0, 10));
  });
});

