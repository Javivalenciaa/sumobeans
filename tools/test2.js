const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader'] }); const errs = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file:///home/user/gem-miner/index.html'); await p.waitForSelector('#app:not([hidden])');
  const box = await (await p.$('#cv')).boundingBox();
  for (let i = 0; i < 40; i++) await p.mouse.click(box.x + box.width / 2, box.y + box.height * .45);
  console.log('after 40 taps', await p.evaluate(() => ({ d: __gm.S().d, rocks: __gm.S().rocks, q: __gm.S().q.l.map((q) => q.k + q.got) })));
  await p.evaluate(() => { const S = __gm.S(); S.d = 10; S.rhp = 0; __gm.earn(1e6); __gm.buyGen(0); __gm.buyGen(1); });
  await p.evaluate(() => { __gm.S().d = 10; __gm.S().rhp = 0; }); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/claude-0/s2_boss.png' });
  await p.evaluate(() => { const S = __gm.S(); for (let i = 0; i < 25; i++) __gm.doTap(600, 300); });
  await p.evaluate(() => __gm.earn(1e12)); await p.evaluate(() => { __gm.S().d = 10; __gm.S().rhp = 1; __gm.doTap(600, 300); });
  console.log('after boss', await p.evaluate(() => ({ d: __gm.S().d, art: __gm.S().art })));
  await p.click('#bArt'); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/claude-0/s2_coll.png' }); await p.click('#m3');
  await p.click('#bQ'); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/claude-0/s2_q.png' }); await p.click('#m3');
  await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/claude-0/s2_main.png' });
  console.log('errors', errs.length ? errs : 'none'); await b.close();
})();
