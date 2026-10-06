// 2 browsers + the relay: host creates a room, guest joins by code, a match runs, the host leaves and the guest takes over
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const { spawn } = require('child_process');
(async () => {
  const srv = spawn('node', ['/home/user/bumper-orbs/server/server.js'], { env: { ...process.env, PORT: '8097', ALLOWED_ORIGINS: '*', QUIET: '1' } }); await new Promise((r) => setTimeout(r, 800));
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [];
  const mk = async (name) => { const p = await b.newPage({ viewport: { width: 900, height: 600 } }); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); await p.addInitScript(() => { try { localStorage.setItem('bumperorbs-v1', JSON.stringify({ seen: 1, name: 'T' + Math.floor(Math.random() * 99), lang: 'en' })); } catch (e) {} });
    await p.route('**/*', (r) => (r.request().url().startsWith('file:') ? r.continue() : r.abort())); await p.goto('file:///home/user/bumper-orbs/index.html?server=ws://localhost:8097'); await p.waitForSelector('#sMenu:not([hidden])'); return p; };
  const A = await mk('A'), B = await mk('B');
  await A.click('#bCreate', { force: true }); await A.waitForSelector('#sLobby:not([hidden])'); const code = await A.evaluate(() => document.querySelector('#lobCode').textContent); console.log('code', code);
  await B.click('#bJoin', { force: true }); await B.fill('#codeIn', code); await B.click('#bJoinGo', { force: true }); await B.waitForSelector('#sLobby:not([hidden])'); await A.waitForTimeout(600);
  console.log('lobby A players:', await A.evaluate(() => window.__bo.sim().orbs.length), '| B roster:', await B.evaluate(() => window.__bo.NET.roster.length));
  await A.click('#bStart', { force: true }); await B.waitForTimeout(1500);
  console.log('B state after start:', await B.evaluate(() => window.__bo.S() + '/' + window.__bo.mode()));
  await B.keyboard.down('d'); await B.waitForTimeout(1500); await B.keyboard.press(' '); await B.waitForTimeout(2500); await B.keyboard.up('d');
  const v = await B.evaluate(() => { const v = window.__bo.view(); return v && { p: v.p, orbs: v.orbs.map((o) => o.name + '@' + Math.round(o.x) + ',' + Math.round(o.y)).join(' '), me: v.meId }; }); console.log('B view:', JSON.stringify(v));
  const hostSees = await A.evaluate(() => { const s = window.__bo.sim(); const o = s.get(1); return o && { human: o.human, x: Math.round(o.x), vx: Math.round(o.vx), dashCd: o.dashCd }; }); console.log('host sees guest orb:', JSON.stringify(hostSees));
  await B.screenshot({ path: '/tmp/claude-0/bo_guest.png' });
  // host leaves mid-match -> the guest becomes host and the match continues
  await A.close(); await B.waitForTimeout(1500); console.log('B mode after host left:', await B.evaluate(() => window.__bo.mode() + '/' + window.__bo.S() + '/phase ' + (window.__bo.sim() && window.__bo.sim().phase)));
  await B.evaluate(() => { const s = window.__bo.sim(); for (let i = 0; i < 6000 && s.phase !== 4; i++) s.step(1 / 30); }); await B.waitForTimeout(4000); console.log('B final state:', await B.evaluate(() => window.__bo.S() + ' phase=' + window.__bo.sim().phase + ' round=' + window.__bo.sim().round + ' scores=' + window.__bo.sim().orbs.map((o) => o.score).join(',')));
  console.log('errors', errs.length ? errs : 'none'); await b.close(); srv.kill(); process.exit(0);
})();
