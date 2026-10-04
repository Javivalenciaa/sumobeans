
/* ============================== game data ============================== */
const WEAPONS = {
  bolt: { ico: '✨', n: ['Arcane Bolt', 'Rayo Arcano'], d: ['Fires seeking bolts at the nearest enemy', 'Dispara rayos al enemigo más cercano'], up: ['+1 bolt, more damage', '+1 rayo y más daño'] },
  orbit: { ico: '🔮', n: ['Spirit Orbs', 'Orbes Espirituales'], d: ['Orbs circle you and burn enemies', 'Orbes que giran a tu alrededor'], up: ['+1 orb, more damage', '+1 orbe y más daño'] },
  zap: { ico: '⚡', n: ['Storm Call', 'Llamada de Tormenta'], d: ['Lightning strikes random enemies', 'Rayos sobre enemigos al azar'], up: ['+1 strike, more damage', '+1 rayo y más daño'] },
  aura: { ico: '❄️', n: ['Frost Ring', 'Anillo de Hielo'], d: ['Damages and slows everything near you', 'Daña y ralentiza lo que te rodea'], up: ['Bigger ring, more damage', 'Anillo mayor y más daño'] },
  axe: { ico: '🪓', n: ['Spin Axe', 'Hacha Giratoria'], d: ['Throws axes that fly back to you', 'Lanza hachas que regresan a ti'], up: ['+1 axe, more damage', '+1 hacha y más daño'] },
  nova: { ico: '🔥', n: ['Fire Nova', 'Nova de Fuego'], d: ['Explodes in a ring of fire', 'Estalla en un anillo de fuego'], up: ['Bigger, faster, stronger', 'Mayor, más rápida, más fuerte'] },
};
const PASSIVES = {
  power: { ico: '💪', n: ['Power', 'Poder'], d: ['+15% damage', '+15% de daño'] },
  haste: { ico: '⏱️', n: ['Haste', 'Celeridad'], d: ['-8% cooldowns', '-8% de recarga'] },
  vital: { ico: '❤️', n: ['Vitality', 'Vitalidad'], d: ['+25 max HP and heal', '+25 de vida máx y cura'] },
  swift: { ico: '👟', n: ['Swiftness', 'Rapidez'], d: ['+8% move speed', '+8% de velocidad'] },
  magnet: { ico: '🧲', n: ['Magnetism', 'Magnetismo'], d: ['+30% pickup range', '+30% de alcance de recogida'] },
  regen: { ico: '💚', n: ['Recovery', 'Recuperación'], d: ['+0.5 HP per second', '+0.5 de vida por segundo'] },
  area: { ico: '🌀', n: ['Reach', 'Alcance'], d: ['+10% area & range', '+10% de área y alcance'] },
};
const SHOP = [
  { id: 'hp', ico: '❤️', n: ['Toughness', 'Dureza'], d: ['+10 starting HP', '+10 de vida inicial'], max: 10 },
  { id: 'dmg', ico: '⚔️', n: ['Might', 'Fuerza'], d: ['+5% damage', '+5% de daño'], max: 10 },
  { id: 'spd', ico: '👟', n: ['Agility', 'Agilidad'], d: ['+3% move speed', '+3% de velocidad'], max: 8 },
  { id: 'mag', ico: '🧲', n: ['Greed', 'Codicia'], d: ['+10% pickup range', '+10% de alcance de recogida'], max: 8 },
  { id: 'xp', ico: '📘', n: ['Wisdom', 'Sabiduría'], d: ['+6% XP gained', '+6% de XP'], max: 8 },
  { id: 'gold', ico: '💰', n: ['Fortune', 'Fortuna'], d: ['+10% gold gained', '+10% de oro'], max: 8 },
  { id: 'regen', ico: '💚', n: ['Vigor', 'Vigor'], d: ['+0.15 HP/s', '+0.15 vida/s'], max: 6 },
];
const shopLv = (id) => SV.shop[id] || 0, shopCost = (id) => Math.round(45 + shopLv(id) * 55 + shopLv(id) * shopLv(id) * 6);
const ETYPE = {
  slime: { hp: 14, spd: 50, dmg: 6, r: 14, xp: 1, spr: 'slime', sw: 44 },
  bat: { hp: 7, spd: 98, dmg: 5, r: 11, xp: 1, spr: 'bat', sw: 28 },
  brute: { hp: 75, spd: 40, dmg: 14, r: 25, xp: 5, spr: 'brute', sw: 72 },
  watcher: { hp: 32, spd: 44, dmg: 8, r: 17, xp: 3, spr: 'watcher', sw: 46, ranged: true },
  elite: { hp: 520, spd: 46, dmg: 20, r: 34, xp: 30, spr: 'brute', sw: 100, elite: true },
  boss1: { hp: 2600, spd: 38, dmg: 26, r: 58, xp: 120, spr: 'boss1', sw: 150, boss: true },
  boss2: { hp: 7200, spd: 36, dmg: 32, r: 66, xp: 300, spr: 'boss2', sw: 170, boss: true },
};

