
/* ============================== UI flow ============================== */
const show = (id, on) => { $(id).hidden = !on; };
function hideAll() { ['#sMenu', '#sShop', '#sUp', '#sPause', '#sOver'].forEach((s) => show(s, false)); }
function paintSnd() { const m = muted() && !adOn; $('#bSnd').textContent = m ? '🔇' : '🔊'; $('#bSnd2').textContent = (m ? '🔇 ' : '🔊 ') + t('snd'); }
function toggleSnd() { SV.mute = !SV.mute; paintSnd(); save(); if (!SV.mute) { actx(); sfx('click'); } }
function heroCards() {
  const el = $('#heroes'); el.innerHTML = '';
  HEROES.forEach((h, i) => {
    const owned = SV.heroes.indexOf(i) >= 0, d = document.createElement('button'); d.className = 'hero' + (SV.hero === i ? ' on' : '') + (owned ? '' : ' lock');
    const c = document.createElement('canvas'); c.width = 168; c.height = 184; c.getContext('2d').drawImage(SP['hero' + i], 20, 0, 128, 166); d.appendChild(c);
    d.insertAdjacentHTML('beforeend', '<b>' + L2(h.n) + '</b><span>' + L2(h.role) + '</span>' + (owned ? '' : '<div class="lk">🔒 ' + t('locked') + ' · ' + h.cost + ' 🪙</div>'));
    d.onclick = () => { sfx('click'); if (owned) { SV.hero = i; save(); heroCards(); return; } if (SV.gold >= h.cost) { SV.gold -= h.cost; SV.heroes.push(i); SV.hero = i; save(); heroCards(); menuStats(); sfx('chest'); } else toast(t('gold') + ' ' + SV.gold + ' / ' + h.cost); };
    el.appendChild(d);
  });
}
function menuStats() { $('#mstats').textContent = '🪙 ' + SV.gold + '   ·   ' + t('best') + ' ' + fmtT(SV.best) + '   ·   ' + t('total') + ' ' + SV.kills; }
function toMenu() { state = 'menu'; gameplay(false); musicOn = false; hideAll(); show('#sMenu', true); show('#topbtns', false); heroCards(); menuStats(); paintSnd(); }
function startRun() {
  actx(); newRun(); state = 'play'; hideAll(); show('#topbtns', true); gameplay(true); musicOn = true; musicT = 0; sfx('click'); $('#bPause').hidden = false; for (const k in joy) if (k === 'on') joy.on = false;
}
function pauseGame() { if (state !== 'play') return; state = 'paused'; gameplay(false); show('#sPause', true); $('#pauseH').textContent = t('move'); }
function resumeGame() { if (state !== 'paused') return; state = 'play'; show('#sPause', false); gameplay(true); sfx('click'); }
/* level-up */
function offer() {
  const pool = [], slots = Object.keys(P.w).length;
  for (const k in WEAPONS) { if (P.w[k]) { if (P.w[k].lvl < 6) pool.push({ type: 'w', id: k, wt: 2.2 }); } else if (slots < 4) pool.push({ type: 'w', id: k, wt: 1.3, isNew: true }); }
  for (const k in PASSIVES) if (pm(k) < 5) pool.push({ type: 'p', id: k, wt: 1 });
  const out = []; while (out.length < 3 && pool.length) { let tot = pool.reduce((a, o) => a + o.wt, 0), r = Math.random() * tot, i = 0; for (; i < pool.length - 1; i++) { r -= pool[i].wt; if (r <= 0) break; } out.push(pool.splice(i, 1)[0]); }
  while (out.length < 3) out.push(out.length === 0 ? { type: 'x', id: 'heal' } : { type: 'x', id: 'gold' });
  return out;
}
let curOffer = [];
function renderOffer() {
  curOffer = offer(); const el = $('#upL'); el.innerHTML = ''; $('#upT').textContent = G.chestPick ? t('chest') : t('pick');
  curOffer.forEach((o, i) => {
    let ic, nm, ds, lv = 0, max = 5;
    if (o.type === 'w') { const W = WEAPONS[o.id]; ic = W.ico; nm = L2(W.n); lv = wl(o.id) + 1; max = 6; ds = o.isNew ? L2(W.d) : L2(W.up); }
    else if (o.type === 'p') { const Pp = PASSIVES[o.id]; ic = Pp.ico; nm = L2(Pp.n); lv = pm(o.id) + 1; ds = L2(Pp.d); }
    else if (o.id === 'heal') { ic = '💖'; nm = t('heal'); ds = ''; } else { ic = '🪙'; nm = t('coins'); ds = ''; }
    const b = document.createElement('button'); b.className = 'up'; b.style.animationDelay = i * .06 + 's';
    let pips = ''; if (lv) for (let k = 1; k <= max; k++) pips += '<i class="' + (k <= lv ? 'on' : '') + '"></i>';
    b.innerHTML = '<div class="ic">' + ic + '</div><b>' + (o.isNew ? '<small style="color:#ffc83d">' + t('new') + '</small> ' : '') + nm + '</b><p>' + ds + '</p><div class="pips">' + pips + '</div><kbd>' + (i + 1) + '</kbd>';
    b.onclick = () => chooseUp(i); el.appendChild(b);
  });
}
function openLevelUp() { if (state !== 'play') return; state = 'levelup'; gameplay(false); musicOn = true; renderOffer(); show('#sUp', true); }
function chooseUp(i) {
  if (state !== 'levelup') return; const o = curOffer[i]; if (!o) return; sfx('click');
  if (o.type === 'w') { if (P.w[o.id]) P.w[o.id].lvl++; else P.w[o.id] = { lvl: 1, cd: .2 }; }
  else if (o.type === 'p') { P.p[o.id] = pm(o.id) + 1; if (o.id === 'vital') { P.max += 25; P.hp += 25; } }
  else if (o.id === 'heal') P.hp = Math.min(P.max, P.hp + P.max * .4); else P.gold += 60;
  G.picks = Math.max(0, G.picks - 1); G.chestPick = false; P.inv = Math.max(P.inv, .8);
  if (G.picks > 0) { renderOffer(); return; } show('#sUp', false); state = 'play'; gameplay(true);
}
/* game over */
let lastOver = null;
function gameOver(win) {
  if (G.over) return; G.over = true; G.win = win; state = 'over'; gameplay(false); musicOn = false; sfx(win ? 'win' : 'over'); if (win) happy();
  const base = Math.floor((P.kills * .5 + G.t / 4 + P.lvl * 3 + P.gold) * P.goldMul) + (win ? 250 : 0);
  lastOver = { gold: base, t: G.t, kills: P.kills, lvl: P.lvl, win }; SV.gold += base; SV.kills += P.kills; SV.best = Math.max(SV.best, G.t); SV.runs++; save();
  setTimeout(() => {
    $('#overT').textContent = win ? t('win') : t('over'); $('#overR').innerHTML = '<div><b>' + fmtT(G.t) + '</b><span>' + t('time') + '</span></div><div><b>' + P.kills + '</b><span>' + t('kills') + '</span></div><div><b>' + P.lvl + '</b><span>' + t('lvl') + '</span></div><div><b>' + SV.gold + '</b><span>' + t('gold') + '</span></div>';
    $('#overG').textContent = '+' + base + ' 🪙'; $('#bRevive').hidden = win || P.revived; $('#bX2').disabled = false; $('#bX2').hidden = false; show('#sOver', true);
  }, win ? 900 : 700);
}
function revive() { show('#sOver', false); P.revived = true; G.over = false; P.hp = P.max * .6; P.inv = 3; SV.gold -= lastOver.gold; SV.runs--; SV.kills -= P.kills; save(); fxs.push({ k: 'nova', x: P.x, y: P.y, r: 10, max: 420, life: 1, dmg: 400 + G.t, done: new Set() }); sfx('nova'); state = 'play'; gameplay(true); musicOn = true; }
function afterRun(go) { const wait = performance.now() - CG.lastAd > 100000; if (wait) showAd('midgame', go); else go(); }
/* shop */
function renderShop() {
  $('#shopT').textContent = t('shopT'); $('#shopG').textContent = '🪙 ' + SV.gold; const el = $('#shopL'); el.innerHTML = '';
  SHOP.forEach((s) => { const lv = shopLv(s.id), mx = lv >= s.max, c = shopCost(s.id), b = document.createElement('button'); b.className = 'si' + (!mx && SV.gold >= c ? ' can' : ''); b.innerHTML = '<div class="ic">' + s.ico + '</div><div><b>' + L2(s.n) + ' <small>' + lv + '/' + s.max + '</small></b><span>' + L2(s.d) + '</span></div><em>' + (mx ? t('max') : c + ' 🪙') + '</em>'; b.onclick = () => { if (mx) return; if (SV.gold < c) { toast(t('gold') + ' ' + SV.gold + ' / ' + c); return; } SV.gold -= c; SV.shop[s.id] = lv + 1; save(); sfx('chest'); renderShop(); menuStats(); }; el.appendChild(b); });
}
/* ============================== input ============================== */
window.addEventListener('keydown', (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0) e.preventDefault();
  if (state === 'levelup' && ['1', '2', '3'].indexOf(e.key) >= 0) chooseUp(+e.key - 1);
  if ((e.key === 'Escape' || k === 'p') && !e.repeat) { if (state === 'play') pauseGame(); else if (state === 'paused') resumeGame(); }
  if (state === 'menu' && (e.key === 'Enter' || e.key === ' ') && $('#sShop').hidden) startRun();
});
window.addEventListener('keyup', (e) => { keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; joy.on = false; if (state === 'play') pauseGame(); });
cv.addEventListener('pointerdown', (e) => { if (state !== 'play') return; e.preventDefault(); if (joy.on) return; joy.on = true; joy.id = e.pointerId; joy.ox = joy.x = e.clientX; joy.oy = joy.y = e.clientY; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
cv.addEventListener('pointermove', (e) => { if (joy.on && e.pointerId === joy.id) { joy.x = e.clientX; joy.y = e.clientY; const dx = joy.x - joy.ox, dy = joy.y - joy.oy, l = Math.hypot(dx, dy); if (l > 90) { joy.ox += dx / l * (l - 90); joy.oy += dy / l * (l - 90); } } });
const endJoy = (e) => { if (e.pointerId === joy.id) joy.on = false; };
cv.addEventListener('pointerup', endJoy); cv.addEventListener('pointercancel', endJoy);
document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); if (state === 'play') pauseGame(); } });
window.addEventListener('pagehide', save);
/* ============================== loop / boot ============================== */
let lastT = performance.now();
function loop(tm) {
  const dt = Math.min(.05, (tm - lastT) / 1000); lastT = tm;
  if (state === 'play') update(dt);
  else if (state === 'over' && G) { G.t += 0; for (const p of parts) p.life -= dt; }
  if (state === 'menu') drawAll(tm, true); else { drawAll(tm, false); if (!window.__nohud) drawHud(tm); }
  requestAnimationFrame(loop);
}
async function main() {
  await cgBoot(); loadSave(); resize(); let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 200); });
  $('#bPlay').textContent = t('play'); $('#bShop').textContent = t('shop'); $('#bShopX').textContent = t('close'); $('#bResume').textContent = t('resume'); $('#bQuit').textContent = t('quit'); $('#pauseT').textContent = t('pause');
  $('#bAgain').textContent = t('again'); $('#bMenu').textContent = t('menu'); $('#bRevive').textContent = t('revive'); $('#bX2').textContent = t('x2'); $('#bReroll').textContent = t('reroll');
  $('#bPlay').onclick = startRun; $('#bShop').onclick = () => { sfx('click'); renderShop(); show('#sShop', true); }; $('#bShopX').onclick = () => { show('#sShop', false); sfx('click'); };
  $('#bSnd').onclick = toggleSnd; $('#bSnd2').onclick = toggleSnd; $('#bPause').onclick = pauseGame; $('#bResume').onclick = resumeGame; $('#bQuit').onclick = () => { if (state === 'paused') { show('#sPause', false); G.over = false; gameOver(false); } };
  $('#bReroll').onclick = () => showAd('rewarded', renderOffer);
  $('#bRevive').onclick = () => showAd('rewarded', revive);
  $('#bX2').onclick = () => { $('#bX2').disabled = true; showAd('rewarded', () => { SV.gold += lastOver.gold; save(); $('#overG').textContent = '+' + lastOver.gold * 2 + ' 🪙'; $('#overR').children[3].firstChild.textContent = SV.gold; sfx('chest'); }, () => { $('#bX2').disabled = false; }); };
  $('#bAgain').onclick = () => afterRun(startRun); $('#bMenu').onclick = () => afterRun(toMenu);
  toMenu(); $('#loading').remove(); try { const k = sdk(); if (k) k.game.loadingStop(); } catch (e) {}
  requestAnimationFrame((t0) => { lastT = t0; loop(t0); });
  window.__nh = { S: () => state, P: () => P, G: () => G, E: () => enemies, update, startRun, chooseUp, openLevelUp, newRun, SV: () => SV, spawnAt, addXp, gameOver, curOffer: () => curOffer, enemiesN: () => enemies.length };
}
main();
