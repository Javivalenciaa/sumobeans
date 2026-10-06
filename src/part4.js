
/* ============================== rendering ============================== */
const cv = $('#cv'), cx = cv.getContext('2d'); let VW = 800, VH = 600, DPR = 1;
function resize() { DPR = Math.min(2, window.devicePixelRatio || 1); VW = window.innerWidth; VH = window.innerHeight; cv.width = Math.floor(VW * DPR); cv.height = Math.floor(VH * DPR); }
const OL = '#1c1424';
const PICK_ICON = ['🛡', '⚖', '⚡', '💥'], PICK_COL = ['#5ac8ff', '#a8a8b8', '#ffd23a', '#ff6a4a'];
let parts = [], texts = [], shake = 0, clouds = [];
function spark(x, y, n, col, sp, life) { for (let i = 0; i < n && parts.length < 400; i++) { const a = rnd(0, TAU), s = rnd(.3, 1) * (sp || 220); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.4, 1) * (life || .6), max: life || .6, c: col, s: rnd(2, 5), star: Math.random() < .35 }); } }
function floatText(x, y, txt, col) { texts.push({ x, y, txt, col: col || '#fff', life: 1.1 }); if (texts.length > 12) texts.shift(); }
function skinOf(i) { return SKINS[i] || SKINS[0]; }
function pattern(c, r, sk) {
  c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip(); c.fillStyle = 'rgba(255,255,255,.55)'; c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = r * .16;
  switch (sk.pat) {
    case 'stripes': for (let i = -3; i <= 3; i++) { c.fillRect(i * r * .52 - r * .12, -r, r * .24, r * 2); } break;
    case 'dots': for (const [a, b] of [[-.5, -.2], [.4, -.4], [.1, .5], [-.35, .55], [.62, .25], [-.05, -.62]]) { c.beginPath(); c.arc(a * r, b * r, r * .15, 0, TAU); c.fill(); } break;
    case 'rings': for (const k of [.38, .72]) { c.beginPath(); c.arc(0, 0, r * k, 0, TAU); c.stroke(); } break;
    case 'check': { const q = r * .5; for (let i = -2; i < 2; i++) for (let j = -2; j < 2; j++) if ((i + j) & 1) c.fillRect(i * q, j * q, q, q); } break;
    case 'zig': c.beginPath(); for (let i = -4; i <= 4; i++) { const x = i * r * .3; c.lineTo(x, (i & 1 ? -1 : 1) * r * .2); } c.stroke(); c.beginPath(); for (let i = -4; i <= 4; i++) { const x = i * r * .3; c.lineTo(x, r * .5 + (i & 1 ? -1 : 1) * r * .2); } c.stroke(); break;
    case 'star': for (const [a, b, k] of [[-.4, -.35, .3], [.45, .1, .22], [-.1, .5, .2]]) { c.beginPath(); for (let i = 0; i < 10; i++) { const rr = i & 1 ? r * k * .45 : r * k, an = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(a * r + Math.cos(an) * rr, b * r + Math.sin(an) * rr); } c.closePath(); c.fill(); } break;
    case 'heart': for (const [a, b, k] of [[-.4, -.2, .22], [.4, .3, .2]]) { c.beginPath(); const x = a * r, y = b * r, s = r * k; c.moveTo(x, y + s * .9); c.bezierCurveTo(x - s * 1.6, y - s * .2, x - s * .5, y - s * 1.2, x, y - s * .3); c.bezierCurveTo(x + s * .5, y - s * 1.2, x + s * 1.6, y - s * .2, x, y + s * .9); c.fill(); } break;
  }
  c.restore();
}
/* one orb (shared by the arena, the menu and the lobby) */
function drawOrb(c, x, y, r, skinIdx, o) {
  o = o || {}; const sk = skinOf(skinIdx), look = o.look || [0, 0.2], lw = Math.max(2, r * .11), sx = o.sx || 1, sy = o.sy || 1, rot = o.rot || 0;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(sx, sy);
  const g = c.createRadialGradient(-r * .35, -r * .4, r * .1, 0, 0, r * 1.05); g.addColorStop(0, sk.c1); g.addColorStop(1, sk.c2);
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.lineWidth = lw * 2; c.strokeStyle = OL; c.stroke(); c.fillStyle = g; c.fill();
  c.rotate(-rot); c.save(); c.rotate(o.spin || 0); pattern(c, r, sk); c.restore();
  c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-r * .38, -r * .45, r * .3, r * .17, -.6, 0, TAU); c.fill();
  // face looking along the motion
  const lx = clamp(look[0], -1, 1) * r * .16, ly = clamp(look[1], -1, 1) * r * .12, er = r * .22, ey = -r * .02;
  for (const s of [-1, 1]) { const ex = s * r * .3 + lx; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, ey + ly, er * .9, er * 1.1, 0, 0, TAU); c.fill(); c.lineWidth = lw * .55; c.strokeStyle = OL; c.stroke(); c.fillStyle = OL; c.beginPath(); c.arc(ex + lx * .9, ey + ly + er * .12, er * .5, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + lx * .9 - er * .12, ey + ly - er * .12, er * .17, 0, TAU); c.fill(); }
  c.strokeStyle = OL; c.lineWidth = lw * .6; c.lineCap = 'round';
  if (o.scared) { c.beginPath(); c.ellipse(lx * .5, r * .42, r * .1, r * .13, 0, 0, TAU); c.stroke(); }
  else if (o.angry) { c.beginPath(); c.arc(lx * .5, r * .5, r * .17, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.beginPath(); c.moveTo(-r * .5 + lx, ey - er * 1.2); c.lineTo(-r * .12 + lx, ey - er * .9); c.moveTo(r * .5 + lx, ey - er * 1.2); c.lineTo(r * .12 + lx, ey - er * .9); c.stroke(); }
  else { c.beginPath(); c.arc(lx * .5, r * .26, r * .17, .15, Math.PI - .15); c.stroke(); }
  c.restore();
}
function orbIcon(canvas, skinIdx, sz) { sz = sz || 44; const k = window.devicePixelRatio || 1; canvas.width = canvas.height = Math.round(sz * 2); const c = canvas.getContext('2d'); c.clearRect(0, 0, canvas.width, canvas.height); drawOrb(c, sz, sz, sz * .8, skinIdx, { look: [0, .2] }); }
/* world -> screen */
function layout() { const w = cv.width, h = cv.height, s = Math.min(w, h) * .5 * .9 / (R0 + 34) * (window.__zoom || 1); return { s, cx: w / 2 + (window.__ox || 0), cy: h / 2 + h * .015 + (window.__oy || 0) }; }
function drawSky(tm, w, h) {
  const g = cx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3a2aa0'); g.addColorStop(.45, '#7a62e0'); g.addColorStop(1, '#ffb0d8'); cx.fillStyle = g; cx.fillRect(0, 0, w, h);
  if (!clouds.length) for (let i = 0; i < 9; i++) clouds.push({ x: Math.random(), y: Math.random(), s: rnd(.6, 1.6), v: rnd(.004, .012) });
  for (const c of clouds) { const x = ((c.x + tm * .00001 * c.v * 100) % 1.3 - .15) * w, y = c.y * h, u = c.s * Math.min(w, h) * .08; cx.fillStyle = 'rgba(255,255,255,.35)'; cx.beginPath(); cx.arc(x, y, u, 0, TAU); cx.arc(x + u * 1.1, y + u * .15, u * .8, 0, TAU); cx.arc(x - u * 1.0, y + u * .2, u * .7, 0, TAU); cx.arc(x + u * .2, y - u * .4, u * .75, 0, TAU); cx.fill(); }
}
function drawArena(L, st, tm) {
  const R = st.R * L.s, c = cx; const depth = 16 * L.s;
  c.fillStyle = 'rgba(30,10,80,.28)'; c.beginPath(); c.ellipse(L.cx, L.cy + depth * 2.4, R * 1.02, R * .98, 0, 0, TAU); c.fill();
  c.fillStyle = '#3a2a7a'; c.strokeStyle = OL; c.lineWidth = 3 * L.s * 2; c.beginPath(); c.arc(L.cx, L.cy + depth, R, 0, TAU); c.fill(); c.stroke();
  const g = c.createRadialGradient(L.cx - R * .2, L.cy - R * .25, R * .1, L.cx, L.cy, R); g.addColorStop(0, '#fff0d0'); g.addColorStop(1, '#ffd29a');
  c.beginPath(); c.arc(L.cx, L.cy, R, 0, TAU); c.fillStyle = g; c.fill();
  c.save(); c.clip(); const bands = 7; for (let i = bands; i >= 1; i--) { if (i & 1) { c.fillStyle = 'rgba(255,150,60,.16)'; c.beginPath(); c.arc(L.cx, L.cy, R * i / bands, 0, TAU); c.arc(L.cx, L.cy, R * (i - 1) / bands, 0, TAU, true); c.fill(); } }
  c.strokeStyle = 'rgba(180,90,30,.22)'; c.lineWidth = 2 * L.s * 2; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; c.beginPath(); c.moveTo(L.cx + Math.cos(a) * R * .12, L.cy + Math.sin(a) * R * .12); c.lineTo(L.cx + Math.cos(a) * R, L.cy + Math.sin(a) * R); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(L.cx, L.cy, R * .06, 0, TAU); c.fill(); c.restore();
  // dashed danger rim (pulses once the platform starts to shrink)
  const warn = st.p === 2 && st.t > 11 ? .55 + Math.sin(tm / 130) * .35 : .35; c.strokeStyle = `rgba(255,70,60,${warn})`; c.lineWidth = 12 * L.s; c.setLineDash([22 * L.s, 14 * L.s]); c.lineDashOffset = -tm * .02; c.beginPath(); c.arc(L.cx, L.cy, R - 9 * L.s, 0, TAU); c.stroke(); c.setLineDash([]);
  c.beginPath(); c.arc(L.cx, L.cy, R, 0, TAU); c.lineWidth = 3 * L.s * 2; c.strokeStyle = OL; c.stroke();
}
function drawPick(L, p, tm) {
  const x = L.cx + p.x * L.s, y = L.cy + p.y * L.s + Math.sin(tm / 260 + p.id) * 4 * L.s, r = 19 * L.s, k = p.k; const pop = Math.min(1, p.age * 5);
  cx.fillStyle = 'rgba(30,10,60,.3)'; cx.beginPath(); cx.ellipse(x, y + r * 1.15, r * .9, r * .35, 0, 0, TAU); cx.fill();
  cx.save(); cx.translate(x, y); cx.scale(pop, pop); cx.beginPath(); cx.arc(0, 0, r, 0, TAU); cx.fillStyle = PICK_COL[k]; cx.fill(); cx.lineWidth = 3 * L.s; cx.strokeStyle = OL; cx.stroke(); cx.strokeStyle = 'rgba(255,255,255,.8)'; cx.lineWidth = 2 * L.s; cx.beginPath(); cx.arc(0, 0, r * 1.25 + Math.sin(tm / 200) * 2, 0, TAU); cx.stroke();
  cx.font = `${Math.round(r * 1.15)}px sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#fff'; cx.fillText(PICK_ICON[k], 0, r * .06); cx.restore();
}
function drawOrbWorld(L, o, tm, me) {
  const sc = (1 - clamp(o.fall, 0, 1) * .75) * (o.heavy > 0 ? 1.18 : 1), r = ORB_R * L.s * sc, x = L.cx + o.x * L.s, y = L.cy + o.y * L.s + o.fall * 26 * L.s;
  if (!o.alive && o.fall >= 1) return;
  const sp = Math.hypot(o.vx, o.vy), vl = sp > 5 ? [o.vx / sp, o.vy / sp] : [0, .25];
  cx.globalAlpha = 1 - clamp(o.fall, 0, 1) * .85;
  if (o.fall < .05) { cx.fillStyle = 'rgba(30,10,60,.32)'; cx.beginPath(); cx.ellipse(x, y + r * .95, r * .95, r * .4, 0, 0, TAU); cx.fill(); }
  if (o.dash > 0) { for (let k = 1; k <= 3; k++) { cx.globalAlpha = (.4 - k * .1) * (1 - o.fall); drawOrb(cx, x - vl[0] * k * r * .5, y - vl[1] * k * r * .5, r * (1 - k * .06), o.skin, { look: vl }); } cx.globalAlpha = 1 - clamp(o.fall, 0, 1) * .85; }
  if (o.boost > 0) { cx.fillStyle = 'rgba(255,210,58,.5)'; cx.beginPath(); cx.arc(x - vl[0] * r * .3, y - vl[1] * r * .3, r * 1.25, 0, TAU); cx.fill(); }
  const stretch = o.dash > 0 ? 1.18 : 1, ang = Math.atan2(vl[1], vl[0]);
  cx.save(); cx.translate(x, y); cx.rotate(ang); cx.scale(stretch, 1 / Math.sqrt(stretch)); cx.rotate(-ang);
  drawOrb(cx, 0, 0, r, o.skin, { look: vl, scared: Math.hypot(o.x, o.y) > (o.R || R0) - 55, angry: o.dash > 0, spin: o.x * .004 }); cx.restore();
  if (o.heavy > 0) { cx.strokeStyle = '#6a6a7a'; cx.lineWidth = 4 * L.s; cx.setLineDash([8 * L.s, 5 * L.s]); cx.beginPath(); cx.arc(x, y, r * 1.1, 0, TAU); cx.stroke(); cx.setLineDash([]); }
  if (o.shield > 0) { cx.fillStyle = 'rgba(90,200,255,.22)'; cx.strokeStyle = 'rgba(160,230,255,.95)'; cx.lineWidth = 3 * L.s; cx.beginPath(); cx.arc(x, y, r * 1.28, 0, TAU); cx.fill(); cx.stroke(); }
  cx.globalAlpha = 1;
  if (o.fall < .3) { cx.font = `900 ${Math.round(13 * L.s * 1.3)}px "Trebuchet MS",sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic'; cx.lineWidth = 4; cx.strokeStyle = OL; cx.lineJoin = 'round'; cx.strokeText(o.name, x, y - r * 1.5); cx.fillStyle = me ? '#ffd23a' : '#fff'; cx.fillText(o.name, x, y - r * 1.5); if (me) { cx.fillStyle = '#ffd23a'; cx.strokeStyle = OL; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(x, y - r * 2.35 + 8); cx.lineTo(x - 8, y - r * 2.35 - 4); cx.lineTo(x + 8, y - r * 2.35 - 4); cx.closePath(); cx.fill(); cx.stroke(); } }
}
/* st = { p, cd, t, R, rd, winner, orbs:[display orbs], picks:[...], meId } */
function drawGame(st, tm, dt) {
  const w = cv.width, h = cv.height; cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, w, h); drawSky(tm, w, h);
  const L = layout(); shake = Math.max(0, shake - dt * 30); const sh = shake * L.s * .3; cx.setTransform(1, 0, 0, 1, (Math.random() - .5) * sh, (Math.random() - .5) * sh);
  drawArena(L, st, tm); for (const p of st.picks) drawPick(L, p, tm);
  const list = st.orbs.slice().sort((a, b) => a.y - b.y); for (const o of list) { o.R = st.R; drawOrbWorld(L, o, tm, o.id === st.meId); }
  for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.life -= dt; if (q.life <= 0) { parts.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 1 - 2 * dt; q.vy *= 1 - 2 * dt; const a = Math.min(1, q.life / q.max * 1.5), X = L.cx + q.x * L.s, Y = L.cy + q.y * L.s; cx.globalAlpha = a; cx.fillStyle = q.c; if (q.star) { cx.save(); cx.translate(X, Y); cx.rotate(q.life * 8); cx.beginPath(); for (let k = 0; k < 8; k++) { const rr = k & 1 ? q.s * .5 : q.s * 1.3 * L.s; cx.lineTo(Math.cos(k * Math.PI / 4) * rr, Math.sin(k * Math.PI / 4) * rr); } cx.closePath(); cx.fill(); cx.restore(); } else { cx.beginPath(); cx.arc(X, Y, q.s * L.s * .8, 0, TAU); cx.fill(); } } cx.globalAlpha = 1;
  cx.textAlign = 'center'; cx.lineJoin = 'round'; for (let i = texts.length - 1; i >= 0; i--) { const q = texts[i]; q.life -= dt; if (q.life <= 0) { texts.splice(i, 1); continue; } q.y -= 40 * dt; cx.globalAlpha = Math.min(1, q.life * 2); cx.font = `900 ${Math.round(22 * L.s * 1.4)}px "Trebuchet MS",sans-serif`; cx.lineWidth = 5; cx.strokeStyle = OL; cx.strokeText(q.txt, L.cx + q.x * L.s, L.cy + q.y * L.s); cx.fillStyle = q.col; cx.fillText(q.txt, L.cx + q.x * L.s, L.cy + q.y * L.s); } cx.globalAlpha = 1;
  cx.setTransform(1, 0, 0, 1, 0, 0);
  const vg = cx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .45, w / 2, h / 2, Math.hypot(w, h) * .6); vg.addColorStop(0, 'rgba(20,10,60,0)'); vg.addColorStop(1, 'rgba(20,10,60,.4)'); cx.fillStyle = vg; cx.fillRect(0, 0, w, h);
}
function drawHudBig(txt, sub, col, scale) { const w = cv.width, h = cv.height, u = Math.min(w, h) / 600; cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.textAlign = 'center'; cx.lineJoin = 'round'; cx.font = `900 ${Math.round(110 * u * (scale || 1))}px Impact,"Arial Black",sans-serif`; cx.lineWidth = 12 * u; cx.strokeStyle = OL; cx.strokeText(txt, w / 2, h * .46); cx.fillStyle = col || '#ffd23a'; cx.fillText(txt, w / 2, h * .46); if (sub) { cx.font = `900 ${Math.round(30 * u)}px "Trebuchet MS",sans-serif`; cx.lineWidth = 6 * u; cx.strokeText(sub, w / 2, h * .46 + 48 * u); cx.fillStyle = '#fff'; cx.fillText(sub, w / 2, h * .46 + 48 * u); } cx.restore(); }
function drawScores(st) {
  const w = cv.width, u = Math.min(cv.width, cv.height) / 600; cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.textAlign = 'center'; cx.lineJoin = 'round';
  const n = st.orbs.length, narrow = cv.width / DPR < 700, cw = Math.min(78 * u, ((narrow ? cv.width - 112 * DPR : cv.width) - 24) / n), mid = narrow ? (cv.width - 112 * DPR) / 2 : w / 2, x0 = mid - (n * cw) / 2; cx.font = `900 ${Math.round(16 * u)}px "Trebuchet MS",sans-serif`; cx.lineWidth = 4 * u; cx.strokeStyle = OL; cx.strokeText(t('round') + ' ' + st.rd, mid, 20 * u); cx.fillStyle = '#fff'; cx.fillText(t('round') + ' ' + st.rd, mid, 20 * u);
  st.orbs.forEach((o, i) => { const X = x0 + i * cw + cw / 2, Y = 52 * u, rr = Math.min(17 * u, cw * .32); cx.globalAlpha = o.alive ? 1 : .45; drawOrb(cx, X, Y, rr, o.skin, { look: [0, .2] }); cx.globalAlpha = 1; for (let k = 0; k < WIN_ROUNDS; k++) { cx.fillStyle = k < o.score ? '#ffd23a' : 'rgba(255,255,255,.28)'; cx.strokeStyle = OL; cx.lineWidth = 2 * u; cx.beginPath(); cx.arc(X - (WIN_ROUNDS - 1) * 7 * u + k * 14 * u, Y + rr + 12 * u, 5 * u, 0, TAU); cx.fill(); cx.stroke(); } if (o.id === st.meId) { cx.strokeStyle = '#ffd23a'; cx.lineWidth = 3 * u; cx.beginPath(); cx.arc(X, Y, rr + 5 * u, 0, TAU); cx.stroke(); } });
  cx.restore();
}
function drawDashHud(me, touch) {
  if (!me) return; const w = cv.width, h = cv.height, u = Math.min(w, h) / 600; cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0);
  const rdy = me.dashCd <= 0, k = 1 - clamp(me.dashCd / DASH_CD, 0, 1);
  if (touch) { const X = w - 90 * u, Y = h - 100 * u, R = 52 * u; cx.fillStyle = rdy ? 'rgba(255,138,26,.9)' : 'rgba(40,30,90,.7)'; cx.beginPath(); cx.arc(X, Y, R, 0, TAU); cx.fill(); cx.strokeStyle = OL; cx.lineWidth = 4 * u; cx.stroke(); cx.strokeStyle = '#fff'; cx.lineWidth = 6 * u; cx.beginPath(); cx.arc(X, Y, R - 8 * u, -Math.PI / 2, -Math.PI / 2 + k * TAU); cx.stroke(); cx.font = `900 ${Math.round(18 * u)}px "Trebuchet MS",sans-serif`; cx.textAlign = 'center'; cx.fillStyle = '#fff'; cx.fillText(t('dash'), X, Y + 6 * u); }
  else { const bw = 220 * u, X = w / 2 - bw / 2, Y = h - 44 * u; cx.fillStyle = 'rgba(28,20,36,.75)'; cx.fillRect(X - 3 * u, Y - 3 * u, bw + 6 * u, 20 * u); cx.fillStyle = rdy ? '#ffd23a' : '#ff8a1a'; cx.fillRect(X, Y, bw * k, 14 * u); cx.font = `900 ${Math.round(13 * u)}px "Trebuchet MS",sans-serif`; cx.textAlign = 'center'; cx.lineWidth = 4 * u; cx.strokeStyle = OL; cx.strokeText('SPACE — ' + t('dash'), w / 2, Y - 8 * u); cx.fillStyle = '#fff'; cx.fillText('SPACE — ' + t('dash'), w / 2, Y - 8 * u); }
  cx.restore();
}
