const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const out = '/home/user/gem-miner/promo/';
  for (const [n, w, h] of [['cover_1920x1080', 1920, 1080], ['cover_800x1200', 800, 1200], ['cover_800x800', 800, 800]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); await p.goto(`file://${out}scene.html?w=${w}&h=${h}&t=1`); await p.screenshot({ path: out + n + '.png' }); await p.close();
  }
  await b.close();
})();
