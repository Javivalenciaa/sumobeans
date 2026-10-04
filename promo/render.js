const { chromium } = require('/opt/node-tools/node_modules/playwright'); const out = '/home/user/neon-horde/promo/';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [n, w, h, big] of [['cover_1920x1080', 1920, 1080, 1], ['cover_800x1200', 800, 1200, 0], ['cover_800x800', 800, 800, 0]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); await p.goto('file:///home/user/neon-horde/index.html'); await p.waitForSelector('#sMenu:not([hidden])');
    await p.click('#bPlay', { force: true }); await p.waitForTimeout(200);
    await p.evaluate((big) => {
      window.__nohud = true; document.querySelector('#topbtns').hidden = true; const n = __nh, P = n.P(); P.max = P.hp = 1e9; 
      P.w = { bolt: { lvl: 5, cd: 0 }, orbit: { lvl: 5, cd: 0 }, aura: { lvl: 3, cd: 0 }, zap: { lvl: 4, cd: 0 }, nova: { lvl: 3, cd: 0 } }; n.G().t = 200; n.G().boss1 = true; n.G().boss2 = true; n.G().elite = 1e9;
      const ring = (type, cnt, r0, r1) => { for (let i = 0; i < cnt; i++) { const a = Math.random() * 6.28, d = r0 + Math.random() * (r1 - r0); n.spawnAt(type, P.x + Math.cos(a) * d, P.y + Math.sin(a) * d * .8); } };
      ring('slime', 40, 140, 520); ring('bat', 34, 120, 500); ring('brute', 6, 220, 420); ring('watcher', 5, 260, 440); n.spawnAt('boss1', P.x + (big ? 330 : 150), P.y - (big ? 180 : 230));
      for (let i = 0; i < 20; i++) n.update(1 / 30); const E = n.E(); for (const e of E) e.spd *= .3;
      for (let i = 0; i < 28; i++) n.update(1 / 30);
    }, big);
    await p.waitForTimeout(250);
    await p.evaluate(({ w, h }) => { const d = document.createElement('div'); d.style.cssText = `position:fixed;left:0;right:0;top:${h > w ? 4 : 2}%;text-align:center;z-index:99;pointer-events:none;padding-bottom:3%;background:linear-gradient(rgba(20,12,30,.5),rgba(20,12,30,0))`; const f = Math.min(w, h * 1.1) * (h > w ? .2 : .13); const o = Math.max(2, f * .03); d.innerHTML = `<div style="font:900 ${f}px Impact,'Arial Black','DejaVu Sans',sans-serif;line-height:.9;letter-spacing:3px;background:linear-gradient(#fffbc0 0%,#ffd23a 40%,#ff8a1a 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(${o}px 0 0 #2a1408) drop-shadow(-${o}px 0 0 #2a1408) drop-shadow(0 ${o}px 0 #2a1408) drop-shadow(0 -${o}px 0 #2a1408) drop-shadow(0 ${o * 3}px 0 #8a3a0a) drop-shadow(0 ${o * 5}px ${o * 3}px rgba(0,0,0,.45))">WILD HORDE</div><div style="font:900 ${f * .24}px 'Trebuchet MS',sans-serif;letter-spacing:${f * .12}px;color:#fff;text-shadow:0 3px 0 #2a1408,2px 2px 0 #2a1408,-2px 2px 0 #2a1408,2px -2px 0 #2a1408,-2px -2px 0 #2a1408;margin-top:${f * .06}px">SURVIVE THE SWARM</div>`; document.body.appendChild(d); }, { w, h });
    await p.waitForTimeout(300); await p.screenshot({ path: out + n + '.png' }); await p.close();
  }
  await b.close();
})();
