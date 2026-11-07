import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');

const DIST = path.resolve('deploy_dist');

async function buildDeploy() {
  console.log('Building deployment bundle in deploy_dist...');
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST, { recursive: true });

  // 1. Fetch products & settings from local standalone server
  console.log('Fetching products & settings...');
  const pRes = await fetch('http://localhost:3000/api/products');
  const pData = await pRes.json();
  const pJson = JSON.stringify(pData);

  const sRes = await fetch('http://localhost:3000/api/settings');
  const sData = await sRes.json();
  const sJson = JSON.stringify(sData);

  // 2. Fetch index.html from local server
  console.log('Fetching index.html...');
  const htmlRes = await fetch('http://localhost:3000/');
  let html = await htmlRes.text();

  // Inject initial preloaded data in <head> for zero-delay hydration & 100% offline fallback
  const preloadScript = `<script>window.__INITIAL_PRODUCTS__ = ${pJson}.products || []; window.__INITIAL_SETTINGS__ = ${sJson}.settings || null;</script>`;
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${preloadScript}</head>`);
  } else {
    html = preloadScript + html;
  }
  fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');
  console.log('✓ Saved index.html with preloaded catalog state');

  // 3. Copy _next/static
  const nextStaticSrc = path.resolve('.next/static');
  const nextStaticDest = path.join(DIST, '_next/static');
  fs.cpSync(nextStaticSrc, nextStaticDest, { recursive: true });
  console.log('✓ Copied _next/static');

  // 4. Copy public assets (all 46 real bottle images, logo, favicon, robots)
  const publicSrc = path.resolve('public');
  fs.cpSync(publicSrc, DIST, { recursive: true });
  console.log('✓ Copied public assets');

  // 5. API endpoints (products, settings, orders, contact, reviews)
  const apiDir = path.join(DIST, 'api');
  fs.mkdirSync(path.join(apiDir, 'products'), { recursive: true });
  fs.mkdirSync(path.join(apiDir, 'settings'), { recursive: true });
  fs.mkdirSync(path.join(apiDir, 'orders'), { recursive: true });
  fs.mkdirSync(path.join(apiDir, 'contact'), { recursive: true });
  fs.mkdirSync(path.join(apiDir, 'reviews'), { recursive: true });

  fs.writeFileSync(path.join(apiDir, 'products', 'index.json'), pJson, 'utf8');
  fs.writeFileSync(path.join(apiDir, 'products', 'products.json'), pJson, 'utf8');

  // Robust PHP index handlers for API
  const phpProducts = `<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
readfile(__DIR__ . '/index.json');
exit;
`;
  fs.writeFileSync(path.join(apiDir, 'products', 'index.php'), phpProducts, 'utf8');

  fs.writeFileSync(path.join(apiDir, 'settings', 'index.json'), sJson, 'utf8');
  const phpSettings = `<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
readfile(__DIR__ . '/index.json');
exit;
`;
  fs.writeFileSync(path.join(apiDir, 'settings', 'index.php'), phpSettings, 'utf8');

  // 5b. Next.js image proxy PHP fallback
  const nextImgDir = path.join(DIST, '_next', 'image');
  fs.mkdirSync(nextImgDir, { recursive: true });
  const phpImgProxy = `<?php
$url = $_GET['url'] ?? '';
if (!empty($url)) {
    if (strpos($url, '/images/') === 0 || strpos($url, 'images/') === 0) {
        $target = '/' . ltrim($url, '/');
        header('Location: ' . $target, true, 302);
        exit;
    }
}
http_response_code(404);
echo 'Not found';
`;
  fs.writeFileSync(path.join(nextImgDir, 'index.php'), phpImgProxy, 'utf8');
  fs.writeFileSync(path.join(DIST, '_next', 'image.php'), phpImgProxy, 'utf8');

  // 5c. Orders API Handler
  const phpOrders = `<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$ordersFile = __DIR__ . '/orders.json';
