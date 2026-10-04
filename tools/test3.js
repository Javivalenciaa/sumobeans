const { chromium } = require('/opt/node-tools/node_modules/playwright'); const SHOT = '/tmp/claude-0/nh3_';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file:///home/user/neon-horde/index.html'); await p.waitForSelector('#sMenu:not([hidden])');
  await p.click('#bPlay', { force: true }); await p.waitForTimeout(200);
  console.log(await p.evaluate(() => { const n = __nh; const P = n.P(); P.w.zap = { lvl: 6, cd: 0 }; P.max = P.hp = 1e9; const e = n.spawnAt('boss2', P.x + 60, P.y); e.hp = 5; n.G().boss = e; n.G().boss1 = n.G().boss2 = true; for (let i = 0; i < 90 && n.S() !== 'over'; i++) { if (n.S() === 'levelup') n.chooseUp(0); n.update(1 / 30); } return { s: n.S(), win: n.G().win, gold: n.SV().gold }; }));
  await p.waitForTimeout(1600); await p.screenshot({ path: SHOT + 'win.png' });
  await p.click('#bX2', { force: true }); await p.waitForTimeout(200); console.log('gold after x2', await p.evaluate(() => __nh.SV().gold));
  await p.click('#bAgain', { force: true }); await p.waitForTimeout(300); console.log('again ->', await p.evaluate(() => __nh.S()));
  await p.evaluate(() => { const n = __nh; n.P().hp = 1; n.P().max = 100; n.spawnAt('brute', n.P().x, n.P().y); for (let i = 0; i < 400 && n.S() === 'play'; i++) { n.update(1 / 30); } }); await p.waitForTimeout(1200);
  console.log('after death', await p.evaluate(() => __nh.S())); await p.screenshot({ path: SHOT + 'dead.png' });
  await p.click('#bRevive', { force: true }); await p.waitForTimeout(200); console.log('after revive', await p.evaluate(() => __nh.S()));
  console.log('errors', errs.length ? errs : 'none'); await b.close();
})();
