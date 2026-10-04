/* ============================== util / i18n / storage ============================== */
const $ = (s) => document.querySelector(s);
const LANG = /^es/i.test(navigator.language || '') ? 'es' : 'en';
const rnd = (a, b) => a + Math.random() * (b - a), irnd = (a, b) => Math.floor(rnd(a, b + 1)), pick = (a) => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), TAU = Math.PI * 2;
const TX = {
  en: { play: '▶  PLAY', shop: '⭐ Upgrades', snd: 'Sound', gold: 'Gold', best: 'Best', kills: 'Kills', time: 'Time', lvl: 'Level', pick: 'LEVEL UP!', chest: 'TREASURE!', reroll: '📺 Reroll', pause: 'Paused', resume: 'Resume', quit: 'Quit run', over: 'You fell…', win: 'VICTORY!', again: '▶ Play again', menu: 'Menu', revive: '📺 Revive', x2: '📺 Gold ×2', ready: 'Hero', locked: 'Unlock', max: 'MAX', noad: 'No ad available right now', heal: 'Heal 40% HP', coins: '+60 gold', move: 'Move: WASD / arrows / drag. You attack automatically.', boss: 'BOSS', lvlup: 'Lv', got: 'Collected', owned: 'owned', shopT: 'Permanent upgrades', close: 'Close', total: 'Total kills', earned: 'Gold earned', bonus: 'Bonus', new: 'NEW' },
  es: { play: '▶  JUGAR', shop: '⭐ Mejoras', snd: 'Sonido', gold: 'Oro', best: 'Récord', kills: 'Bajas', time: 'Tiempo', lvl: 'Nivel', pick: '¡SUBES DE NIVEL!', chest: '¡TESORO!', reroll: '📺 Cambiar', pause: 'Pausa', resume: 'Continuar', quit: 'Abandonar', over: 'Has caído…', win: '¡VICTORIA!', again: '▶ Jugar otra vez', menu: 'Menú', revive: '📺 Revivir', x2: '📺 Oro ×2', ready: 'Héroe', locked: 'Desbloquear', max: 'MÁX', noad: 'No hay anuncio disponible ahora', heal: 'Curar 40% de vida', coins: '+60 de oro', move: 'Muévete: WASD / flechas / arrastra. Atacas automáticamente.', boss: 'JEFE', lvlup: 'Nv', got: 'Recogido', owned: 'tienes', shopT: 'Mejoras permanentes', close: 'Cerrar', total: 'Bajas totales', earned: 'Oro ganado', bonus: 'Bonus', new: 'NUEVO' },
};
const t = (k) => (TX[LANG][k] != null ? TX[LANG][k] : TX.en[k]) || k;
const L2 = (a) => a[LANG === 'es' ? 1 : 0];
const fmtT = (s) => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const fmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'K' : String(Math.floor(n)));
let cgData = null;
const store = {
  get(k) { try { if (cgData) { const v = cgData.getItem(k); if (v != null) return v; } } catch (e) {} try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { if (cgData) cgData.setItem(k, v); } catch (e) {} try { localStorage.setItem(k, v); } catch (e) {} },
};
const KEY = 'neonhorde-v1';
let SV = { gold: 0, shop: {}, heroes: [0], hero: 0, best: 0, kills: 0, runs: 0, mute: false, seen: 0 };
function loadSave() { try { const o = JSON.parse(store.get(KEY) || '{}'); SV = Object.assign(SV, o); } catch (e) {} }
function save() { store.set(KEY, JSON.stringify(SV)); }

