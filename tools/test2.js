const { chromium } = require('/opt/node-tools/node_modules/playwright'); const SHOT = '/tmp/claude-0/nh2_';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [];
  for (const [name, vp, touch] of [['d', { width: 1280, height: 720 }, false], ['m', { width: 390, height: 780 }, true]]) {
    const p = await b.newPage({ viewport: vp, hasTouch: touch }); p.on('pageerror', (e) => errs.push(name + e.message));
    await p.goto('file:///home/user/neon-horde/index.html'); await p.waitForSelector('#sMenu:not([hidden])'); await p.waitForTimeout(500); await p.screenshot({ path: SHOT + name + 'menu.png' });
    await p.click('#bPlay', { force: true }); await p.waitForTimeout(200);
    await p.evaluate(() => { const n = __nh; n.addXp(100); for (let i = 0; i < 400; i++) n.update(1 / 30); });
    await p.waitForTimeout(600); await p.screenshot({ path: SHOT + name + 'up.png' });
    await p.evaluate(() => { __nh.chooseUp(0); const n = __nh; const P = n.P(); P.w.axe = { lvl: 3, cd: 0 }; P.w.zap = { lvl: 3, cd: 0 }; P.w.nova = { lvl: 2, cd: 0 }; P.hp = P.max; for (let i = 0; i < 150; i++) { n.update(1 / 30); } });
    await p.waitForTimeout(300); await p.screenshot({ path: SHOT + name + 'fx.png' });
    await p.evaluate(() => { const n = __nh; n.G().t = 421; for (let i = 0; i < 5; i++) n.update(1 / 30); n.P().hp = 1e9; n.P().max = 1e9; });
    await p.evaluate(() => { const n = __nh; for (let i = 0; i < 60; i++) n.update(1 / 30); }); await p.waitForTimeout(300); await p.screenshot({ path: SHOT + name + 'boss.png' });
    await p.evaluate(() => { const n = __nh; for (const e of n.E()) if (e.t === 'boss2') { e.hp = 1; } n.P().w.bolt.lvl = 6; for (let i = 0; i < 200 && n.S() === 'play'; i++) n.update(1 / 30); if (n.S() === 'levelup') n.chooseUp(0); });
    await p.waitForTimeout(1500); console.log(name, await p.evaluate(() => __nh.S())); await p.screenshot({ path: SHOT + name + 'end.png' });
  }
  console.log('errors', errs.length ? errs : 'none'); await b.close();
})();
