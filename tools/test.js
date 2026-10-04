const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader'] }); const errs = [];
  for (const [name, vp] of [['desk', { width: 1280, height: 720 }], ['phone', { width: 390, height: 780 }]]) {
    const p = await b.newPage({ viewport: vp, hasTouch: name === 'phone' }); p.on('pageerror', (e) => errs.push(name + ' ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(name + ' ' + m.text()); });
    await p.goto('file:///home/user/gem-miner/index.html'); await p.waitForSelector('#app:not([hidden])');
    const box = await (await p.$('#cv')).boundingBox();
    for (let i = 0; i < 30; i++) await p.mouse.click(box.x + box.width / 2, box.y + box.height * .45);
    await p.waitForTimeout(300);
    await p.evaluate(() => { const g = __gm; g.earn(1e5); g.buyGen(0); g.buyGen(1); g.buyGen(2); });
    await p.waitForTimeout(800); await p.screenshot({ path: `/tmp/claude-0/shot_${name}1.png` });
    await p.evaluate(() => { const g = __gm; g.earn(5e8); for (let i = 0; i < 8; i++) { g.buyGen(i); } });
    await p.click('#tabs button[data-k=upg]'); await p.waitForTimeout(400); await p.screenshot({ path: `/tmp/claude-0/shot_${name}2.png` });
    const r = await p.evaluate(() => { const g = __gm; g.earn(3e9); return { ps: g.PS, gain: g.crysGain(), taps: g.S().taps }; }); console.log(name, JSON.stringify(r));
    await p.evaluate(() => __gm.onAscend()); await p.waitForTimeout(300); await p.screenshot({ path: `/tmp/claude-0/shot_${name}3.png` });
    await p.click('#m1'); await p.waitForTimeout(600); console.log(name, 'after ascend', JSON.stringify(await p.evaluate(() => ({ cr: __gm.S().cr, g: __gm.S().g, c: __gm.S().c[0] }))));
    await p.reload(); await p.waitForSelector('#app:not([hidden])'); console.log(name, 'persisted cr', await p.evaluate(() => __gm.S().cr));
    await p.click('#bDaily'); await p.waitForTimeout(300); await p.screenshot({ path: `/tmp/claude-0/shot_${name}4.png` });
  }
  console.log('errors', errs.length ? errs : 'none'); await b.close();
})();
