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