if (!file_exists($ordersFile)) {
    file_put_contents($ordersFile, json_encode([]));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid order data']);
        exit;
    }
    $orderNumber = 'SUHA-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 6));
    $order = [
        'id' => uniqid('ord_'),
        'orderNumber' => $orderNumber,
        'customerName' => $data['customerName'] ?? 'Customer',
        'email' => $data['email'] ?? '',
        'phone' => $data['phone'] ?? '',
        'address' => $data['address'] ?? '',
        'city' => $data['city'] ?? 'Karachi',
        'subtotal' => (float)($data['subtotal'] ?? 0),
        'shipping' => (float)($data['shipping'] ?? 0),
        'total' => (float)($data['total'] ?? 0),
        'paymentMethod' => $data['paymentMethod'] ?? 'COD',
        'status' => 'PENDING',
        'items' => $data['items'] ?? [],
        'createdAt' => date('c'),
    ];

    $orders = json_decode(file_get_contents($ordersFile), true) ?: [];
    array_unshift($orders, $order);
    file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT));

    echo json_encode(['order' => $order]);
    exit;
}

// GET orders
$orders = json_decode(file_get_contents($ordersFile), true) ?: [];
echo json_encode(['orders' => $orders]);
`;
  fs.writeFileSync(path.join(apiDir, 'orders', 'index.php'), phpOrders, 'utf8');

  // 5d. Contact API Handler
  const phpContact = `<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$msgFile = __DIR__ . '/messages.json';
if (!file_exists($msgFile)) file_put_contents($msgFile, json_encode([]));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $msg = [
        'id' => uniqid('msg_'),
        'name' => $data['name'] ?? '',
        'email' => $data['email'] ?? '',
        'subject' => $data['subject'] ?? '',
        'message' => $data['message'] ?? '',
        'createdAt' => date('c'),
    ];
    $msgs = json_decode(file_get_contents($msgFile), true) ?: [];
    array_unshift($msgs, $msg);
    file_put_contents($msgFile, json_encode($msgs, JSON_PRETTY_PRINT));
    echo json_encode(['ok' => true]);
    exit;
}
echo json_encode(['messages' => json_decode(file_get_contents($msgFile), true) ?: []]);
`;
  fs.writeFileSync(path.join(apiDir, 'contact', 'index.php'), phpContact, 'utf8');

  // 5e. Reviews API Handler
  const phpReviews = `<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$revFile = __DIR__ . '/reviews.json';
if (!file_exists($revFile)) file_put_contents($revFile, json_encode([]));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $rev = [
        'id' => uniqid('rev_'),
        'slug' => $data['slug'] ?? '',
        'name' => $data['name'] ?? 'Customer',
        'rating' => (int)($data['rating'] ?? 5),
        'comment' => $data['comment'] ?? '',
        'createdAt' => date('c'),
    ];
    $revs = json_decode(file_get_contents($revFile), true) ?: [];
    array_unshift($revs, $rev);
    file_put_contents($revFile, json_encode($revs, JSON_PRETTY_PRINT));
    echo json_encode(['review' => $rev]);
    exit;
}
echo json_encode(['reviews' => json_decode(file_get_contents($revFile), true) ?: []]);
`;
  fs.writeFileSync(path.join(apiDir, 'reviews', 'index.php'), phpReviews, 'utf8');

  // Root index.php and 404.html fallbacks
  fs.writeFileSync(path.join(DIST, 'index.php'), `<?php include_once __DIR__ . '/index.html'; ?>\n`, 'utf8');
  fs.writeFileSync(path.join(DIST, '404.html'), html, 'utf8');

  // 6. Complete bulletproof .htaccess
  const htaccess = `DirectoryIndex index.html index.php index.json
ErrorDocument 404 /index.html

<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Image proxy fallback
  RewriteCond %{QUERY_STRING} url=([^&]+)
  RewriteRule ^_next/image/?$ /_next/image/index.php [L,QSA]

  # 2. API routing fallbacks
  RewriteRule ^api/products/?$ /api/products/index.php [L,QSA]
  RewriteRule ^api/settings/?$ /api/settings/index.php [L,QSA]
  RewriteRule ^api/orders/?$ /api/orders/index.php [L,QSA]
  RewriteRule ^api/contact/?$ /api/contact/index.php [L,QSA]
  RewriteRule ^api/reviews/?$ /api/reviews/index.php [L,QSA]

  # 3. SPA Route Fallback: if requested path is not a file/folder, serve index.html
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_URI} !^/api/
  RewriteRule ^ index.html [L]