/* ============================== state ============================== */
const cv = $('#cv'), cx = cv.getContext('2d'); let VW = 800, VH = 600, DPR = 1, Z = 1, UI = 1;
const bl1 = document.createElement('canvas'), bl2 = document.createElement('canvas'), b1 = bl1.getContext('2d'), b2 = bl2.getContext('2d');
const CAN_FILTER = (() => { try { return 'filter' in b1; } catch (e) { return false; } })();
let state = 'menu', P = null, G = null, cam = { x: 0, y: 0, sh: 0 }, uid = 1;
const keys = {}, joy = { on: false, id: -1, ox: 0, oy: 0, x: 0, y: 0 };
let enemies = [], shots = [], eshots = [], gems = [], parts = [], texts = [], fxs = [], grid = new Map();
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1); VW = window.innerWidth; VH = window.innerHeight; cv.width = Math.floor(VW * DPR); cv.height = Math.floor(VH * DPR);
  Z = clamp(Math.min(VW, VH) / 640, .62, 1.5) * (VW > VH ? 1 : 1); UI = clamp(Math.min(VW, VH) / 700, .85, 1.35);
  bl1.width = Math.ceil(cv.width / 4); bl1.height = Math.ceil(cv.height / 4); bl2.width = Math.ceil(cv.width / 10); bl2.height = Math.ceil(cv.height / 10);
}
function metaMods() { return { hp: shopLv('hp') * 10, dmg: 1 + shopLv('dmg') * .05, spd: 1 + shopLv('spd') * .03, mag: 1 + shopLv('mag') * .1, xp: 1 + shopLv('xp') * .06, gold: 1 + shopLv('gold') * .1, regen: shopLv('regen') * .15 }; }
function newRun() {
  const h = HEROES[SV.hero], m = metaMods();
  P = { x: 0, y: 0, vx: 0, vy: 0, face: 1, hp: 100 + h.hp + m.hp, max: 100 + h.hp + m.hp, spd: 168 * (1 + h.spd) * m.spd, hurt: 0, inv: 0, lvl: 1, xp: 0, need: 5, w: {}, p: {}, magnet: 78 * m.mag, regen: m.regen, kills: 0, gold: 0, revived: false, walk: 0, hero: SV.hero, xpMul: m.xp, goldMul: m.gold, dmgMul: m.dmg };
  P.w[h.w] = { lvl: 1, cd: .3 };
  G = { t: 0, spawn: 0, elite: 45, boss1: false, boss2: false, boss: null, picks: 0, win: false, lastHeal: 0, hitStop: 0, over: false };
  enemies = []; shots = []; eshots = []; gems = []; parts = []; texts = []; fxs = []; cam.x = 0; cam.y = 0; cam.sh = 0;
}
const pm = (k) => P.p[k] || 0;
const dmgMul = () => P.dmgMul * (1 + .15 * pm('power')), cdMul = () => Math.pow(.92, pm('haste')), areaMul = () => 1 + .1 * pm('area');
const wl = (k) => (P.w[k] ? P.w[k].lvl : 0);

