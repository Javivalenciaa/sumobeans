
/* ============================== simulation (runs on the host / in solo) ============================== */
const R0 = 380, RMIN = 110, ORB_R = 26, WIN_ROUNDS = 2, MAXP = 5, ACC = 820, DAMP = 2.5, DASH_V = 470, DASH_CD = 1.6;
const PICK_KINDS = ['shield', 'heavy', 'boost', 'pulse'];
const PH = ['idle', 'count', 'play', 'roundend', 'matchend']; // snapshot phase codes
const BOT_NAMES = ['Bubbles', 'Bonk', 'Pogo', 'Nacho', 'Zorb', 'Moxie', 'Pip', 'Waffles', 'Boing', 'Tango'];
const r1 = (v) => Math.round(v * 10) / 10, r2 = (v) => Math.round(v * 100) / 100;
class Sim {
  constructor() { this.orbs = []; this.picks = []; this.events = []; this.phase = 0; this.R = R0; this.t = 0; this.cd = 0; this.round = 0; this.winner = -1; this.nextPick = 6; this.pkId = 1; this.ff = 1; }
  addOrb(id, name, skin, human) {
    const o = { id, name, skin, human, x: 0, y: 0, vx: 0, vy: 0, r: ORB_R, alive: true, fall: 0, shield: 0, heavy: 0, boost: 0, dashCd: 0, dash: 0, ix: 0, iy: 0, wantDash: false, score: 0, kills: 0, lastHit: -1, lastHitT: -99, rank: 0,
      ai: { next: 0, greed: rnd(.4, .9), dashProb: rnd(.2, .55), dashRange: rnd(110, 170), sloppy: rnd(.08, .4) } };
    this.orbs.push(o); return o;
  }
  get(id) { return this.orbs.find((o) => o.id === id); }
  removeOrb(id) { const o = this.get(id); if (o) { o.human = false; o.dropped = true; } }
  startMatch() { for (const o of this.orbs) { o.score = 0; o.kills = 0; } this.round = 0; this.nextRound(); }
  nextRound() {
    this.round++; this.picks = []; this.t = 0; this.R = R0; this.cd = 3.2; this.phase = 1; this.winner = -1; this.nextPick = 6; this.lastTick = 4;
    const n = this.orbs.length, ang0 = rnd(0, TAU);
    this.orbs.forEach((o, i) => { const a = ang0 + i * TAU / n; o.x = Math.cos(a) * 170; o.y = Math.sin(a) * 170; o.vx = o.vy = 0; o.alive = true; o.fall = 0; o.r = ORB_R; o.shield = o.heavy = o.boost = o.dashCd = o.dash = 0; o.ix = o.iy = 0; o.wantDash = false; o.lastHit = -1; });
    this.ev(['round', this.round]);
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
    // arena shrink after a grace period
    if (this.t > 9) this.R = Math.max(70, this.t < 45 ? R0 - (R0 - RMIN) * ((this.t - 9) / 36) : RMIN - (RMIN - 70) * ((this.t - 45) / 25));
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
      if (live) {
        if (!o.human) this.think(o);
        const acc = ACC * (o.boost > 0 ? 1.35 : 1) / Math.sqrt(this.mass(o) / (o.dash > 0 ? 1.7 : 1));
        o.vx += o.ix * acc * h; o.vy += o.iy * acc * h;
        if (o.wantDash) { o.wantDash = false; if (o.dashCd <= 0) { let dx = o.ix, dy = o.iy; const l = Math.hypot(dx, dy); if (l < .1) { const vl = Math.hypot(o.vx, o.vy) || 1; dx = o.vx / vl; dy = o.vy / vl; } else { dx /= l; dy /= l; } o.vx += dx * DASH_V; o.vy += dy * DASH_V; o.dash = .28; o.dashCd = o.boost > 0 ? 0.9 : DASH_CD; this.ev(['dash', o.id, r1(o.x), r1(o.y)]); } }
      }
      const f = Math.exp(-DAMP * h); o.vx *= f; o.vy *= f; o.x += o.vx * h; o.y += o.vy * h;
      if (live && Math.hypot(o.x, o.y) > this.R + o.r * .15) { o.fall = .001; o.fallT = this.t; this.ev(['fall', o.id, r1(o.x), r1(o.y)]); if (o.lastHit >= 0 && this.t - o.lastHitT < 3.5) { const k = this.get(o.lastHit); if (k && k !== o) k.kills++; } }
      else if (!live && Math.hypot(o.x, o.y) > R0 + 60) { o.fall = o.fall || .001; }
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
    const ai = o.ai; if (this.t < ai.next) return; ai.next = this.t + rnd(.08, .18);
    const d = Math.hypot(o.x, o.y); let tx = 0, ty = 0;
    if (d > this.R - 75) { tx = -o.x * .6; ty = -o.y * .6; }
    else {
      let best = null, bs = 1e9; for (const e of this.orbs) { if (e === o || !e.alive || e.fall > 0) continue; const dd = Math.hypot(e.x - o.x, e.y - o.y); const sc = dd - (Math.hypot(e.x, e.y) / this.R) * 130; if (sc < bs) { bs = sc; best = e; } }
      let pk = null, pd = 1e9; for (const p of this.picks) { const dd = Math.hypot(p.x - o.x, p.y - o.y); if (dd < pd) { pd = dd; pk = p; } }
      if (pk && pd < 260 && Math.random() < ai.greed) { tx = pk.x; ty = pk.y; }
      else if (best) {
        const el = Math.hypot(best.x, best.y) || 1, ox = best.x / el, oy = best.y / el, gx = best.x - ox * 46, gy = best.y - oy * 46, dg = Math.hypot(gx - o.x, gy - o.y);
        if (dg > 100) { tx = gx; ty = gy; } else { tx = best.x + ox * 90; ty = best.y + oy * 90; }
        const dd = Math.hypot(best.x - o.x, best.y - o.y); if (o.dashCd <= 0 && dd < ai.dashRange && Math.random() < ai.dashProb) { const k = 1 / DAMP, ex = o.x + o.vx * k + (best.x - o.x) / (dd || 1) * DASH_V * k, ey = o.y + o.vy * k + (best.y - o.y) / (dd || 1) * DASH_V * k; if (Math.hypot(ex, ey) < this.R - 55) o.wantDash = true; }
      }
    }
    let dx = tx - o.x, dy = ty - o.y; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl; const j = rnd(-ai.sloppy, ai.sloppy), c = Math.cos(j), s = Math.sin(j);
    o.ix = dx * c - dy * s; o.iy = dx * s + dy * c;
  }
  snapshot() {
    const s = { p: this.phase, cd: r2(this.cd), t: r1(this.t), R: r1(this.R), rd: this.round, w: this.winner, mw: this.matchWinner == null ? -1 : this.matchWinner,
      o: this.orbs.map((o) => [o.id, r1(o.x), r1(o.y), r1(o.vx), r1(o.vy), r2(o.fall), o.alive ? 1 : 0, r1(o.shield), r1(o.heavy), r1(o.boost), r1(o.dashCd), r1(o.dash), o.score, o.kills]),
      pk: this.picks.map((p) => [p.id, p.k, r1(p.x), r1(p.y), r1(p.age)]), ev: this.events };
    this.events = []; return s;
  }
}
