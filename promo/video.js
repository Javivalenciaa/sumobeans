const { chromium } = require('/opt/node-tools/node_modules/playwright'); const fs = require('fs'); const out = '/home/user/gem-miner/promo/';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader'] });
  // 1) animated intro frames (title reveal + camera push), 30 fps, 5 s
  fs.rmSync(out + 'f', { recursive: true, force: true }); fs.mkdirSync(out + 'f');
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await p.goto(`file://${out}scene.html?w=1280&h=720&t=0`);
  for (let i = 0; i < 150; i++) { await p.evaluate((t) => window.draw(t, true), i / 30); await p.screenshot({ path: out + `f/${String(i).padStart(4, '0')}.png` }); }
  await p.close();
  // 2) real gameplay: scripted taps, buys, skills, boss
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: out + 'v', size: { width: 1280, height: 720 } } });
  const g = await ctx.newPage(); await g.goto('file:///home/user/gem-miner/index.html'); await g.waitForSelector('#app:not([hidden])');
  const box = await (await g.$('#cv')).boundingBox(); const tap = () => g.mouse.click(box.x + box.width / 2 + (Math.random() - .5) * 80, box.y + box.height * .45 + (Math.random() - .5) * 60);
  for (let i = 0; i < 45; i++) { await tap(); await g.waitForTimeout(70); }
  await g.evaluate(() => { __gm.earn(150); __gm.buyGen(0); }); await g.waitForTimeout(500);
  for (let i = 0; i < 25; i++) { await tap(); await g.waitForTimeout(60); }
  await g.evaluate(() => { __gm.earn(2e4); for (let i = 0; i < 4; i++) __gm.buyGen(1), __gm.buyGen(2); __gm.buyGen(0); });
  for (let i = 0; i < 25; i++) { await tap(); await g.waitForTimeout(60); }
  await g.evaluate(() => { __gm.earn(5e7); for (let i = 0; i < 6; i++) for (let k = 0; k < 6; k++) __gm.buyGen(k); }); await g.waitForTimeout(400);
  await g.click('#actions .act:nth-child(1)'); for (let i = 0; i < 40; i++) { await tap(); await g.waitForTimeout(45); }
  await g.click('#actions .act:nth-child(2)'); await g.waitForTimeout(500); await g.evaluate(() => { const S = __gm.S(); S.d = 10; S.rhp = 0; __gm.earn(1e9); for (let k = 0; k < 9; k++) __gm.buyGen(k); });
  for (let i = 0; i < 60; i++) { await tap(); await g.waitForTimeout(50); }
  await g.click('#tabs button[data-k=upg]'); await g.waitForTimeout(700); await g.click('#tabs button[data-k=miners]'); await g.waitForTimeout(1500);
  await ctx.close(); await b.close();
})();