/* ============================== audio ============================== */
let AC = null, CG_MUTE = false, adOn = false, master = null;
const muted = () => SV.mute || CG_MUTE || adOn;
function actx() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .8; master.connect(AC.destination); } catch (e) {} } if (AC && AC.state === 'suspended' && !muted()) AC.resume(); return AC; }
function tone(f, d, type, vol, slide, when) {
  if (muted()) return; const a = actx(); if (!a) return; const n = a.currentTime + (when || 0);
  const o = a.createOscillator(), g = a.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, n); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), n + d);
  g.gain.setValueAtTime(vol || .06, n); g.gain.exponentialRampToValueAtTime(.0001, n + d); o.connect(g); g.connect(master); o.start(n); o.stop(n + d + .03);
}
let noiseBuf = null;
function noise(d, vol, hp) {
  if (muted()) return; const a = actx(); if (!a) return; if (!noiseBuf) { noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
  const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter(); s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = hp || 900; const n = a.currentTime;
  g.gain.setValueAtTime(vol, n); g.gain.exponentialRampToValueAtTime(.0001, n + d); s.connect(f); f.connect(g); g.connect(master); s.start(n); s.stop(n + d);
}
const lastSfx = {};
function sfx(k) {
  const n = performance.now(); const gap = { hit: 45, shot: 70, gem: 25, zap: 80 }[k] || 0; if (gap && n - (lastSfx[k] || 0) < gap) return; lastSfx[k] = n;
  if (k === 'shot') tone(620, .09, 'triangle', .035, .5);
  else if (k === 'hit') tone(180 + Math.random() * 60, .05, 'square', .025, .6);
  else if (k === 'kill') { tone(260, .12, 'sawtooth', .03, .4); }
  else if (k === 'gem') { gemN = Math.min(gemN + 1, 14); tone(660 * Math.pow(2, gemN / 12), .08, 'sine', .04); }
  else if (k === 'zap') { noise(.18, .08, 4000); tone(900, .15, 'sawtooth', .03, .3); }
  else if (k === 'nova') { noise(.45, .18, 700); tone(110, .5, 'sine', .12, .4); }
  else if (k === 'hurt') { tone(150, .18, 'sawtooth', .08, .5); noise(.1, .08, 600); }
  else if (k === 'lvl') [523, 659, 784, 1047].forEach((f, i) => tone(f, .25, 'triangle', .07, 0, i * .07));
  else if (k === 'boss') { tone(70, 1.2, 'sawtooth', .12, .6); noise(.9, .15, 500); }
  else if (k === 'chest') [784, 988, 1175, 1568].forEach((f, i) => tone(f, .3, 'sine', .07, 0, i * .08));
  else if (k === 'click') tone(520, .06, 'square', .04);
  else if (k === 'over') { tone(220, .8, 'sawtooth', .09, .25); }
  else if (k === 'win') [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .5, 'triangle', .08, 0, i * .12));
}
let gemN = 0, gemT = 0;
/* ambient music: slow minor arpeggio + pad */
let musicOn = false, musicT = 0, musicStep = 0;
const SCALE = [0, 3, 5, 7, 10, 12, 15, 17], ROOT = 55;
function musicTick() {
  if (!musicOn || muted()) return; const a = actx(); if (!a) return;
  if (a.currentTime < musicT - .15) return; musicT = Math.max(musicT, a.currentTime + .05);
  const i = musicStep++, bar = Math.floor(i / 8) % 4, prog = [0, 5, 3, 7][bar], st = SCALE[(i * 3 + (i % 5)) % SCALE.length] + prog;
  tone(ROOT * Math.pow(2, (st + 12) / 12), .5, 'triangle', .022, 0, musicT - a.currentTime);
  if (i % 8 === 0) { tone(ROOT * Math.pow(2, prog / 12), 2.2, 'sine', .05, 0, musicT - a.currentTime); tone(ROOT * 2 * Math.pow(2, (prog + 7) / 12), 2.2, 'sine', .025, 0, musicT - a.currentTime); }
  if (i % 4 === 2) tone(ROOT / 2, .25, 'sine', .08, .7, musicT - a.currentTime);
  musicT += .27;
}
setInterval(musicTick, 120);

