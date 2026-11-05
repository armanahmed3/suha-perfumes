import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const products = await db.product.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { variants: true }
  });
  console.log('COUNT:', products.length);
  for (const p of products) {
    console.log(`\n[${p.slug}] ${p.name} | cat=${p.category} | gender=${p.gender} | featured=${p.featured}`);
    for (const v of p.variants) console.log(`   ${v.size} price=${v.price} img=${v.image}`);
  }
}
main().then(()=>process.exit(0));