/* ============================== combat helpers ============================== */
function nearest(x, y, maxd, skip) { let b = null, bd = maxd * maxd; for (const e of enemies) { if (skip && skip.indexOf(e) >= 0) continue; const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; b = e; } } return b; }
function spark(x, y, n, col, sp, life) { for (let i = 0; i < n && parts.length < 600; i++) { const a = rnd(0, TAU), s = rnd(.3, 1) * (sp || 160); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.25, 1) * (life || .6), max: life || .6, c: col, s: rnd(1.5, 3.6), g: 0 }); } }
function dtext(x, y, txt, col, s) { if (texts.length > 70) texts.shift(); texts.push({ x: x + rnd(-8, 8), y, txt, col: col || '#fff', s: s || 1, life: .7 }); }
function hit(e, dmg, kx, ky, noText) {
  const crit = Math.random() < .1; if (crit) dmg *= 1.8; dmg = Math.max(1, Math.round(dmg)); e.hp -= dmg; e.flash = .09;
  const kb = e.boss ? 0 : (e.elite ? 40 : 120); e.kx += kx * kb; e.ky += ky * kb; if (!noText) dtext(e.x, e.y - e.r, dmg, crit ? '#ffe14d' : '#fff', crit ? 1.35 : 1); sfx('hit');
  if (e.hp <= 0 && !e.dead) killEnemy(e);
}
function dropGem(x, y, v) { gems.push({ x: x + rnd(-8, 8), y: y + rnd(-8, 8), v, k: v >= 20 ? 2 : v >= 4 ? 1 : 0, kind: 'xp', fly: false, sp: 0, ph: rnd(0, 6) }); }
function killEnemy(e) {
  e.dead = true; P.kills++; const T = ETYPE[e.t]; spark(e.x, e.y, e.boss ? 60 : e.elite ? 26 : 10, e.t === 'slime' ? '#7dff9a' : e.t === 'bat' ? '#b06bff' : e.t === 'watcher' ? '#ffcf8a' : '#ff6b8b', e.boss ? 380 : 190);
  if (e.boss) { for (let i = 0; i < 18; i++) dropGem(e.x, e.y, 8); gems.push({ x: e.x, y: e.y, kind: 'chest', fly: false, ph: 0 }); gems.push({ x: e.x + 40, y: e.y, kind: 'chest', fly: false, ph: 0 }); cam.sh = 18; sfx('boss'); happy(); G.boss = null; if (e.t === 'boss2') { gameOver(true); } }
  else if (e.elite) { for (let i = 0; i < 6; i++) dropGem(e.x, e.y, 10); gems.push({ x: e.x, y: e.y, kind: 'chest', fly: false, ph: 0 }); cam.sh = 8; sfx('chest'); }
  else { dropGem(e.x, e.y, T.xp * 2); const r = Math.random(); if (r < .09) gems.push({ x: e.x, y: e.y, kind: 'coin', v: 4 + irnd(0, 4), fly: false, ph: 0 }); else if (r < .0925) gems.push({ x: e.x, y: e.y, kind: 'heart', fly: false, ph: 0 }); else if (r < .0945) gems.push({ x: e.x, y: e.y, kind: 'magnet', fly: false, ph: 0 }); sfx('kill'); }
}
function hurtPlayer(d) {
  if (P.inv > 0 || G.over) return; P.hp -= d; P.inv = .55; P.hurt = .2; cam.sh = Math.max(cam.sh, 7); sfx('hurt'); spark(P.x, P.y, 10, '#ff4466', 200);
  dtext(P.x, P.y - 40, '-' + Math.round(d), '#ff6b8b', 1.2); if (P.hp <= 0) { P.hp = 0; gameOver(false); }
}
function fireWeapons(dt) {
  const cm = cdMul(), dm = dmgMul(), am = areaMul();
  for (const k in P.w) {
    const w = P.w[k], L = w.lvl; w.cd -= dt;
    if (k === 'bolt') { if (w.cd > 0) continue; const tg = nearest(P.x, P.y, 560 / Math.min(1, Z + .2)); if (!tg) { w.cd = .1; continue; } w.cd = (1.15 - .09 * L) * cm; const n = 1 + Math.floor((L + 1) / 2), base = Math.atan2(tg.y - P.y, tg.x - P.x);
      for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * .16; shots.push({ k: 'bolt', x: P.x, y: P.y - 8, vx: Math.cos(a) * 470, vy: Math.sin(a) * 470, dmg: (14 + 5 * L) * dm, life: 1.3, pierce: 1 + Math.floor(L / 3), hitIds: [], r: 9 }); } sfx('shot'); }
    else if (k === 'axe') { if (w.cd > 0) continue; w.cd = (2.1 - .13 * L) * cm; const n = 1 + Math.floor(L / 3), tg = nearest(P.x, P.y, 600), base = tg ? Math.atan2(tg.y - P.y, tg.x - P.x) : (P.face > 0 ? 0 : Math.PI);
      for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * .5; shots.push({ k: 'axe', x: P.x, y: P.y, vx: Math.cos(a) * 330, vy: Math.sin(a) * 330, dmg: (20 + 7 * L) * dm, life: 3, out: .55 * am, back: false, rot: 0, r: 20 * am, hc: new Map(), pierce: 999 }); } sfx('shot'); }
    else if (k === 'zap') { if (w.cd > 0) continue; w.cd = (1.9 - .12 * L) * cm; const n = 1 + L, used = []; for (let i = 0; i < n; i++) { const e = nearest(P.x + rnd(-120, 120), P.y + rnd(-120, 120), 520, used); if (!e) break; used.push(e); fxs.push({ k: 'zap', x: e.x, y: e.y, life: .22, max: .22, seed: Math.random() }); hit(e, (28 + 10 * L) * dm, 0, 0); spark(e.x, e.y, 8, '#bfefff', 220, .4);
        for (const o of enemies) if (o !== e && !o.dead && (o.x - e.x) ** 2 + (o.y - e.y) ** 2 < 60 * 60 * am * am) hit(o, (14 + 5 * L) * dm, 0, 0, true); } if (used.length) sfx('zap'); }
    else if (k === 'nova') { if (w.cd > 0) continue; w.cd = (4.2 - .3 * L) * cm; fxs.push({ k: 'nova', x: P.x, y: P.y, r: 10, max: (150 + 22 * L) * am, life: 1, dmg: (34 + 12 * L) * dm, done: new Set() }); sfx('nova'); }
  }
  // continuous weapons
  if (P.w.orbit) { const L = P.w.orbit.lvl, n = 2 + Math.floor((L + 1) / 1.6), rad = (82 + 6 * L) * areaMul(), sp = 2.3 + .25 * L; P.orbs = []; for (let i = 0; i < n; i++) { const a = G.t * sp + i * TAU / n, ox = P.x + Math.cos(a) * rad, oy = P.y + Math.sin(a) * rad * .92; P.orbs.push({ x: ox, y: oy, a });
      for (const e of enemies) { if (e.dead) continue; const dx = e.x - ox, dy = e.y - oy; if (dx * dx + dy * dy < (e.r + 14) ** 2 && G.t - (e.oc || 0) > .4) { e.oc = G.t; const d = Math.hypot(dx, dy) || 1; hit(e, (11 + 4 * L) * dmgMul(), dx / d, dy / d); } } } } else P.orbs = null;
  if (P.w.aura) { const w = P.w.aura, L = w.lvl, rad = (70 + 13 * L) * areaMul(); P.auraR = rad; if (w.cd <= 0) { w.cd = .5 * cdMul(); for (const e of enemies) { if (e.dead) continue; if ((e.x - P.x) ** 2 + (e.y - P.y) ** 2 < (rad + e.r) ** 2) { e.slow = .8; hit(e, (6 + 2.5 * L) * dm, 0, 0, true); } } } } else P.auraR = 0;
}
function hitGridBuild() { grid.clear(); for (const e of enemies) { const k = (Math.floor(e.x / 96) + 4096) * 8192 + Math.floor(e.y / 96) + 4096; let a = grid.get(k); if (!a) { a = []; grid.set(k, a); } a.push(e); } }
function gridNear(x, y, fn) { const cx0 = Math.floor(x / 96), cy0 = Math.floor(y / 96); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = grid.get((cx0 + i + 4096) * 8192 + cy0 + j + 4096); if (a) for (const e of a) fn(e); } }
/* ============================== spawning ============================== */
function spawnAt(type, x, y, mul) {
  const T = ETYPE[type], hpm = 1 + G.t / 80 + Math.pow(G.t / 210, 2);
  const e = { id: uid++, t: type, x, y, r: T.r, hp: T.hp * hpm * (mul || 1), mhp: 0, spd: T.spd * (1 + Math.min(.5, G.t / 900)) * rnd(.9, 1.1), dmg: T.dmg * (1 + G.t / 400), kx: 0, ky: 0, flash: 0, slow: 0, ph: rnd(0, 6), sh: rnd(1.2, 2.4), dead: false, boss: !!T.boss, elite: !!T.elite, fx: 1 };
  e.mhp = e.hp; enemies.push(e); return e;
}
function ringPos() { const a = rnd(0, TAU), d = Math.hypot(VW, VH) / Z / 2 + 90; return [P.x + Math.cos(a) * d, P.y + Math.sin(a) * d]; }
function director(dt) {
  const tt = G.t; const cap = Math.min(330, 55 + tt * .62), rate = (1.4 + tt * .05) * (G.boss ? .45 : 1);
  G.spawn += dt * rate; while (G.spawn >= 1) {
    G.spawn -= 1; if (enemies.length >= cap) break; const [x, y] = ringPos(), r = Math.random(); let type = 'slime';
    if (tt > 20 && r < .28) type = 'bat'; if (tt > 75 && r > .86) type = 'brute'; if (tt > 120 && r > .72 && r <= .86) type = 'watcher'; if (tt > 200 && r < .12) type = 'brute';
    const grp = type === 'bat' && tt > 60 ? 3 : 1; for (let i = 0; i < grp; i++) spawnAt(type, x + rnd(-30, 30), y + rnd(-30, 30));
  }
  if (tt >= G.elite) { G.elite += 70; const [x, y] = ringPos(); spawnAt('elite', x, y); toast('⚠ ' + (LANG === 'es' ? 'Élite cerca' : 'Elite incoming')); }
  if (tt >= 240 && !G.boss1) { G.boss1 = true; const [x, y] = ringPos(); G.boss = spawnAt('boss1', x, y); G.boss.name = LANG === 'es' ? 'El Guardián' : 'The Warden'; sfx('boss'); toast('☠ ' + t('boss') + ': ' + G.boss.name); cam.sh = 12; }
  if (tt >= 420 && !G.boss2 && !G.boss) { G.boss2 = true; const [x, y] = ringPos(); G.boss = spawnAt('boss2', x, y); G.boss.name = LANG === 'es' ? 'El Rey Hueco' : 'The Hollow King'; sfx('boss'); toast('☠ ' + t('boss') + ': ' + G.boss.name); cam.sh = 16; }
}
function eshoot(e, a, sp, dmg, r) { eshots.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg, life: 5, r: r || 8 }); }
/* ============================== update ============================== */
function update(dt) {
  G.t += dt; const m = metaMods();
  // movement
  let ix = (keys.d || keys.ArrowRight ? 1 : 0) - (keys.a || keys.ArrowLeft ? 1 : 0), iy = (keys.s || keys.ArrowDown ? 1 : 0) - (keys.w || keys.ArrowUp ? 1 : 0);
  if (joy.on) { const dx = joy.x - joy.ox, dy = joy.y - joy.oy, l = Math.hypot(dx, dy); if (l > 6) { const k = Math.min(1, l / 55) / l; ix = dx * k; iy = dy * k; } }
  const il = Math.hypot(ix, iy); if (il > 1) { ix /= il; iy /= il; }
  const sp = P.spd * (1 + .08 * pm('swift')); P.vx += (ix * sp - P.vx) * Math.min(1, dt * 14); P.vy += (iy * sp - P.vy) * Math.min(1, dt * 14); P.x += P.vx * dt; P.y += P.vy * dt;
  if (Math.abs(P.vx) > 8) P.face = P.vx > 0 ? 1 : -1; P.walk += Math.hypot(P.vx, P.vy) * dt * .06;
  P.inv = Math.max(0, P.inv - dt); P.hurt = Math.max(0, P.hurt - dt); P.hp = Math.min(P.max, P.hp + (P.regen + .5 * pm('regen')) * dt);
  gemT += dt; if (gemT > .5) { gemN = 0; gemT = 0; }
  director(dt); fireWeapons(dt); hitGridBuild();
  // enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]; if (e.dead) { enemies.splice(i, 1); continue; } const T = ETYPE[e.t]; e.flash = Math.max(0, e.flash - dt); e.slow = Math.max(0, e.slow - dt);
    const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d; let spd = e.spd * (e.slow > 0 ? .55 : 1);
    if (d > 1500 && !e.boss) { const [x, y] = ringPos(); e.x = x; e.y = y; continue; }
    let mx = ux, my = uy;
    if (e.t === 'bat') { e.ph += dt * 5; mx += -uy * Math.sin(e.ph) * .8; my += ux * Math.sin(e.ph) * .8; }
    else if (T.ranged) { if (d < 230) { mx = -ux; my = -uy; } else if (d < 300) { mx = -uy * .6; my = ux * .6; } e.sh -= dt; if (e.sh <= 0 && d < 520) { e.sh = rnd(2, 3); eshoot(e, Math.atan2(dy, dx), 190, e.dmg * .8, 7); } }
    else if (e.boss) bossAI(e, dt, d, dx, dy);
    if (e.charge > 0) { e.charge -= dt; mx = e.cx; my = e.cy; spd = 330; }
    e.x += mx * spd * dt + e.kx * dt; e.y += my * spd * dt + e.ky * dt; e.kx *= Math.pow(.02, dt); e.ky *= Math.pow(.02, dt); e.vx = mx;
    if (!e.boss) { // soft separation
      const gx = Math.floor(e.x / 96), gy = Math.floor(e.y / 96), a = grid.get((gx + 4096) * 8192 + gy + 4096); if (a) for (let j = 0; j < a.length && j < 8; j++) { const o = a[j]; if (o === e || o.boss) continue; const ox = e.x - o.x, oy = e.y - o.y, dd = ox * ox + oy * oy, rr = (e.r + o.r) * .8; if (dd < rr * rr && dd > .01) { const l = Math.sqrt(dd), push = (rr - l) * .5; e.x += ox / l * push * .5; e.y += oy / l * push * .5; } } }
    if (d < e.r + 14) hurtPlayer(e.dmg);
  }
  // player shots
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i]; s.life -= dt;
    if (s.k === 'axe') { s.rot += dt * 14; if (!s.back) { s.out -= dt; if (s.out <= 0) s.back = true; } else { const dx = P.x - s.x, dy = P.y - s.y, d = Math.hypot(dx, dy) || 1; s.vx += (dx / d * 520 - s.vx) * Math.min(1, dt * 6); s.vy += (dy / d * 520 - s.vy) * Math.min(1, dt * 6); if (d < 22) s.life = 0; } }
    s.x += s.vx * dt; s.y += s.vy * dt; if (s.life <= 0) { shots.splice(i, 1); continue; }
    let gone = false; gridNear(s.x, s.y, (e) => {
      if (gone || e.dead) return; const dx = e.x - s.x, dy = e.y - s.y, rr = e.r + s.r; if (dx * dx + dy * dy > rr * rr) return;
      if (s.k === 'axe') { if (G.t - (s.hc.get(e.id) || -1) < .35) return; s.hc.set(e.id, G.t); } else { if (s.hitIds.indexOf(e.id) >= 0) return; s.hitIds.push(e.id); }
      const l = Math.hypot(s.vx, s.vy) || 1; hit(e, s.dmg, s.vx / l, s.vy / l); spark(s.x, s.y, 4, s.k === 'axe' ? '#e8f4ff' : '#8ff1ff', 140, .3); if (s.k === 'bolt' && --s.pierce <= 0) { gone = true; }
    });
    if (gone) shots.splice(i, 1);
  }
  // fx (nova rings, zaps)
  for (let i = fxs.length - 1; i >= 0; i--) { const f = fxs[i]; f.life -= dt * (f.k === 'nova' ? 1.6 : 1);
    if (f.k === 'nova') { f.r += (f.max - f.r) * Math.min(1, dt * 5) + dt * 40; if (f.life < .5) { /* expansion done */ } for (const e of enemies) { if (e.dead || f.done.has(e.id)) continue; const d = Math.hypot(e.x - f.x, e.y - f.y); if (d < f.r + e.r) { f.done.add(e.id); const l = d || 1; hit(e, f.dmg, (e.x - f.x) / l, (e.y - f.y) / l); } } if (f.enemy) { const d = Math.hypot(P.x - f.x, P.y - f.y); if (!f.pd && Math.abs(d - f.r) < 24) { f.pd = true; hurtPlayer(f.dmg); } } }
    if (f.life <= 0) fxs.splice(i, 1); }
  // enemy shots
  for (let i = eshots.length - 1; i >= 0; i--) { const s = eshots[i]; s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.life <= 0) { eshots.splice(i, 1); continue; } if ((s.x - P.x) ** 2 + (s.y - P.y) ** 2 < (s.r + 13) ** 2) { hurtPlayer(s.dmg); eshots.splice(i, 1); } }
  // pickups
  for (let i = gems.length - 1; i >= 0; i--) {
    const g = gems[i]; g.ph += dt; const dx = P.x - g.x, dy = P.y - g.y, d = Math.hypot(dx, dy) || 1, rng = P.magnet * (1 + .3 * pm('magnet')) * (g.kind === 'chest' ? .6 : 1);
    if (d < rng || g.fly) { g.fly = true; g.sp = Math.min(900, (g.sp || 120) + 1500 * dt); g.x += dx / d * g.sp * dt; g.y += dy / d * g.sp * dt; }
    if (d < 22) {
      if (g.kind === 'xp') { addXp(g.v); sfx('gem'); } else if (g.kind === 'coin') { P.gold += Math.round(g.v * P.goldMul); sfx('gem'); } else if (g.kind === 'heart') { P.hp = Math.min(P.max, P.hp + P.max * .3); dtext(P.x, P.y - 40, '+HP', '#6dff9a', 1.2); sfx('lvl'); }
      else if (g.kind === 'magnet') { for (const o of gems) o.fly = true; sfx('lvl'); toast('🧲'); } else if (g.kind === 'chest') { sfx('chest'); P.gold += Math.round(30 * P.goldMul); G.picks++; G.chestPick = true; }
      gems.splice(i, 1);
    }
  }
  if (gems.length > 500) gems.splice(0, gems.length - 500);
  // particles / texts
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.05, dt); p.vy *= Math.pow(.05, dt); }
  for (let i = texts.length - 1; i >= 0; i--) { const q = texts[i]; q.life -= dt; q.y -= 40 * dt; if (q.life <= 0) texts.splice(i, 1); }
  cam.x += (P.x - cam.x) * Math.min(1, dt * 8); cam.y += (P.y - cam.y) * Math.min(1, dt * 8); cam.sh = Math.max(0, cam.sh - dt * 30);
  if (G.picks > 0 && state === 'play') openLevelUp();
}
function bossAI(e, dt, d, dx, dy) {
  e.bt = (e.bt || 0) + dt; const hpf = e.hp / e.mhp;
  if (e.t === 'boss1') {
    if (e.bt > 3.2) { e.bt = 0; const n = hpf < .5 ? 22 : 14, off = rnd(0, TAU); for (let i = 0; i < n; i++) eshoot(e, off + i * TAU / n, 150, 14, 9); sfx('zap'); }
    e.ct = (e.ct || 0) + dt; if (e.ct > 8 && !e.charge) { e.ct = 0; e.charge = .7; const l = d || 1; e.cx = dx / l; e.cy = dy / l; toast('!'); }
  } else {
    if (e.bt > .22) { e.bt = 0; e.sp = (e.sp || 0) + .45; for (let k = 0; k < (hpf < .5 ? 3 : 2); k++) eshoot(e, e.sp + k * TAU / (hpf < .5 ? 3 : 2), 175, 13, 8); }
    e.ct = (e.ct || 0) + dt; if (e.ct > 7) { e.ct = 0; for (let i = 0; i < 5; i++) { const a = rnd(0, TAU); spawnAt('slime', e.x + Math.cos(a) * 90, e.y + Math.sin(a) * 90); } fxs.push({ k: 'nova', x: e.x, y: e.y, r: 10, max: 280, life: 1, dmg: 20, done: new Set(), enemy: true }); sfx('nova'); }
  }
}
function addXp(v) { P.xp += v * P.xpMul; while (P.xp >= P.need) { P.xp -= P.need; P.lvl++; P.need = Math.floor(5 + P.lvl * 3.4 + Math.pow(P.lvl, 1.4)); G.picks++; sfx('lvl'); } }
