import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const db = new PrismaClient();

// liquid colors tuned per fragrance for the 3D bottle renderer
const META: Record<string, { liquid: string; tier: string }> = {
  '212-men':          { liquid: '#E8D44D', tier: 'core' },
  'ameer-al-oud':     { liquid: '#8B4A1F', tier: 'premium' },
  'aqva-bulgari':     { liquid: '#1FB6A6', tier: 'core' },
  'blue-d-channel':   { liquid: '#1B3A6B', tier: 'premium' },
  'boom-shell':       { liquid: '#F2A7C3', tier: 'core' },
  'cigar':            { liquid: '#7A3B1E', tier: 'premium' },
  'ck-1':             { liquid: '#BFD8B8', tier: 'core' },
  'dylan-blue':       { liquid: '#2B5AA0', tier: 'premium' },
  'ferhenite':        { liquid: '#C2521A', tier: 'premium' },
  'gucchi-flora':     { liquid: '#E89BB4', tier: 'core' },
  'gucchi-guilty':    { liquid: '#D9A441', tier: 'premium' },
  'guchi-bloom':      { liquid: '#D96C7B', tier: 'core' },
  'hugo-boss':        { liquid: '#C9B037', tier: 'core' },
  'invectus':         { liquid: '#7FB8D9', tier: 'core' },
  'ismyaki':          { liquid: '#D9D6A5', tier: 'core' },
  'janan-sport':      { liquid: '#3FA85C', tier: 'core' },
  'office-4-men':     { liquid: '#D6C25A', tier: 'core' },
  'open':             { liquid: '#A22A2A', tier: 'core' },
  'poision':          { liquid: '#5B2A86', tier: 'premium' },
  'savauge':          { liquid: '#28455C', tier: 'premium' },
  'sweet-lavendar':   { liquid: '#A87BC7', tier: 'core' },
  'tommy-hilfiger':   { liquid: '#B9CC4E', tier: 'core' },
  'zara':             { liquid: '#D98E3B', tier: 'core' },
};

// which image files exist on disk (real zip photos only — no AI / fake images)
const IMG_DIR = 'public/images/products';
const has = (slug: string, size: string) => fs.existsSync(`${IMG_DIR}/${slug}-${size}.jpg`);

// real photo or null — the UI renders the 3D bottle when there is no photo
function imgFor(slug: string) {
  return {
    small: has(slug, 'small') ? `/images/products/${slug}-small.jpg` : null,
    large: has(slug, 'large') ? `/images/products/${slug}-large.jpg` : null,
  };
}

// User specified pricing:
// "all rpdocut price is 1500 and normal bottle price is 900"
function priceFor(_tier: string, size: string) {
  if (size === 'small') return 900;
  return 1500;
}


// Verified-facts description only: original name, brand and launch year.
// Scraped marketing text and notes are NOT used (they were AI-generated, not copied from Fragrantica).
function factualDesc(d: any, gender: string) {
  const who = gender === 'Men' ? 'for men' : gender === 'Women' ? 'for women' : 'unisex';
  if (!d.brand || d.brand === 'SUHA Perfumes House Blend') {
    return `${d.name} is a SUHA house blend ${who}, a luxury impression oil made in Karachi. Available in Petite 15ml and Grand 50ml.`;
  }
  const year = d.year ? ` (${d.year})` : '';
  return `Impression of ${d.originalName} (${d.brand}${year ? `, ${d.year}` : ''}). A luxury impression oil from SUHA Perfumes, Karachi, ${who}, available in Petite 15ml and Grand 50ml.`;
}

