/* ============================== util / i18n / storage ============================== */
const $ = (s) => document.querySelector(s);
let LANG = 'en';   // English by default; Spanish selectable (saved)
const GAME_ID = 'bumper-orbs';
const rnd = (a, b) => a + Math.random() * (b - a), irnd = (a, b) => Math.floor(rnd(a, b + 1)), pick = (a) => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), TAU = Math.PI * 2, lerp = (a, b, k) => a + (b - a) * k;
const TX = {
  en: { solo: '▶  PLAY', quick: '⚡ Quick match', create: '🏠 Private room', join: '🔑 Join with code', skins: '🎨 Skins', how: '❓ How to play', snd: 'Sound', coins: 'Coins', wins: 'Wins', played: 'Matches', pause: 'Paused', resume: 'Resume', quit: 'Leave match', again: '▶ Play again', menu: 'Menu', x2: '📺 Coins ×2', noad: 'No ad available right now',
    joinT: 'Join a room', codeHint: 'Enter the 4-letter code', go: 'Join', cancel: 'Cancel', lobT: 'Room', start: '▶ Start', copy: '🔗 Copy invite', leave: 'Leave', waiting: 'Waiting for players…', waitHost: 'Waiting for the host to start…', botsFill: 'Empty seats are filled with bots', findMatch: 'Finding a match…', startsIn: 'Starting in', you: 'You', host: 'Host', bot: 'Bot', noRoom: 'Room not found', busy: 'That match already started', full: 'Room is full', offline: 'Online is not available right now. You can still play vs bots!', lost: 'Connection lost', copied: 'Invite link copied!',
    round: 'Round', ready: 'Ready?', go2: 'GO!', winner: 'wins the round!', matchWin: 'wins the match!', youWin: 'YOU WIN!', youLost: 'Match over', dash: 'DASH', skT: 'Skins', owned: 'Owned', equip: 'Equipped', buy: 'Buy', locked: 'Not enough coins', gain: 'Coins earned', kills: 'Knockouts', rank: 'Place', howT: 'How to play', close: 'Close',
    howTxt: '<b>Push everyone off the arena!</b> The platform shrinks as the round goes on.<br>• Move: <kbd>W A S D</kbd> / arrows / drag on the left of the screen.<br>• <b>Dash</b>: <kbd>Space</kbd> or the DASH button. A dash hits much harder!<br>• Grab pickups: 🛡 shield, ⚖ heavy, ⚡ boost, 💥 pulse.<br>• Last orb standing wins the round. First to 2 round wins takes the match.', hostMoved: 'Host left, you are the new host', waitOthers: 'Waiting for others…', pickShield: 'Shield!', pickHeavy: 'Heavy!', pickBoost: 'Boost!', pickPulse: 'Pulse!' },
  es: { solo: '▶  JUGAR', quick: '⚡ Partida rápida', create: '🏠 Sala privada', join: '🔑 Unirse con código', skins: '🎨 Aspectos', how: '❓ Cómo se juega', snd: 'Sonido', coins: 'Monedas', wins: 'Victorias', played: 'Partidas', pause: 'Pausa', resume: 'Continuar', quit: 'Salir de la partida', again: '▶ Otra vez', menu: 'Menú', x2: '📺 Monedas ×2', noad: 'No hay anuncio disponible ahora',
    joinT: 'Unirse a una sala', codeHint: 'Escribe el código de 4 letras', go: 'Entrar', cancel: 'Cancelar', lobT: 'Sala', start: '▶ Empezar', copy: '🔗 Copiar invitación', leave: 'Salir', waiting: 'Esperando jugadores…', waitHost: 'Esperando a que el anfitrión empiece…', botsFill: 'Los huecos libres se rellenan con bots', findMatch: 'Buscando partida…', startsIn: 'Empieza en', you: 'Tú', host: 'Anfitrión', bot: 'Bot', noRoom: 'Sala no encontrada', busy: 'Esa partida ya ha empezado', full: 'La sala está llena', offline: 'El modo online no está disponible ahora. ¡Aún puedes jugar contra bots!', lost: 'Conexión perdida', copied: '¡Enlace de invitación copiado!',
    round: 'Ronda', ready: '¿Listo?', go2: '¡YA!', winner: '¡gana la ronda!', matchWin: '¡gana la partida!', youWin: '¡HAS GANADO!', youLost: 'Fin de la partida', dash: 'EMBESTIDA', skT: 'Aspectos', owned: 'Tuyo', equip: 'Equipado', buy: 'Comprar', locked: 'Te faltan monedas', gain: 'Monedas ganadas', kills: 'Eliminaciones', rank: 'Puesto', howT: 'Cómo se juega', close: 'Cerrar',
    howTxt: '<b>¡Saca a todos de la arena!</b> La plataforma se encoge con el tiempo.<br>• Mover: <kbd>W A S D</kbd> / flechas / arrastra en la parte izquierda de la pantalla.<br>• <b>Embestida</b>: <kbd>Espacio</kbd> o el botón EMBESTIDA. ¡Golpea mucho más fuerte!<br>• Recoge objetos: 🛡 escudo, ⚖ pesado, ⚡ impulso, 💥 pulso.<br>• La última bola en pie gana la ronda. Gana la partida quien consiga 2 rondas.', hostMoved: 'El anfitrión se fue: ahora eres el anfitrión', waitOthers: 'Esperando a los demás…', pickShield: '¡Escudo!', pickHeavy: '¡Pesado!', pickBoost: '¡Impulso!', pickPulse: '¡Pulso!' },
};
const t = (k) => (TX[LANG][k] != null ? TX[LANG][k] : TX.en[k]) || k;
const L2 = (a) => a[LANG === 'es' ? 1 : 0];
let cgData = null;
const store = {
  get(k) { try { if (cgData) { const v = cgData.getItem(k); if (v != null) return v; } } catch (e) {} try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { if (cgData) cgData.setItem(k, v); } catch (e) {} try { localStorage.setItem(k, v); } catch (e) {} },
};
const KEY = 'bumperorbs-v1';
let SV = { lang: 'en', coins: 0, skins: [0, 1, 2, 3], skin: 0, name: '', wins: 0, played: 0, mute: false, seen: 0 };
const ADJ = [['Swift', 'Rápido'], ['Bouncy', 'Saltarín'], ['Mighty', 'Fuerte'], ['Sneaky', 'Sigiloso'], ['Jolly', 'Alegre'], ['Brave', 'Valiente'], ['Zippy', 'Veloz'], ['Lucky', 'Suertudo'], ['Fuzzy', 'Peludo'], ['Turbo', 'Turbo']];
const NOUN = [['Panda', 'Panda'], ['Comet', 'Cometa'], ['Cookie', 'Galleta'], ['Falcon', 'Halcón'], ['Pickle', 'Pepinillo'], ['Rocket', 'Cohete'], ['Waffle', 'Gofre'], ['Otter', 'Nutria'], ['Mango', 'Mango'], ['Ninja', 'Ninja']];
const randName = () => pick(ADJ)[0] + pick(NOUN)[0] + irnd(10, 99);
function loadSave() { try { const o = JSON.parse(store.get(KEY) || '{}'); SV = Object.assign(SV, o); } catch (e) {} LANG = SV.lang === 'es' ? 'es' : 'en'; if (!SV.name) SV.name = randName(); }
function save() { store.set(KEY, JSON.stringify(SV)); }
/* skins: pure code-drawn cosmetics */
const SKINS = [
  { n: ['Sunny', 'Solete'], c1: '#ffe27a', c2: '#ff9a1a', pat: 'plain', cost: 0 }, { n: ['Berry', 'Fresa'], c1: '#ff8aa8', c2: '#d02a60', pat: 'dots', cost: 0 },
  { n: ['Mint', 'Menta'], c1: '#8ef0c0', c2: '#18a870', pat: 'stripes', cost: 0 }, { n: ['Ocean', 'Océano'], c1: '#8ac8ff', c2: '#2a68e0', pat: 'rings', cost: 0 },
  { n: ['Grape', 'Uva'], c1: '#c8a0ff', c2: '#6a30d0', pat: 'star', cost: 120 }, { n: ['Lava', 'Lava'], c1: '#ffb060', c2: '#e02a10', pat: 'zig', cost: 160 },
  { n: ['Checker', 'Ajedrez'], c1: '#f4f4f8', c2: '#3a3a56', pat: 'check', cost: 200 }, { n: ['Cherry', 'Cereza'], c1: '#ff7a7a', c2: '#a0102a', pat: 'heart', cost: 240 },
  { n: ['Lime', 'Lima'], c1: '#e0ff7a', c2: '#58b010', pat: 'stripes', cost: 280 }, { n: ['Galaxy', 'Galaxia'], c1: '#7a6aff', c2: '#1a1060', pat: 'star', cost: 360 },
  { n: ['Gold', 'Oro'], c1: '#fff0a0', c2: '#d8a010', pat: 'rings', cost: 500 }, { n: ['Candy', 'Caramelo'], c1: '#ffc0e8', c2: '#40c8ff', pat: 'zig', cost: 420 },
];

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
function sfx(k, v) {
  const n = performance.now(); const gap = { bump: 60, dash: 80 }[k] || 0; if (gap && n - (lastSfx[k] || 0) < gap) return; lastSfx[k] = n;
  if (k === 'bump') { const p = clamp(v || .5, .2, 1); tone(180 + p * 120, .09, 'square', .03 + p * .05, .5); noise(.07, .05 * p, 1200); }
  else if (k === 'dash') { tone(300, .16, 'sawtooth', .05, 2.2); noise(.14, .05, 2500); }
  else if (k === 'fall') { tone(520, .7, 'sine', .08, .2); }
  else if (k === 'pick') [660, 880, 1320].forEach((f, i) => tone(f, .12, 'triangle', .06, 0, i * .05));
  else if (k === 'pulse') { noise(.4, .15, 600); tone(100, .45, 'sine', .12, .4); }
  else if (k === 'tick') tone(660, .1, 'square', .05);
  else if (k === 'go') [880, 1175].forEach((f, i) => tone(f, .22, 'square', .06, 0, i * .08));
  else if (k === 'win') [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .35, 'triangle', .07, 0, i * .1));
  else if (k === 'lose') tone(260, .7, 'sawtooth', .07, .4);
  else if (k === 'click') tone(520, .06, 'square', .04);
  else if (k === 'coin') [988, 1319].forEach((f, i) => tone(f, .12, 'triangle', .06, 0, i * .07));
}
let musicOn = false, musicT = 0, musicStep = 0;
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16], ROOT = 110;
function musicTick() {
  if (!musicOn || muted()) return; const a = actx(); if (!a) return;
  if (a.currentTime < musicT - .15) return; musicT = Math.max(musicT, a.currentTime + .05);
  const i = musicStep++, bar = Math.floor(i / 8) % 4, prog = [0, 5, 7, 3][bar], st = SCALE[(i * 3 + (i % 5)) % SCALE.length] + prog, d = musicT - a.currentTime;
  tone(ROOT * Math.pow(2, (st + 12) / 12), .22, 'square', .014, 0, d);
  if (i % 4 === 0) tone(ROOT / 2 * Math.pow(2, prog / 12), .3, 'triangle', .06, .8, d);
  if (i % 2 === 1) noise(.04, .02, 6000);
  musicT += .2;
}
setInterval(musicTick, 100);

/* ============================== CrazyGames ============================== */
const CG = { ok: false, playing: false, lastAd: 0, invite: null };
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
  try { const r = k.game.getInviteParam && k.game.getInviteParam('roomId'); if (r) CG.invite = String(r).toUpperCase().slice(0, 4); } catch (e) {}
}
function cgRoom(code) { try { const k = sdk(); if (!k) return; if (code) k.game.showInviteButton({ roomId: code }); else k.game.hideInviteButton(); } catch (e) { /* no invites */ } }
function toast(msg) { const d = document.createElement('div'); d.textContent = msg; $('#toast').appendChild(d); setTimeout(() => d.remove(), 2800); while ($('#toast').children.length > 3) $('#toast').firstChild.remove(); }
