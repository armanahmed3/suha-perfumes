import fs from 'fs';
import path from 'path';

const DIST = path.resolve('deploy_dist');

async function buildDeploy() {
  console.log('Building deployment bundle in deploy_dist...');
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST, { recursive: true });

  // 1. Fetch index.html from local server
  const htmlRes = await fetch('http://localhost:3000/');
  let html = await htmlRes.text();
  fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');
  console.log('✓ Saved index.html');

  // 2. Copy _next/static
  const nextStaticSrc = path.resolve('.next/static');
  const nextStaticDest = path.join(DIST, '_next/static');
  fs.cpSync(nextStaticSrc, nextStaticDest, { recursive: true });
  console.log('✓ Copied _next/static');

  // 3. Copy public images & assets
  const publicSrc = path.resolve('public');
  fs.cpSync(publicSrc, DIST, { recursive: true });
  console.log('✓ Copied public assets');

  // 4. API endpoints (products & settings)
  const apiDir = path.join(DIST, 'api');
  fs.mkdirSync(path.join(apiDir, 'products'), { recursive: true });
  fs.mkdirSync(path.join(apiDir, 'settings'), { recursive: true });
  fs.mkdirSync(path.join(apiDir, 'orders'), { recursive: true });
  fs.mkdirSync(path.join(apiDir, 'contact'), { recursive: true });
  fs.mkdirSync(path.join(apiDir, 'reviews'), { recursive: true });
  fs.mkdirSync(path.join(apiDir, 'auth'), { recursive: true });

  const pRes = await fetch('http://localhost:3000/api/products');
  const pJson = await pRes.text();
  fs.writeFileSync(path.join(apiDir, 'products', 'index.json'), pJson, 'utf8');
  fs.writeFileSync(path.join(apiDir, 'products', 'products.json'), pJson, 'utf8');

  const sRes = await fetch('http://localhost:3000/api/settings');
  const sJson = await sRes.text();
  fs.writeFileSync(path.join(apiDir, 'settings', 'index.json'), sJson, 'utf8');
  console.log('✓ Generated static JSON for products and settings');

  // 4b. Next.js image proxy fallback (redirects /_next/image?url=... directly to url)
  const nextImgDir = path.join(DIST, '_next', 'image');
  fs.mkdirSync(nextImgDir, { recursive: true });
  const phpImgProxy = `<?php
$url = $_GET['url'] ?? '';
if (!empty($url)) {
    // Sanitize: ensure it starts with /images/
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

  // 5. PHP API Handler for Apache backend (Orders, Contact, Reviews)
  const phpOrders = `<?php
header('Content-Type: application/json');
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

  const phpContact = `<?php
header('Content-Type: application/json');
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

  // 6. .htaccess for clean routing & JSON responses
  const htaccess = `DirectoryIndex index.html index.php

<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# Redirect /_next/image?url=... to direct file
RewriteCond %{QUERY_STRING} url=([^&]+)
RewriteRule ^_next/image/?$ %1? [R=302,L]

# Route /api/products (with or without query string) to index.json
RewriteRule ^api/products/?$ /api/products/index.json [L,QSA]
RewriteRule ^api/settings/?$ /api/settings/index.json [L]

# Route /api/orders to php handler
RewriteRule ^api/orders/?$ /api/orders/index.php [L,QSA]

# Route /api/contact to php handler
RewriteRule ^api/contact/?$ /api/contact/index.php [L,QSA]

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
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
</IfModule>
</IfModule>
`;
  fs.writeFileSync(path.join(DIST, '.htaccess'), htaccess, 'utf8');
  console.log('✓ Created .htaccess with clean routing');

  console.log('✓ Full deployment package ready in deploy_dist!');
}

buildDeploy().catch(console.error);

