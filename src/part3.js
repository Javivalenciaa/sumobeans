
/* ============================== simulation (runs on the host / in solo) ============================== */
const R0 = 380, RMIN = 110, ORB_R = 26, WIN_ROUNDS = 3, MAXP = 5, ACC = 820, DAMP = 2.5, DASH_V = 470, DASH_CD = 1.6;
const MAPS = [
  { id: 'classic', n: ['Sky Disc', 'Disco del Cielo'], shape: 'circle', damp: 2.5, acc: 1, dash: 1 },
  { id: 'ice', n: ['Frozen Rink', 'Pista de Hielo'], shape: 'circle', damp: .9, acc: .5, dash: .55 },
  { id: 'pins', n: ['Pinball', 'Pinball'], shape: 'circle', damp: 2.5, acc: 1, dash: 1, pillars: [[0, 0, 40], [150, 0, 28], [-75, 130, 28], [-75, -130, 28]] },
  { id: 'donut', n: ['Donut', 'Donut'], shape: 'donut', damp: 2.3, acc: 1, dash: .95 },
  { id: 'square', n: ['Square Plaza', 'Plaza Cuadrada'], shape: 'square', damp: 2.5, acc: 1, dash: 1 },
  { id: 'spin', n: ['Spinner', 'Giratoria'], shape: 'circle', damp: 2.5, acc: 1, dash: 1, spin: true },
];
const DIFFS = [ // 0 easy, 1 normal, 2 hard
  { think: [.24, .45], sloppy: [.45, .85], dash: [.05, .13], acc: .82, wander: .16, caution: 58, react: .6 },
  { think: [.14, .28], sloppy: [.2, .5], dash: [.12, .32], acc: .93, wander: .07, caution: 68, react: .8 },
  { think: [.08, .18], sloppy: [.08, .3], dash: [.25, .55], acc: 1, wander: .02, caution: 78, react: 1 },
];
const PICK_KINDS = ['shield', 'heavy', 'boost', 'pulse'];
const PH = ['idle', 'count', 'play', 'roundend', 'matchend']; // snapshot phase codes
const BOT_NAMES = ['Bubbles', 'Bonk', 'Pogo', 'Nacho', 'Zorb', 'Moxie', 'Pip', 'Waffles', 'Boing', 'Tango'];
const r1 = (v) => Math.round(v * 10) / 10, r2 = (v) => Math.round(v * 100) / 100;
class Sim {
  constructor() { this.diff = 0; this.map = 0; this.lastMap = -1; this.hole = 40; this.orbs = []; this.picks = []; this.events = []; this.phase = 0; this.R = R0; this.t = 0; this.cd = 0; this.round = 0; this.winner = -1; this.nextPick = 6; this.pkId = 1; this.ff = 1; }
  addOrb(id, name, skin, human) {
    const o = { id, name, skin, human, x: 0, y: 0, vx: 0, vy: 0, r: ORB_R, alive: true, fall: 0, shield: 0, heavy: 0, boost: 0, dashCd: 0, dash: 0, ix: 0, iy: 0, wantDash: false, score: 0, kills: 0, lastHit: -1, lastHitT: -99, rank: 0,
      ai: this.mkAi() };
    this.orbs.push(o); return o;
  }
  mkAi() { const d = DIFFS[this.diff] || DIFFS[0]; return { next: 0, greed: rnd(.3, .7) * d.react, dashProb: rnd(d.dash[0], d.dash[1]), dashRange: rnd(100, 150), sloppy: rnd(d.sloppy[0], d.sloppy[1]), thinkMin: d.think[0], thinkMax: d.think[1], accMul: d.acc, wander: d.wander, caution: d.caution, wTo: 0, wx: 0, wy: 0 }; }
  setDiff(n) { this.diff = clamp(n | 0, 0, 2); for (const o of this.orbs) if (!o.human) o.ai = this.mkAi(); }
  mp() { return MAPS[this.map] || MAPS[0]; }
  /* signed distance to the nearest place where an orb would fall (positive = safe) */
  margin(x, y) { const m = this.mp(), d = Math.hypot(x, y); if (m.shape === 'square') return this.R * .86 - Math.max(Math.abs(x), Math.abs(y)); if (m.shape === 'donut') return Math.min(this.R - d, d - this.hole); return this.R - d; }
  get(id) { return this.orbs.find((o) => o.id === id); }
  removeOrb(id) { const o = this.get(id); if (o) { o.human = false; o.dropped = true; } }
  startMatch() { for (const o of this.orbs) { o.score = 0; o.kills = 0; } this.round = 0; this.nextRound(); }
  nextRound() {
    this.round++; this.picks = []; this.t = 0; this.R = R0; this.hole = 40; this.cd = 3.2; this.phase = 1; this.winner = -1; this.nextPick = 6; this.lastTick = 4;
    let m; do { m = irnd(0, MAPS.length - 1); } while (m === this.lastMap && MAPS.length > 1); this.map = this.lastMap = this.fixedMap != null ? this.fixedMap : m;
    const n = this.orbs.length, ang0 = rnd(0, TAU), rad = this.mp().shape === 'donut' ? 215 : 170;
    this.orbs.forEach((o, i) => { const a = ang0 + i * TAU / n; o.x = Math.cos(a) * rad; o.y = Math.sin(a) * rad; o.vx = o.vy = 0; o.alive = true; o.fall = 0; o.r = ORB_R; o.shield = o.heavy = o.boost = o.dashCd = o.dash = 0; o.ix = o.iy = 0; o.wantDash = false; o.lastHit = -1; o.fallT = 0; o.ai.next = 0; o.ai.wTo = 0; });
    this.ev(['round', this.round, this.map]);
  }
  ev(e) { if (this.events.length < 60) this.events.push(e); }
  input(id, ix, iy, dash) { const o = this.get(id); if (!o) return; const l = Math.hypot(ix, iy); if (l > 1) { ix /= l; iy /= l; } o.ix = ix; o.iy = iy; if (dash) o.wantDash = true; }
  alive() { return this.orbs.filter((o) => o.alive && !o.fall); }
  mass(o) { return (o.r / ORB_R) * (o.r / ORB_R) * (o.heavy > 0 ? 2.4 : 1) * (o.dash > 0 ? 1.7 : 1); }
  step(dtReal) {
    if (this.phase === 1) { this.cd -= dtReal; const s = Math.ceil(this.cd); if (s !== this.lastTick && s >= 1 && s <= 3) { this.lastTick = s; this.ev(['tick', s]); } if (this.cd <= 0) { this.phase = 2; this.ev(['go']); } return; }
    if (this.phase === 3) { this.cd -= dtReal; this.physics(dtReal, false); if (this.cd <= 0) { if (this.orbs.some((o) => o.score >= WIN_ROUNDS) || this.round >= 9) { this.phase = 4; this.matchWinner = this.orbs.slice().sort((a, b) => b.score - a.score)[0].id; this.ev(['mw', this.matchWinner]); } else this.nextRound(); } return; }
    if (this.phase !== 2) return;
    this.ff = this.orbs.some((o) => o.human && o.alive && !o.fall) ? 1 : 3;
    const steps = this.ff; for (let s = 0; s < steps; s++) { this.physics(dtReal, true); if (this.phase !== 2) break; }
  }
  physics(dt, live) {
    const sub = 2, h = dt / sub;
    for (let s = 0; s < sub; s++) this.sub(h, live);
    if (!live) return;
    this.t += dt;
    // arena shrink after a grace period; sudden death guarantees every round ends
    const t = this.t, sh = this.mp().shape;
    this.R = t <= 9 ? R0 : t < 45 ? R0 - (R0 - RMIN) * ((t - 9) / 36) : t < 70 ? RMIN - (RMIN - 70) * ((t - 45) / 25) : Math.max(18, 70 - 52 * ((t - 70) / 25));
    if (sh === 'donut') { this.hole = t < 5 ? 40 : t < 47 ? 40 + (t - 5) * 2.6 : 150 + (t - 47) * 2.2; const band = t <= 9 ? 340 : t < 45 ? 340 - 280 * ((t - 9) / 36) : t < 70 ? 60 : Math.max(4, 60 - (t - 70) * 2.4); this.R = this.hole + band; }
    // pickups
    this.nextPick -= dt; if (this.nextPick <= 0 && this.picks.length < 3) { this.nextPick = rnd(6, 9); const a = rnd(0, TAU), d = Math.sqrt(Math.random()) * (this.R - 60); this.picks.push({ id: this.pkId++, k: irnd(0, 3), x: Math.cos(a) * d, y: Math.sin(a) * d, age: 0 }); }
    for (const p of this.picks) p.age += dt;
    // round end
    const al = this.alive();
    if (al.length <= 1 && this.orbs.length > 1) { this.phase = 3; this.cd = 2.8; if (al.length) this.winner = al[0].id; else { const f = this.orbs.filter((o) => o.fall > 0 || !o.alive).sort((a, b) => ((b.fallT || 0) - (a.fallT || 0)) || (Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y))); this.winner = f.length ? f[0].id : -1; } const wo = this.get(this.winner); if (wo) wo.score++; this.ev(['rw', this.winner]); }
  }
  sub(h, live) {
    const O = this.orbs;
    for (const o of O) {
      if (!o.alive) continue;
      if (o.fall > 0) { o.fall += h / .9; o.x += o.vx * h; o.y += o.vy * h; o.vx *= 1 - .8 * h; o.vy *= 1 - .8 * h; if (o.fall >= 1) { o.alive = false; o.fall = 1; } continue; }
      o.shield = Math.max(0, o.shield - h); o.heavy = Math.max(0, o.heavy - h); o.boost = Math.max(0, o.boost - h); o.dashCd = Math.max(0, o.dashCd - h); o.dash = Math.max(0, o.dash - h);
      const M = this.mp();
      if (live) {
        if (!o.human) this.think(o);
        const acc = ACC * M.acc * (o.human ? 1 : (o.ai.accMul || 1)) * (o.boost > 0 ? 1.35 : 1) / Math.sqrt(this.mass(o) / (o.dash > 0 ? 1.7 : 1));
        o.vx += o.ix * acc * h; o.vy += o.iy * acc * h;
        if (M.spin) { const d = Math.hypot(o.x, o.y); if (d > 115) { o.vx += (-o.y / d) * 330 * h; o.vy += (o.x / d) * 330 * h; } }
        if (o.wantDash) { o.wantDash = false; if (o.dashCd <= 0) { let dx = o.ix, dy = o.iy; const l = Math.hypot(dx, dy); if (l < .1) { const vl = Math.hypot(o.vx, o.vy) || 1; dx = o.vx / vl; dy = o.vy / vl; } else { dx /= l; dy /= l; }
          if (o.human) { let best = null, bs = 1e9; for (const e of O) { if (e === o || !e.alive || e.fall > 0) continue; const ex = e.x - o.x, ey = e.y - o.y, ed = Math.hypot(ex, ey); if (ed > 260 || ed < 1) continue; const dot = (ex * dx + ey * dy) / ed; if (dot > .9 && ed < bs) { bs = ed; best = [ex / ed, ey / ed]; } } if (best) { dx = dx * .45 + best[0] * .55; dy = dy * .45 + best[1] * .55; const nl = Math.hypot(dx, dy) || 1; dx /= nl; dy /= nl; } }
          const dv = DASH_V * M.dash; o.vx += dx * dv; o.vy += dy * dv; o.dash = .28; o.dashCd = o.boost > 0 ? 0.9 : DASH_CD; this.ev(['dash', o.id, r1(o.x), r1(o.y)]); } }
      }
      const f = Math.exp(-M.damp * h); o.vx *= f; o.vy *= f; o.x += o.vx * h; o.y += o.vy * h;
      if (M.pillars) for (const p of M.pillars) { let dx = o.x - p[0], dy = o.y - p[1]; const d = Math.hypot(dx, dy), md = o.r + p[2]; if (d < md && d > 1e-4) { dx /= d; dy /= d; o.x = p[0] + dx * md; o.y = p[1] + dy * md; const vn = o.vx * dx + o.vy * dy; if (vn < 0) { o.vx -= (1 + 1.25) * vn * dx; o.vy -= (1 + 1.25) * vn * dy; if (live) this.ev(['bump', r1(o.x - dx * o.r), r1(o.y - dy * o.r), r2(clamp(-vn / 600, .1, 1))]); } } }
      if (live && this.margin(o.x, o.y) < -o.r * .15) { o.fall = .001; o.fallT = this.t; const k = o.lastHit >= 0 && this.t - o.lastHitT < 3.5 ? this.get(o.lastHit) : null; if (k && k !== o) k.kills++; this.ev(['fall', o.id, r1(o.x), r1(o.y), k && k !== o ? k.id : -1]); }
      else if (!live && this.margin(o.x, o.y) < -o.r * .15) { o.fall = o.fall || .001; }
    }
    // orb vs orb
    for (let i = 0; i < O.length; i++) for (let j = i + 1; j < O.length; j++) {
      const a = O[i], b = O[j]; if (!a.alive || !b.alive || a.fall > 0 || b.fall > 0) continue;
      let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy), md = a.r + b.r; if (d >= md || d < 1e-4) continue;
      dx /= d; dy /= d; const ma = this.mass(a), mb = this.mass(b), over = md - d;
      a.x -= dx * over * mb / (ma + mb); a.y -= dy * over * mb / (ma + mb); b.x += dx * over * ma / (ma + mb); b.y += dy * over * ma / (ma + mb);
      const vn = (b.vx - a.vx) * dx + (b.vy - a.vy) * dy; if (vn >= 0) continue;
      const e = .95, jimp = -(1 + e) * vn / (1 / ma + 1 / mb); const pa = b.shield > 0 ? .35 : 1, pb = a.shield > 0 ? .35 : 1;
      a.vx -= dx * jimp / ma * pa; a.vy -= dy * jimp / ma * pa; b.vx += dx * jimp / mb * pb; b.vy += dy * jimp / mb * pb;
      const sa = Math.hypot(a.vx, a.vy), sb = Math.hypot(b.vx, b.vy); const attacker = (a.dash > 0 && b.dash <= 0) ? a : (b.dash > 0 && a.dash <= 0) ? b : (sa > sb ? a : b), victim = attacker === a ? b : a;
      victim.lastHit = attacker.id; victim.lastHitT = this.t; this.ev(['bump', r1((a.x + b.x) / 2), r1((a.y + b.y) / 2), r2(clamp(-vn / 700, .1, 1))]);
    }
    // pickups
    if (live) for (let i = this.picks.length - 1; i >= 0; i--) {
      const p = this.picks[i]; for (const o of O) {
        if (!o.alive || o.fall > 0 || Math.hypot(o.x - p.x, o.y - p.y) > o.r + 20) continue;
        const k = PICK_KINDS[p.k]; if (k === 'shield') o.shield = 6; else if (k === 'heavy') o.heavy = 7; else if (k === 'boost') { o.boost = 6; o.dashCd = 0; }
        else { this.ev(['pulse', r1(o.x), r1(o.y)]); for (const q of O) { if (q === o || !q.alive || q.fall > 0) continue; const ddx = q.x - o.x, ddy = q.y - o.y, dd = Math.hypot(ddx, ddy) || 1; if (dd < 190) { const f = (1 - dd / 190) * 620 * (q.shield > 0 ? .4 : 1) / Math.sqrt(this.mass(q)); q.vx += ddx / dd * f; q.vy += ddy / dd * f; q.lastHit = o.id; q.lastHitT = this.t; } } }
        this.ev(['pick', o.id, p.k, p.x, p.y]); this.picks.splice(i, 1); break;
      }
    }
  }
  /* bot AI: get behind a rival and shove him outward; keep away from the edge */
  think(o) {
    const ai = o.ai; if (this.t < ai.next) return; ai.next = this.t + rnd(ai.thinkMin, ai.thinkMax);
    let tx = 0, ty = 0; const m = this.margin(o.x, o.y), d = Math.hypot(o.x, o.y);
    if (m < ai.caution) { const mid = this.mp().shape === 'donut' ? (this.hole + this.R) / 2 : 0, k = mid / (d || 1); tx = o.x * k * .9; ty = o.y * k * .9; if (mid === 0) { tx = -o.x * .6; ty = -o.y * .6; } }
    else if (this.t < ai.wTo) { tx = ai.wx; ty = ai.wy; }
    else if (Math.random() < ai.wander) { const a = rnd(0, TAU), r = rnd(30, Math.max(40, this.R * .6)); ai.wx = Math.cos(a) * r; ai.wy = Math.sin(a) * r; ai.wTo = this.t + rnd(.6, 1.4); tx = ai.wx; ty = ai.wy; }
    else {
      let best = null, bs = 1e9; for (const e of this.orbs) { if (e === o || !e.alive || e.fall > 0) continue; const dd = Math.hypot(e.x - o.x, e.y - o.y); const sc = dd - clamp(1 - this.margin(e.x, e.y) / this.R, 0, 1) * 130 + Math.random() * 90; if (sc < bs) { bs = sc; best = e; } }
      let pk = null, pd = 1e9; for (const p of this.picks) { const dd = Math.hypot(p.x - o.x, p.y - o.y); if (dd < pd) { pd = dd; pk = p; } }
      if (pk && pd < 260 && Math.random() < ai.greed) { tx = pk.x; ty = pk.y; }
      else if (best) {
        const el = Math.hypot(best.x, best.y) || 1, ox = best.x / el, oy = best.y / el, gx = best.x - ox * 46, gy = best.y - oy * 46, dg = Math.hypot(gx - o.x, gy - o.y);
        if (dg > 100) { tx = gx; ty = gy; } else { tx = best.x + ox * 90; ty = best.y + oy * 90; }
        const dd = Math.hypot(best.x - o.x, best.y - o.y); if (o.dashCd <= 0 && dd < ai.dashRange && Math.random() < ai.dashProb) { const k = 1 / this.mp().damp, dv = DASH_V * this.mp().dash, ex = o.x + o.vx * k + (best.x - o.x) / (dd || 1) * dv * k, ey = o.y + o.vy * k + (best.y - o.y) / (dd || 1) * dv * k; if (this.margin(ex, ey) > 50) o.wantDash = true; }
      }
    }
    let dx = tx - o.x, dy = ty - o.y; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl; const j = rnd(-ai.sloppy, ai.sloppy), c = Math.cos(j), s2 = Math.sin(j);
    o.ix = dx * c - dy * s2; o.iy = dx * s2 + dy * c;
  }
  snapshot() {
    const s = { p: this.phase, cd: r2(this.cd), t: r1(this.t), R: r1(this.R), mp: this.map, h: r1(this.hole), rd: this.round, w: this.winner, mw: this.matchWinner == null ? -1 : this.matchWinner,
      o: this.orbs.map((o) => [o.id, r1(o.x), r1(o.y), r1(o.vx), r1(o.vy), r2(o.fall), o.alive ? 1 : 0, r1(o.shield), r1(o.heavy), r1(o.boost), r1(o.dashCd), r1(o.dash), o.score, o.kills]),
      pk: this.picks.map((p) => [p.id, p.k, r1(p.x), r1(p.y), r1(p.age)]), ev: this.events };
    this.events = []; return s;
  }
}