/* ============================== CrazyGames ============================== */
const CG = { ok: false, playing: false, lastAd: 0 };
const sdk = () => (CG.ok && window.CrazyGames && window.CrazyGames.SDK) || null;
function gameplay(on) { if (on === CG.playing) return; CG.playing = on; try { const k = sdk(); if (k) k.game[on ? 'gameplayStart' : 'gameplayStop'](); } catch (e) {} }
function happy() { try { const k = sdk(); if (k) k.game.happytime(); } catch (e) {} }
function showAd(type, onReward, onFail) {
  const k = sdk(); let done = false;
  const fin = (ok) => { if (done) return; done = true; adOn = false; try { if (AC && !muted()) AC.resume(); } catch (e) {} CG.lastAd = performance.now(); if (ok) onReward && onReward(); else if (type === 'rewarded') { toast(t('noad')); onFail && onFail(); } else onReward && onReward(); };
  if (!k) { onReward && onReward(); return; }                   // outside CrazyGames: no ads, reward directly
  try { k.ad.requestAd(type, { adStarted: () => { adOn = true; gameplay(false); try { if (AC) AC.suspend(); } catch (e) {} }, adFinished: () => fin(true), adError: () => fin(false) }); } catch (e) { fin(false); }
  setTimeout(() => { if (!done) fin(false); }, 120000);
}
async function cgBoot() {
  let k = null; try { k = await Promise.race([window.__cgInit, new Promise((r) => setTimeout(() => r(null), 2500))]); } catch (e) {}
  if (!k) return; CG.ok = true; try { if (k.environment !== 'disabled') cgData = k.data || null; } catch (e) {}
  try { const st = k.game.settings || {}; CG_MUTE = !!st.muteAudio; k.game.addSettingsChangeListener((n) => { CG_MUTE = !!n.muteAudio; paintSnd(); }); } catch (e) {}
}
function toast(msg) { const d = document.createElement('div'); d.textContent = msg; $('#toast').appendChild(d); setTimeout(() => d.remove(), 2800); while ($('#toast').children.length > 3) $('#toast').firstChild.remove(); }