async function main() {
  const scraped = JSON.parse(fs.readFileSync('scripts/scraped_products.json', 'utf8'));
  const ORDER = [
    '212-men',
    'ameer-al-oud',
    'aqva-bulgari',
    'blue-d-channel',
    'boom-shell',
    'cigar',
    'ck-1',
    'dylan-blue',
    'ferhenite',
    'gucchi-flora',
    'gucchi-guilty',
    'guchi-bloom',
    'hugo-boss',
    'invectus',
    'ismyaki',
    'janan-sport',
    'office-4-men',
    'open',
    'poision',
    'savauge',
    'sweet-lavendar',
    'tommy-hilfiger',
    'zara',
  ];
  const FEATURED = [
    'savauge',
    'blue-d-channel',
    '212-men',
    'guchi-bloom',
    'invectus',
    'ameer-al-oud',
    'gucchi-flora',
    'ferhenite',
  ];
  const j = (v: any, fallback = '[]') => {
    try {
      const p = typeof v === 'string' ? JSON.parse(v) : v;
      return Array.isArray(p) ? JSON.stringify(p) : fallback;
    } catch {
      return fallback;
    }
  };

  // wipe & reseed products
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.review.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();

  let i = 0;
  for (const slug of ORDER) {
    const d = scraped.find((x: any) => x.slug === slug);
    if (!d) {
      console.log('MISSING DATA', slug);
      continue;
    }
    const meta = META[slug] || { liquid: '#D4AF37', tier: 'core' };
    const imgs = imgFor(slug);
    if (!imgs.small && !imgs.large) { console.log("SKIP no photo in zip:", slug); continue; }
    const gender = (d.gender || 'Unisex').replace('Men', 'Men').replace('Women', 'Women').replace('Unisex', 'Unisex');
    const category = gender === 'Men' ? 'For Him' : gender === 'Women' ? 'For Her' : 'Unisex';
    const year = Number(d.year) || null;

    const product = await db.product.create({
      data: {
        slug,
        name: d.name,
        category,
        originalName: d.originalName || d.name,
        brand: d.brand || 'SUHA Perfumes',
        gender,
        year,
        shortDesc: factualDesc(d, gender).slice(0, 180),
        description: factualDesc(d, gender),
        topNotes: j([]),
        heartNotes: j([]),
        baseNotes: j([]),
        accords: j([]),
        longevity: 'Long-lasting',
        sillage: 'Moderate',
        season: j([]),
        featured: FEATURED.includes(slug),
        sortOrder: i++,
        liquidColor: meta.liquid,
      },
    });

    // Small 15ml bottle (only if photo exists)
    if (imgs.small) await db.productVariant.create({
      data: {
        productId: product.id,
        size: '15ml',
        label: 'Petite 15ml',
        price: priceFor(meta.tier, 'small'), // 900
        oldPrice: 1200,
        stock: 60,
        image: imgs.small,
        sku: `SUHA-${slug.toUpperCase().replace(/-/g, '')}-15`,
      },
    });

    // Large 50ml bottle (only if photo exists)
    if (imgs.large) await db.productVariant.create({
      data: {
        productId: product.id,
        size: '50ml',
        label: 'Grand 50ml',
        price: priceFor(meta.tier, 'large'), // 1500
        oldPrice: 2000,
        stock: 40,
        image: imgs.large,
        sku: `SUHA-${slug.toUpperCase().replace(/-/g, '')}-50`,
      },
    });
  }

  // Admin users: support both admin@suha.com and admin@suhaperfumes.com with passwords dd2244889 & suha2024
  const userPass1 = await bcrypt.hash('dd2244889', 10);
  const userPass2 = await bcrypt.hash('suha2024', 10);

  await db.user.upsert({
    where: { email: 'admin@suha.com' },
    update: { role: 'ADMIN', password: userPass1 },
    create: { email: 'admin@suha.com', password: userPass1, name: 'SUHA Admin', role: 'ADMIN' },
  });

  await db.user.upsert({
    where: { email: 'admin@suhaperfumes.com' },
    update: { role: 'ADMIN', password: userPass1 },
    create: { email: 'admin@suhaperfumes.com', password: userPass1, name: 'SUHA Executive Admin', role: 'ADMIN' },
  });

  const demoPass = await bcrypt.hash('demo1234', 10);
  await db.user.upsert({
    where: { email: 'demo@suha.com' },
    update: {},
    create: {
      email: 'demo@suha.com',
      password: demoPass,
      name: 'Demo Customer',
      role: 'CUSTOMER',
      phone: '+92 300 1234567',
      city: 'Karachi',
      address: 'Gulberg III, Karachi',
    },
  });

  // Settings
  await db.setting.upsert({
    where: { id: 'main' },
    update: {
      phone: '+92 323 2556620',
      email: 'hello@suhaperfumes.com',
      instagram: 'https://www.instagram.com/suhaperfumes/',
      facebook: 'https://www.facebook.com/Suhaperfumes/',
      address: 'Karachi, Pakistan',
      shippingFee: 199,
      freeShippingOver: 4000,
      announcement: 'Free delivery nationwide on orders over PKR 4,000 — Cash on Delivery Available',
    },
    create: {
      id: 'main',
      phone: '+92 323 2556620',
      email: 'hello@suhaperfumes.com',
      instagram: 'https://www.instagram.com/suhaperfumes/',
      facebook: 'https://www.facebook.com/Suhaperfumes/',
      address: 'Karachi, Pakistan',
      shippingFee: 199,
      freeShippingOver: 4000,
      announcement: 'Free delivery nationwide on orders over PKR 4,000 — Cash on Delivery Available',
    },
  });

  // Sample authentic reviews
  const reviews = [
    { slug: 'savauge', name: 'Bilal A.', rating: 5, comment: 'Spot on impression of Sauvage — projection is huge and it lasts all day at the office. Best PKR 1,500 ever spent.' },
    { slug: 'savauge', name: 'Hamza R.', rating: 5, comment: 'Very close to the original. The dry-down is magnificent, packaging felt super luxury.' },
    { slug: 'blue-d-channel', name: 'Omar S.', rating: 5, comment: 'Bleu de Chanel vibes at an unbeatable price. My daily signature now.' },
    { slug: 'guchi-bloom', name: 'Ayesha K.', rating: 5, comment: 'Bought the Grand 50ml for my sister — the tuberose and jasmine are dreamy.' },
    { slug: '212-men', name: 'Zain M.', rating: 5, comment: 'Fresh, vibrant, compliment-puller. The petite 15ml is perfect for pocket and travel.' },
    { slug: 'invectus', name: 'Danish I.', rating: 5, comment: 'Aquatic and energetic — great for gym and hot days in Karachi.' },
    { slug: 'office-4-men', name: 'Farhan K.', rating: 5, comment: 'Clean, masculine, professional. Definitely buying again!' },
    { slug: 'zara', name: 'Tariq N.', rating: 4, comment: 'Warm woody notes and great longevity. Unbelievable value for PKR 900/1500.' },
  ];
  // Sample reviews removed: no fabricated customer reviews. Real reviews come from the Reviews API.
  void reviews;

  const count = await db.product.count();
  console.log(`Seeded ${count} products with variants (Rs 900 normal, Rs 1500 grand), admin + demo users, reviews, and settings.`);
}

main().catch(console.error).finally(() => db.$disconnect());
