const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.route('**/*', (r) => (r.request().url().startsWith('file:') ? r.continue() : r.abort()));
  await p.goto('file:///home/user/bumper-orbs/index.html'); await p.waitForSelector('#sMenu:not([hidden])'); await p.waitForTimeout(1500); await p.screenshot({ path: '/tmp/claude-0/bo_menu.png' });
  await p.evaluate(() => document.querySelector('#sHow') && (document.querySelector('#bHowX').click()));
  await p.click('#bSolo', { force: true }); await p.waitForTimeout(3600);
  await p.keyboard.down('d'); await p.waitForTimeout(900); await p.keyboard.press(' '); await p.waitForTimeout(700); await p.screenshot({ path: '/tmp/claude-0/bo_play.png' }); await p.keyboard.up('d');
  const r = await p.evaluate(() => { const s = window.__bo.sim(); const out = { phase: s.phase, round: s.round, alive: s.alive().length, R: Math.round(s.R) }; for (let i = 0; i < 4000 && window.__bo.sim().phase !== 4; i++) s.step(1 / 30); out.end = { phase: s.phase, round: s.round, scores: s.orbs.map((o) => o.name + ':' + o.score + '/' + o.kills).join(' ') }; return out; });
  console.log(JSON.stringify(r)); await p.waitForTimeout(4000); console.log('state', await p.evaluate(() => window.__bo.S())); await p.screenshot({ path: '/tmp/claude-0/bo_res.png' });
  console.log('errors', errs.length ? errs : 'none'); await b.close();
})();
