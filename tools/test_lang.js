const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, locale: 'es-ES' }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file:///home/user/neon-horde/index.html'); await p.waitForSelector('#sMenu:not([hidden])');
  console.log('es-ES browser, first load:', await p.evaluate(() => [document.querySelector('#bPlay').textContent, document.querySelector('#bLang').textContent, document.documentElement.lang].join(' | ')));
  await p.screenshot({ path: '/tmp/claude-0/lang_en.png' });
  await p.click('#bLang', { force: true }); await p.waitForTimeout(200);
  console.log('after toggle:', await p.evaluate(() => [document.querySelector('#bPlay').textContent, document.querySelector('#bShop').textContent, document.querySelector('#bLang').textContent].join(' | ')));
  await p.screenshot({ path: '/tmp/claude-0/lang_es.png' });
  await p.reload(); await p.waitForSelector('#sMenu:not([hidden])'); console.log('after reload (saved):', await p.evaluate(() => document.querySelector('#bPlay').textContent));
  await p.click('#bPlay', { force: true }); await p.waitForTimeout(300); await p.evaluate(() => { for (let i = 0; i < 100; i++) window.__nh.update(1 / 30); window.__nh.addXp(100); }); await p.waitForTimeout(500);
  console.log('level-up title:', await p.evaluate(() => document.querySelector('#upT').textContent));
  await p.evaluate(() => { while (window.__nh.S() === 'levelup') window.__nh.chooseUp(0); }); await p.click('#bPause', { force: true }); await p.waitForTimeout(300);
  await p.click('#bLang2', { force: true }); await p.waitForTimeout(200); console.log('pause toggle ->', await p.evaluate(() => [document.querySelector('#pauseT').textContent, document.querySelector('#bLang2').textContent].join(' | ')));
  console.log('errors', errs.length ? errs : 'none'); await b.close();
})();
