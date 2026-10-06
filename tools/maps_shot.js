const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [];
  const p = await b.newPage({ viewport: { width: 800, height: 520 } }); p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.addInitScript(() => { try { localStorage.setItem('bumperorbs-v1', JSON.stringify({ seen: 1, name: 'SwiftPanda42', lang: 'en' })); } catch (e) {} });
  await p.route('**/*', (r) => (r.request().url().startsWith('file:') ? r.continue() : r.abort())); await p.goto('file:///home/user/bumper-orbs/index.html'); await p.waitForSelector('#sMenu:not([hidden])');
  await p.click('#bSolo', { force: true }); await p.waitForTimeout(3800);
  for (let m = 0; m < 6; m++) {
    await p.evaluate((m) => { const s = window.__bo.sim(); s.map = m; s.t = m === 3 ? 28 : 16; s.R = m === 3 ? 300 : 300; s.hole = m === 3 ? 90 : 40; s.phase = 2; s.orbs.forEach((o, i) => { const a = i * 1.25, r = m === 3 ? 190 : 120; o.x = Math.cos(a) * r; o.y = Math.sin(a) * r; o.vx = o.vy = 0; o.alive = true; o.fall = 0; o.ix = o.iy = 0; }); s.picks = [{ id: 1, k: 1, x: 40, y: -190, age: 2 }]; }, m);
    await p.waitForTimeout(250); await p.screenshot({ path: `/tmp/claude-0/map_${m}.png` });
  }
  console.log('errors', errs.length ? errs : 'none'); await b.close();
})();
