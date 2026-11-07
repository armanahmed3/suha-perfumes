import net from 'net';

function checkPort(port) {
  return new Promise((resolve) => {
    const s = net.connect(port, '66.94.103.134', () => {
      s.destroy();
      resolve(true);
    });
    s.setTimeout(2500, () => {
      s.destroy();
      resolve(false);
    });
    s.on('error', () => resolve(false));
  });
}

async function main() {
  const p21 = await checkPort(21);
  const p443 = await checkPort(443);
  console.log(`Port 21: ${p21 ? 'OPEN' : 'BLOCKED'} | Port 443: ${p443 ? 'OPEN' : 'BLOCKED'}`);
}

main();