/* ============================== sprites (procedurally painted, cached) ============================== */
const SP = {};
function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const x = c.getContext('2d'); x.scale(2, 2); fn(x, w, h); c.lw = w; c.lh = h; return c; }
function white(src) { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); c.lw = src.lw; c.lh = src.lh; return c; }
function eye(x, ex, ey, r, col, look) { x.fillStyle = '#fff'; x.beginPath(); x.arc(ex, ey, r, 0, TAU); x.fill(); x.fillStyle = col || '#111'; x.beginPath(); x.arc(ex + (look || 0), ey + r * .1, r * .55, 0, TAU); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(ex + r * .2, ey - r * .2, r * .22, 0, TAU); x.fill(); }
function shade(x, w, h, col, rimCol) { // rim light + soft inner shade on whatever was drawn
  x.save(); x.globalCompositeOperation = 'source-atop'; let g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,30,.45)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, rimCol || 'rgba(120,255,255,.25)'); g.addColorStop(.25, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.restore();
}
const HEROES = [
  { n: ['Aria', 'Aria'], role: ['Mage · Arcane Bolt', 'Maga · Rayo Arcano'], w: 'bolt', c1: '#6f4bff', c2: '#2a1670', glow: '#5ee7ff', hp: 0, spd: 0, cost: 0 },
  { n: ['Bron', 'Bron'], role: ['Warrior · Spin Axe, +25 HP', 'Guerrero · Hacha, +25 vida'], w: 'axe', c1: '#d6483a', c2: '#6a1410', glow: '#ffb347', hp: 25, spd: 0, cost: 600 },
  { n: ['Sylph', 'Sylph'], role: ['Druid · Spirit Orbs, +10% speed', 'Druida · Orbes, +10% velocidad'], w: 'orbit', c1: '#2fd48a', c2: '#0b5a3c', glow: '#8dffc4', hp: 0, spd: .1, cost: 1400 },
];
function heroSprite(h) {
  return mk(46, 56, (x) => {
    x.translate(23, 0); x.lineJoin = 'round';
    let g = x.createLinearGradient(-18, 14, 18, 54); g.addColorStop(0, h.c1); g.addColorStop(1, h.c2); x.fillStyle = g; x.strokeStyle = '#0a0518'; x.lineWidth = 2.4;
    x.beginPath(); x.moveTo(-9, 18); x.bezierCurveTo(-24, 34, -22, 50, -17, 53); x.lineTo(17, 53); x.bezierCurveTo(22, 50, 24, 34, 9, 18); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#ffffff22'; x.beginPath(); x.moveTo(-3, 22); x.bezierCurveTo(-10, 34, -9, 46, -6, 52); x.lineTo(2, 52); x.bezierCurveTo(1, 40, 3, 30, 5, 22); x.fill();
    g = x.createRadialGradient(-4, 8, 2, 0, 12, 16); g.addColorStop(0, h.c1); g.addColorStop(1, h.c2); x.fillStyle = g; x.beginPath(); x.arc(0, 14, 15, 0, TAU); x.fill(); x.stroke();
    x.fillStyle = '#0b0618'; x.beginPath(); x.ellipse(1, 15, 9.5, 8.5, 0, 0, TAU); x.fill();
    x.shadowColor = h.glow; x.shadowBlur = 8; x.fillStyle = h.glow; x.beginPath(); x.ellipse(-3.2, 15, 2.2, 3, 0, 0, TAU); x.ellipse(5.2, 15, 2.2, 3, 0, 0, TAU); x.fill(); x.shadowBlur = 0;
    x.fillStyle = h.glow; x.globalAlpha = .9; x.fillRect(-14, 31, 28, 3.5); x.globalAlpha = 1;
    shade(x, 46, 56, h.c1, h.glow + '55');
  });
}
function buildSprites() {
  HEROES.forEach((h, i) => { SP['hero' + i] = heroSprite(h); });
  SP.slime = mk(44, 38, (x) => {
    let g = x.createLinearGradient(0, 4, 0, 36); g.addColorStop(0, '#9dffb0'); g.addColorStop(.6, '#2ed36a'); g.addColorStop(1, '#0a7a3a'); x.fillStyle = g; x.strokeStyle = '#05301a'; x.lineWidth = 2.4;
    x.beginPath(); x.moveTo(3, 34); x.bezierCurveTo(0, 20, 8, 5, 22, 5); x.bezierCurveTo(36, 5, 44, 20, 41, 34); x.bezierCurveTo(30, 37, 14, 37, 3, 34); x.fill(); x.stroke();
    x.fillStyle = '#ffffff55'; x.beginPath(); x.ellipse(14, 12, 6, 3.5, -.5, 0, TAU); x.fill(); eye(x, 15, 21, 5, '#111', 1); eye(x, 29, 21, 5, '#111', 1); x.strokeStyle = '#05301a'; x.lineWidth = 2; x.beginPath(); x.moveTo(11, 14); x.lineTo(19, 17); x.moveTo(33, 14); x.lineTo(25, 17); x.stroke();
  });
  SP.batBody = mk(24, 24, (x) => { let g = x.createRadialGradient(10, 9, 2, 12, 12, 12); g.addColorStop(0, '#b06bff'); g.addColorStop(1, '#3a1070'); x.fillStyle = g; x.strokeStyle = '#12052a'; x.lineWidth = 2; x.beginPath(); x.arc(12, 13, 9, 0, TAU); x.fill(); x.stroke(); x.fillStyle = '#12052a'; x.beginPath(); x.moveTo(6, 7); x.lineTo(5, 0); x.lineTo(10, 5); x.moveTo(18, 7); x.lineTo(19, 0); x.lineTo(14, 5); x.fill(); x.shadowColor = '#ff3b6b'; x.shadowBlur = 6; x.fillStyle = '#ff5b8b'; x.beginPath(); x.arc(8.5, 12, 2, 0, TAU); x.arc(15.5, 12, 2, 0, TAU); x.fill(); });
  SP.batWing = mk(30, 22, (x) => { let g = x.createLinearGradient(0, 0, 30, 0); g.addColorStop(0, '#5a1fa8'); g.addColorStop(1, '#20083f'); x.fillStyle = g; x.strokeStyle = '#12052a'; x.lineWidth = 2; x.beginPath(); x.moveTo(1, 8); x.quadraticCurveTo(14, -4, 29, 2); x.quadraticCurveTo(24, 8, 26, 14); x.quadraticCurveTo(20, 10, 18, 18); x.quadraticCurveTo(12, 12, 8, 20); x.quadraticCurveTo(6, 14, 1, 8); x.fill(); x.stroke(); });
  SP.brute = mk(72, 72, (x) => {
    x.lineJoin = 'round'; x.strokeStyle = '#1a0610'; x.lineWidth = 3; let g = x.createLinearGradient(0, 8, 0, 70); g.addColorStop(0, '#d4476a'); g.addColorStop(.6, '#7a1f4a'); g.addColorStop(1, '#3a0e30'); x.fillStyle = g;
    x.beginPath(); x.moveTo(8, 66); x.bezierCurveTo(0, 40, 8, 18, 36, 14); x.bezierCurveTo(64, 18, 72, 40, 64, 66); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#e9e0c8'; x.strokeStyle = '#2a1a10'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(14, 22); x.quadraticCurveTo(2, 14, 6, 0); x.quadraticCurveTo(14, 10, 22, 16); x.fill(); x.stroke(); x.beginPath(); x.moveTo(58, 22); x.quadraticCurveTo(70, 14, 66, 0); x.quadraticCurveTo(58, 10, 50, 16); x.fill(); x.stroke();
    x.fillStyle = '#1a0610'; x.beginPath(); x.ellipse(36, 34, 20, 13, 0, 0, TAU); x.fill(); x.shadowColor = '#ffb21a'; x.shadowBlur = 10; x.fillStyle = '#ffd43a'; x.beginPath(); x.moveTo(20, 30); x.lineTo(32, 36); x.lineTo(20, 38); x.moveTo(52, 30); x.lineTo(40, 36); x.lineTo(52, 38); x.fill(); x.shadowBlur = 0;
    x.fillStyle = '#e9e0c8'; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(24 + i * 6, 45); x.lineTo(27 + i * 6, 51); x.lineTo(30 + i * 6, 45); x.fill(); }
    x.fillStyle = '#ffffff1a'; x.beginPath(); x.ellipse(24, 24, 12, 5, -.4, 0, TAU); x.fill(); shade(x, 72, 72, '', '#ff8aa044');
  });
  SP.watcher = mk(46, 46, (x) => {
    for (let i = 0; i < 5; i++) { x.strokeStyle = '#4a1a8a'; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(10 + i * 6.5, 30); x.quadraticCurveTo(8 + i * 7 + Math.sin(i) * 6, 40, 10 + i * 6.5 + Math.cos(i) * 4, 45); x.stroke(); }
    let g = x.createRadialGradient(18, 16, 3, 23, 22, 22); g.addColorStop(0, '#fffbd0'); g.addColorStop(.7, '#ffcf8a'); g.addColorStop(1, '#a8501a'); x.fillStyle = g; x.strokeStyle = '#2a1008'; x.lineWidth = 2.4; x.beginPath(); x.arc(23, 22, 18, 0, TAU); x.fill(); x.stroke();
    x.shadowColor = '#ff2a4a'; x.shadowBlur = 10; g = x.createRadialGradient(23, 22, 1, 23, 22, 10); g.addColorStop(0, '#111'); g.addColorStop(.35, '#111'); g.addColorStop(.4, '#ff3b5a'); g.addColorStop(1, '#8a0a2a'); x.fillStyle = g; x.beginPath(); x.arc(23, 22, 10, 0, TAU); x.fill(); x.shadowBlur = 0; x.fillStyle = '#fff'; x.beginPath(); x.arc(19, 18, 3, 0, TAU); x.fill();
    x.strokeStyle = '#a8501a55'; x.lineWidth = 1; for (let i = 0; i < 6; i++) { const a = i * 1.05; x.beginPath(); x.moveTo(23 + Math.cos(a) * 11, 22 + Math.sin(a) * 11); x.lineTo(23 + Math.cos(a) * 17, 22 + Math.sin(a) * 17); x.stroke(); }
  });
  const boss = (c1, c2, glow, crown) => mk(150, 150, (x) => {
    x.lineJoin = 'round'; x.strokeStyle = '#0a0510'; x.lineWidth = 5; let g = x.createLinearGradient(0, 20, 0, 146); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g;
    x.beginPath(); x.moveTo(14, 140); x.bezierCurveTo(0, 90, 14, 40, 75, 30); x.bezierCurveTo(136, 40, 150, 90, 136, 140); x.closePath(); x.fill(); x.stroke();
    x.shadowColor = glow; x.shadowBlur = 14; x.strokeStyle = glow; x.lineWidth = 3; x.globalAlpha = .85; x.beginPath(); x.moveTo(40, 120); x.lineTo(54, 96); x.lineTo(46, 80); x.moveTo(110, 124); x.lineTo(98, 100); x.lineTo(106, 84); x.moveTo(75, 130); x.lineTo(75, 104); x.stroke(); x.globalAlpha = 1; x.shadowBlur = 0;
    x.fillStyle = '#e8e2d0'; x.strokeStyle = '#1a1210'; x.lineWidth = 4; x.beginPath(); x.moveTo(30, 48); x.quadraticCurveTo(6, 36, 14, 4); x.quadraticCurveTo(34, 24, 50, 36); x.fill(); x.stroke(); x.beginPath(); x.moveTo(120, 48); x.quadraticCurveTo(144, 36, 136, 4); x.quadraticCurveTo(116, 24, 100, 36); x.fill(); x.stroke();
    if (crown) { x.fillStyle = '#ffd43a'; x.strokeStyle = '#6a4a00'; x.lineWidth = 3; x.beginPath(); x.moveTo(44, 38); x.lineTo(44, 14); x.lineTo(58, 26); x.lineTo(75, 6); x.lineTo(92, 26); x.lineTo(106, 14); x.lineTo(106, 38); x.closePath(); x.fill(); x.stroke(); }
    x.fillStyle = '#0a0510'; x.beginPath(); x.ellipse(75, 66, 36, 24, 0, 0, TAU); x.fill(); x.shadowColor = glow; x.shadowBlur = 18; x.fillStyle = glow; x.beginPath(); x.moveTo(44, 58); x.lineTo(68, 70); x.lineTo(44, 74); x.moveTo(106, 58); x.lineTo(82, 70); x.lineTo(106, 74); x.fill(); x.shadowBlur = 0;
    x.fillStyle = '#e8e2d0'; for (let i = 0; i < 7; i++) { x.beginPath(); x.moveTo(48 + i * 9, 84); x.lineTo(52.5 + i * 9, 94); x.lineTo(57 + i * 9, 84); x.fill(); } shade(x, 150, 150, '', glow + '44');
  });
  SP.boss1 = boss('#8a3a2a', '#2a0f14', '#ff9a2a', false); SP.boss2 = boss('#3a5aa8', '#121a3a', '#6ff1ff', true);
  SP.gem = [['#5ee7ff', '#0a6c93'], ['#6dffa0', '#0c7a3a'], ['#ff6bd6', '#8a1a7a']].map((c) => mk(20, 24, (x) => { let g = x.createLinearGradient(0, 0, 20, 24); g.addColorStop(0, c[0]); g.addColorStop(1, c[1]); x.fillStyle = g; x.strokeStyle = '#0a0518'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(10, 1); x.lineTo(18, 9); x.lineTo(10, 23); x.lineTo(2, 9); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#ffffff66'; x.beginPath(); x.moveTo(10, 3); x.lineTo(15, 9); x.lineTo(10, 11); x.lineTo(5, 9); x.fill(); }));
  SP.coin = mk(18, 18, (x) => { x.fillStyle = '#ffc83d'; x.strokeStyle = '#7a4a00'; x.lineWidth = 1.8; x.beginPath(); x.arc(9, 9, 7, 0, TAU); x.fill(); x.stroke(); x.fillStyle = '#fff3a8'; x.beginPath(); x.arc(7, 7, 3, 0, TAU); x.fill(); x.strokeStyle = '#b07a10'; x.beginPath(); x.arc(9, 9, 4, 0, TAU); x.stroke(); });
  SP.heart = mk(22, 20, (x) => { x.fillStyle = '#ff4466'; x.strokeStyle = '#4a0a1a'; x.lineWidth = 1.8; x.beginPath(); x.moveTo(11, 18); x.bezierCurveTo(-4, 8, 3, -2, 11, 5); x.bezierCurveTo(19, -2, 26, 8, 11, 18); x.fill(); x.stroke(); x.fillStyle = '#ffffff77'; x.beginPath(); x.ellipse(6, 6, 3, 2, -.6, 0, TAU); x.fill(); });
  SP.magnet = mk(24, 24, (x) => { x.lineWidth = 6; x.lineCap = 'butt'; x.strokeStyle = '#ff4466'; x.beginPath(); x.arc(12, 13, 7, Math.PI, Math.PI * 1.5); x.stroke(); x.strokeStyle = '#5a78ff'; x.beginPath(); x.arc(12, 13, 7, Math.PI * 1.5, 0); x.stroke(); x.fillStyle = '#ddd'; x.fillRect(2, 13, 6, 6); x.fillRect(16, 13, 6, 6); });
  SP.chest = mk(40, 34, (x) => { x.lineJoin = 'round'; x.strokeStyle = '#2a1204'; x.lineWidth = 2.4; let g = x.createLinearGradient(0, 4, 0, 32); g.addColorStop(0, '#c07a3a'); g.addColorStop(1, '#6a3a14'); x.fillStyle = g; x.beginPath(); x.moveTo(3, 32); x.lineTo(3, 14); x.quadraticCurveTo(20, -2, 37, 14); x.lineTo(37, 32); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#ffc83d'; x.fillRect(3, 14, 34, 4); x.strokeRect(3, 14, 34, 4); x.fillRect(16, 12, 8, 12); x.strokeRect(16, 12, 8, 12); });
  SP.glow = mk(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
  SP.shadow = mk(64, 32, (x) => { const g = x.createRadialGradient(32, 16, 2, 32, 16, 30); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.save(); x.scale(1, .5); x.translate(0, 16); x.fillStyle = g; x.fillRect(0, 0, 64, 64); x.restore(); });
  SP.axe = mk(40, 40, (x) => { x.lineJoin = 'round'; x.strokeStyle = '#1a1020'; x.lineWidth = 2.4; x.fillStyle = '#7a4a22'; x.fillRect(18, 4, 4, 34); x.strokeRect(18, 4, 4, 34); let g = x.createLinearGradient(0, 0, 40, 0); g.addColorStop(0, '#9fb0c8'); g.addColorStop(1, '#e8f4ff'); x.fillStyle = g; x.beginPath(); x.moveTo(20, 6); x.quadraticCurveTo(40, 2, 38, 20); x.quadraticCurveTo(30, 16, 22, 22); x.closePath(); x.fill(); x.stroke(); x.beginPath(); x.moveTo(20, 6); x.quadraticCurveTo(0, 2, 2, 20); x.quadraticCurveTo(10, 16, 18, 22); x.closePath(); x.fill(); x.stroke(); });
  ['slime', 'brute', 'watcher', 'boss1', 'boss2', 'batBody', 'batWing'].forEach((k) => { SP[k + 'W'] = white(SP[k]); });
  // ground tile (seamless): stone slabs + noise + cracks + moss
  SP.ground = (() => { const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); let sd = 11; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const wrap = (fn) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) fn(ox, oy); };
    x.fillStyle = '#17122b'; x.fillRect(0, 0, S, S);
    const T = 128; for (let i = 0; i < S / T; i++) for (let j = 0; j < S / T; j++) { const k = r(); x.fillStyle = `rgba(${40 + k * 30 | 0},${30 + k * 25 | 0},${70 + k * 40 | 0},.35)`; x.fillRect(i * T + 2, j * T + 2, T - 4, T - 4); }
    x.strokeStyle = 'rgba(5,2,15,.8)'; x.lineWidth = 3; for (let i = 0; i <= S / T; i++) { x.beginPath(); x.moveTo(i * T, 0); x.lineTo(i * T, S); x.moveTo(0, i * T); x.lineTo(S, i * T); x.stroke(); }
    x.strokeStyle = 'rgba(120,100,200,.12)'; x.lineWidth = 1.5; for (let i = 0; i <= S / T; i++) { x.beginPath(); x.moveTo(i * T + 2, 0); x.lineTo(i * T + 2, S); x.moveTo(0, i * T + 2); x.lineTo(S, i * T + 2); x.stroke(); }
    for (let i = 0; i < 2600; i++) { const px = r() * S, py = r() * S, a = r(); x.fillStyle = a > .5 ? `rgba(160,140,255,${a * .07})` : `rgba(0,0,10,${a * .22})`; wrap((ox, oy) => x.fillRect(px + ox, py + oy, 1 + r() * 2, 1 + r() * 2)); }
    x.strokeStyle = 'rgba(5,2,14,.7)'; x.lineWidth = 1.6; for (let i = 0; i < 14; i++) { let px = r() * S, py = r() * S; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (r() - .5) * 30; py += (r() - .5) * 30; x.lineTo(px, py); } x.stroke(); }
    for (let i = 0; i < 40; i++) { const px = r() * S, py = r() * S, rr = 10 + r() * 22; wrap((ox, oy) => { const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, rr); g.addColorStop(0, 'rgba(40,200,150,.14)'); g.addColorStop(1, 'rgba(40,200,150,0)'); x.fillStyle = g; x.fillRect(px + ox - rr, py + oy - rr, rr * 2, rr * 2); }); }
    return c; })();
  // decorations
  SP.dec = [
    mk(46, 34, (x) => { x.lineJoin = 'round'; x.strokeStyle = '#08040f'; x.lineWidth = 2.4; let g = x.createLinearGradient(0, 4, 0, 32); g.addColorStop(0, '#5a5088'); g.addColorStop(1, '#241c44'); x.fillStyle = g; x.beginPath(); x.moveTo(3, 30); x.lineTo(8, 12); x.lineTo(20, 3); x.lineTo(36, 8); x.lineTo(43, 30); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#ffffff22'; x.beginPath(); x.moveTo(8, 12); x.lineTo(20, 3); x.lineTo(24, 14); x.closePath(); x.fill(); }),
    mk(34, 26, (x) => { x.strokeStyle = '#2fd4a0'; x.lineWidth = 2.6; x.lineCap = 'round'; for (let i = 0; i < 7; i++) { x.beginPath(); x.moveTo(17, 25); x.quadraticCurveTo(17 + (i - 3) * 4, 12, 17 + (i - 3) * 5.5, 3 + Math.abs(i - 3) * 2.5); x.stroke(); } x.strokeStyle = '#8dffd8'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(17, 25); x.quadraticCurveTo(17, 14, 17, 4); x.stroke(); }),
    mk(30, 34, (x) => { x.fillStyle = '#d8c8ff'; x.fillRect(12, 16, 6, 16); x.shadowColor = '#ff4fd8'; x.shadowBlur = 8; let g = x.createRadialGradient(15, 12, 1, 15, 14, 14); g.addColorStop(0, '#ff9ae9'); g.addColorStop(1, '#a31fd0'); x.fillStyle = g; x.beginPath(); x.ellipse(15, 14, 13, 9, 0, Math.PI, 0); x.fill(); x.shadowBlur = 0; x.fillStyle = '#fff8'; x.beginPath(); x.arc(9, 10, 1.6, 0, TAU); x.arc(17, 7, 1.4, 0, TAU); x.arc(21, 12, 1.3, 0, TAU); x.fill(); }),
    mk(60, 60, (x) => { x.translate(30, 30); x.shadowColor = '#5ee7ff'; x.shadowBlur = 8; x.strokeStyle = 'rgba(94,231,255,.7)'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 24, 0, TAU); x.stroke(); x.beginPath(); x.arc(0, 0, 17, 0, TAU); x.stroke(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; x.beginPath(); x.moveTo(Math.cos(a) * 17, Math.sin(a) * 17); x.lineTo(Math.cos(a + 1.05) * 17, Math.sin(a + 1.05) * 17); x.stroke(); } }),
    mk(44, 20, (x) => { x.strokeStyle = '#d8d0b8'; x.fillStyle = '#d8d0b8'; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); x.moveTo(4, 14); x.lineTo(36, 6); x.stroke(); x.beginPath(); x.arc(38, 6, 4, 0, TAU); x.arc(5, 15, 4, 0, TAU); x.fill(); x.globalAlpha = .6; x.beginPath(); x.moveTo(10, 8); x.lineTo(30, 16); x.stroke(); }),
    mk(26, 40, (x) => { x.shadowColor = '#7a5aff'; x.shadowBlur = 12; let g = x.createLinearGradient(0, 0, 0, 38); g.addColorStop(0, '#c9b8ff'); g.addColorStop(1, '#5a3acc'); x.fillStyle = g; x.strokeStyle = '#1a0a4a'; x.lineWidth = 2; x.beginPath(); x.moveTo(13, 1); x.lineTo(23, 14); x.lineTo(19, 38); x.lineTo(7, 38); x.lineTo(3, 14); x.closePath(); x.fill(); x.stroke(); }),
  ];
}
