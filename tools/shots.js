const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [name, vp] of [['d', { width: 1280, height: 720 }], ['m', { width: 390, height: 780 }]]) {
    const p = await b.newPage({ viewport: vp, hasTouch: name === 'm' }); await p.addInitScript(() => { try { localStorage.setItem('bumperorbs-v1', JSON.stringify({ seen: 1, name: 'SwiftPanda42', lang: 'en', coins: 300 })); } catch (e) {} });
    await p.route('**/*', (r) => (r.request().url().startsWith('file:') ? r.continue() : r.abort())); await p.goto('file:///home/user/bumper-orbs/index.html'); await p.waitForSelector('#sMenu:not([hidden])'); await p.waitForTimeout(1500);
    await p.screenshot({ path: `/tmp/claude-0/bo_${name}_menu.png` });
    await p.click('#bSolo', { force: true }); await p.waitForTimeout(1200); await p.screenshot({ path: `/tmp/claude-0/bo_${name}_count.png` });
    await p.waitForTimeout(2600); await p.evaluate(() => { const s = window.__bo.sim(); for (const o of s.orbs) if (o.id !== 0) { o.x = (o.id - 102) * 55; o.y = 40 + o.id * 4; } s.orbs[0].x = -100; s.orbs[0].y = 20; s.picks.push({ id: 99, k: 0, x: 120, y: -120, age: 1 }, { id: 98, k: 3, x: -140, y: 140, age: 1 }); s.orbs[1].shield = 4; s.orbs[2].dash = .2; });
    await p.waitForTimeout(500); await p.screenshot({ path: `/tmp/claude-0/bo_${name}_play.png` });
    await p.evaluate(() => { const s = window.__bo.sim(); s.orbs[0].score = 1; s.orbs.forEach((o) => { o.score = Math.min(o.score, 1); }); s.orbs[1].score = 2; s.orbs[1].kills = 3; s.phase = 4; s.matchWinner = s.orbs[1].id; }); await p.waitForTimeout(3600); await p.screenshot({ path: `/tmp/claude-0/bo_${name}_res.png` });
    await p.click('#bMenu', { force: true }); await p.waitForTimeout(500); await p.click('#bSkins', { force: true }); await p.waitForTimeout(400); await p.screenshot({ path: `/tmp/claude-0/bo_${name}_skins.png` }); await p.close();
  }
  await b.close();
})();
