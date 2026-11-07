async function main() {
  const pRes = await fetch('http://localhost:3000/api/products');
  const pData = await pRes.json();
  console.log('HTTP Status:', pRes.status);
  console.log('Total products returned from /api/products:', pData.products?.length);

  for (const p of pData.products.slice(0, 5)) {
    console.log(`\n- ${p.name} (${p.slug}):`);
    for (const v of p.variants) {
      console.log(`    ${v.size}: PKR ${v.price} (image: ${v.image})`);
    }
  }

  const sRes = await fetch('http://localhost:3000/api/settings');
  const sData = await sRes.json();
  console.log('\nSettings:', sData.settings);

  // Test admin stats
  const authRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@suha.com', password: 'dd2244889' })
  });
  console.log('\nAdmin login status:', authRes.status);
  const authData = await authRes.json();
  console.log('Admin user:', authData.user?.name, authData.user?.role);
}

main().catch(console.error);