</IfModule>

# MIME types
<IfModule mod_mime.c>
  AddType application/javascript .js
  AddType text/css .css
  AddType application/json .json
  AddType image/svg+xml .svg
  AddType image/jpeg .jpg .jpeg
  AddType image/png .png
  AddType image/webp .webp
  AddType image/x-icon .ico
</IfModule>

# Gzip compression for speed
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache headers for static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 month"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/webp "access plus 1 month"
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
</IfModule>
`;
  fs.writeFileSync(path.join(DIST, '.htaccess'), htaccess, 'utf8');
  console.log('✓ Created .htaccess with SPA fallback and API handlers');

  // 7. Create ZIP archive with UNIX 0755 / 0644 permissions using archiver
  console.log('Creating ZIP archive with POSIX 755/644 permissions...');
  await createUnixZip(DIST, path.resolve('suha_deploy.zip'));
  console.log('✓ suha_deploy.zip created successfully!');

  // Also create products_images_only.zip
  await createUnixZip(path.resolve('public/images/products'), path.resolve('products_images_only.zip'));
  console.log('✓ products_images_only.zip created successfully!');

  // 8. Create full source project zip
  console.log('Creating complete source code ZIP...');
  await createSourceZip(path.resolve('suha_full_project_source.zip'));
  console.log('✓ suha_full_project_source.zip created successfully!');

  console.log('\n======================================');
  console.log('✓ FULL DEPLOYMENT PACKAGE READY!');
  console.log('======================================');
}

function createUnixZip(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = new ZipArchive({
      zlib: { level: 9 },
    });

    output.on('close', () => {
      console.log(`Saved ${path.basename(outPath)} (${archive.pointer()} total bytes)`);
      resolve();
    });

    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    function addDirRecursive(currentDir, relativePath = '') {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const relItemPath = relativePath ? `${relativePath}/${item}` : item;
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          archive.append(null, {
            name: relItemPath + '/',
            mode: 0o755,
          });
          addDirRecursive(fullPath, relItemPath);
        } else {
          archive.file(fullPath, {
            name: relItemPath,
            mode: 0o644,
          });
        }
      }
    }

    addDirRecursive(sourceDir);
    archive.finalize();
  });
}

function createSourceZip(outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = new ZipArchive({
      zlib: { level: 9 },
    });

    output.on('close', () => {
      console.log(`Saved ${path.basename(outPath)} (${archive.pointer()} total bytes)`);
      resolve();
    });

    archive.on('error', (err) => reject(err));
    archive.pipe(output);

    const includeRoots = ['src', 'prisma', 'public', 'scripts'];
    const includeFiles = [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'tailwind.config.ts',
      'postcss.config.mjs',
      'next.config.ts',
      'README.md',
      '.gitignore',
      'components.json',
      '.env'
    ];

    for (const f of includeFiles) {
      if (fs.existsSync(f)) {
        archive.file(f, { name: f, mode: 0o644 });
      }
    }

    function addSourceDir(dir, relPrefix) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item === 'node_modules' || item === '.next' || item === 'deploy_dist' || item === 'zip_fresh' || item.endsWith('.zip')) {
          continue;
        }
        const full = path.join(dir, item);
        const rel = relPrefix ? `${relPrefix}/${item}` : item;
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          archive.append(null, { name: rel + '/', mode: 0o755 });
          addSourceDir(full, rel);
        } else {
          archive.file(full, { name: rel, mode: 0o644 });
        }
      }
    }

    for (const root of includeRoots) {
      if (fs.existsSync(root)) {
        archive.append(null, { name: root + '/', mode: 0o755 });
        addSourceDir(root, root);
      }
    }

    archive.finalize();
  });
}

buildDeploy().catch(console.error);
