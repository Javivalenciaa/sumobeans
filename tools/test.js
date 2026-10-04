const { chromium } = require('/opt/node-tools/node_modules/playwright');
const SHOT = '/tmp/claude-0/nh_';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/TUNNEL|ERR_/.test(m.text())) errs.push(m.text()); });
  await p.goto('file:///home/user/neon-horde/index.html'); await p.waitForSelector('#sMenu:not([hidden])'); await p.waitForTimeout(800); await p.screenshot({ path: SHOT + 'menu.png' });
  await p.click('#bPlay', { force: true }); await p.waitForTimeout(300);
  // bot: flee from enemy centroid, always pick option 0; fast-forward the simulation
  const run = (secs, name) => p.evaluate(({ secs }) => {
    const n = __nh; const keys = window.__keys || (window.__keys = {});
    for (let i = 0; i < secs * 30; i++) {
      if (n.S() === 'levelup') { n.chooseUp(0); continue; } if (n.S() !== 'play') break;
      const P = n.P(); let fx = 0, fy = 0; for (const e of n.E()) { const dx = P.x - e.x, dy = P.y - e.y, d2 = dx * dx + dy * dy + 1; if (d2 < 260 * 260) { fx += dx / d2 * 100; fy += dy / d2 * 100; } }
      const l = Math.hypot(fx, fy); const ang = performance.now() / 4000 + Math.sin(i / 90);
      const mx = l > .002 ? fx / l : Math.cos(ang), my = l > .002 ? fy / l : Math.sin(ang);
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' })); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' })); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' })); window.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }));
      if (mx > .3) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' })); if (mx < -.3) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' })); if (my > .3) window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' })); if (my < -.3) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      n.update(1 / 30);
    }
    const P = n.P(), G = n.G(); return { state: n.S(), t: Math.round(G.t), hp: Math.round(P.hp), lvl: P.lvl, kills: P.kills, en: n.enemiesN(), w: Object.keys(P.w).map((k) => k + P.w[k].lvl).join(','), pas: JSON.stringify(P.p) };
  }, { secs });
  for (const [secs, name] of [[40, '40'], [80, '120'], [125, '245'], [100, '345']]) { const r = await run(secs); console.log(name, JSON.stringify(r)); await p.waitForTimeout(250); await p.screenshot({ path: SHOT + name + '.png' }); if (r.state !== 'play') break; }
  console.log('errors', errs.length ? errs : 'none'); await b.close();
})();
