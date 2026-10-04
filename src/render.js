
/* ============================== rendering (crisp, no bloom) ============================== */
let groundPat = null;
function ensureSprites() { const want = clamp(Math.round(Z * DPR * 4) / 4, .75, 2.5); if (!SP.slime || want !== SS) { SS = want; buildSprites(); groundPat = null; } }
function spr(img, x, y, sc, rot, flip, alpha) { const w = img.lw * sc, h = img.lh * sc; if (alpha != null) cx.globalAlpha = alpha; if (rot || (flip && flip !== 1)) { cx.save(); cx.translate(x, y); if (rot) cx.rotate(rot); if (flip) cx.scale(flip, 1); cx.drawImage(img, -w / 2, -h / 2, w, h); cx.restore(); } else cx.drawImage(img, x - w / 2, y - h / 2, w, h); if (alpha != null) cx.globalAlpha = 1; }
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const PROPS = ['tree', 'tree', 'pine', 'pine', 'bush', 'bush', 'rockA', 'rockB', 'stump', 'pillar', 'tomb'];
function worldProps(x0, x1, y0, y1) {
  const C = 190, out = [];
  for (let i = Math.floor(x0 / C); i <= Math.floor(x1 / C); i++) for (let j = Math.floor(y0 / C); j <= Math.floor(y1 / C); j++) {
    const h = hash(i, j); if (h < .42) continue; const px = i * C + hash(j + 5, i) * C, py = j * C + hash(i + 11, j + 2) * C; if (px * px + py * py < 130 * 130) continue;
    const k = PROPS[Math.floor(hash(i + 3, j + 8) * PROPS.length)]; out.push({ isProp: true, k, x: px, y: py, h });
  } return out;
}
function drawGround(tm, camx, camy) {
  const vx0 = camx - VW / Z / 2 - 60, vx1 = camx + VW / Z / 2 + 60, vy0 = camy - VH / Z / 2 - 60, vy1 = camy + VH / Z / 2 + 60;
  if (!groundPat) { groundPat = cx.createPattern(SP.ground, 'repeat'); try { groundPat.setTransform(new DOMMatrix([1 / SS, 0, 0, 1 / SS, 0, 0])); } catch (e) {} }
  cx.fillStyle = groundPat; cx.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
  const C = 64, D = SP.deco, keys = ['tuft', 'tuft', 'flowerA', 'flowerB', 'flowerC', 'mush', 'tuft'];
  for (let i = Math.floor(vx0 / C); i <= Math.floor(vx1 / C); i++) for (let j = Math.floor(vy0 / C); j <= Math.floor(vy1 / C); j++) { const h = hash(i * 3 + 1, j * 7 + 2); if (h < .66) continue; const im = D[keys[Math.floor(hash(j, i) * keys.length)]]; const sw = Math.sin(tm / 700 + i + j) * .04; cx.save(); cx.translate(i * C + hash(j, i + 9) * C, j * C + hash(i + 4, j + 4) * C); cx.rotate(sw); cx.drawImage(im, -im.lw / 2, -im.lh, im.lw, im.lh); cx.restore(); }
}
function drawProp(o) {
  const im = SP.prop[o.k], big = o.k === 'tree' || o.k === 'pine' || o.k === 'pillar'; const sc = .9 + o.h * .25;
  cx.drawImage(SP.shadow, o.x - im.lw * sc * .5, o.y - im.lw * sc * .13, im.lw * sc, im.lw * sc * .42);
  const dx = P ? Math.abs(P.x - o.x) : 1e9, behind = !!P && P.y < o.y && P.y > o.y - im.lh * sc && dx < im.lw * sc * .5;
  if (big && behind) cx.globalAlpha = .55; cx.drawImage(im, o.x - im.lw * sc / 2, o.y - im.lh * sc + 6, im.lw * sc, im.lh * sc); cx.globalAlpha = 1;
}
function drawEntity(e, tm) {
  const T = ETYPE[e.t], key = T.spr, img = key === 'bat' ? SP.batBody : SP[key], sc = T.sc || 1, w = img.lw * sc, h = img.lh * sc; const fy = e.y + e.r * .85;
  cx.drawImage(SP.shadow, e.x - e.r * 1.4 * sc, fy - e.r * .55, e.r * 2.8 * sc, e.r * 1.2);
  if (e.elite || e.boss) { cx.strokeStyle = e.boss ? (e.t === 'boss1' ? '#ff9a2a' : '#6ff1ff') : '#ffd23a'; cx.lineWidth = 3; cx.globalAlpha = .75 + Math.sin(tm / 160) * .2; cx.beginPath(); cx.ellipse(e.x, fy - 2, e.r * 1.4, e.r * .55, 0, 0, TAU); cx.stroke(); cx.globalAlpha = 1; }
  const air = key === 'bat' ? -e.r * .9 + Math.sin(tm / 230 + e.id) * 4 : key === 'watcher' ? -e.r * .8 + Math.sin(tm / 300 + e.id) * 5 : 0; const flip = (e.vx || 0) < -.05 ? -1 : 1;
  const ph = tm / (e.t === 'slime' ? 150 : 110) + e.id, sq = e.t === 'slime' ? Math.sin(ph) * .1 : key === 'watcher' ? 0 : Math.abs(Math.sin(ph)) * .04, rot = (e.boss || key === 'watcher' || key === 'bat') ? 0 : Math.sin(ph) * .07;
  cx.save(); cx.translate(e.x, fy + air); cx.rotate(rot); cx.scale(flip * (1 - sq), 1 + sq);
  if (key === 'bat') { const f = Math.sin(tm / 55 + e.id) * .65, W2 = e.flash > 0 ? SP.batWingW : SP.batWing; for (const s of [-1, 1]) { cx.save(); cx.translate(s * 8, -20); cx.rotate(s * f); cx.scale(s, 1); cx.drawImage(W2, -2, -12, W2.lw, W2.lh); cx.restore(); } }
  const ib = key === 'bat' ? SP.batBody : img; const bw = ib.lw * sc, bh = ib.lh * sc; cx.drawImage(ib, -bw / 2, -bh, bw, bh); if (e.flash > 0) { cx.globalAlpha = .85; cx.drawImage(SP[(key === 'bat' ? 'batBody' : key) + 'W'], -bw / 2, -bh, bw, bh); cx.globalAlpha = 1; }
  cx.restore();
  if (e.slow > 0) { cx.fillStyle = 'rgba(140,220,255,.45)'; cx.beginPath(); cx.ellipse(e.x, fy - 2, e.r * 1.1, e.r * .45, 0, 0, TAU); cx.fill(); }
  if (e.elite && !e.boss) { const bw2 = 56; cx.fillStyle = '#000b'; cx.fillRect(e.x - bw2 / 2 - 1, e.y - e.r - 20, bw2 + 2, 7); cx.fillStyle = '#ffc83d'; cx.fillRect(e.x - bw2 / 2, e.y - e.r - 19, bw2 * Math.max(0, e.hp / e.mhp), 5); }
}
function drawPlayer(tm) {
  const mv = Math.hypot(P.vx, P.vy) > 20, fy = P.y + 30, bob = mv ? Math.abs(Math.sin(P.walk)) * 5 : Math.sin(tm / 420) * 1.6, lean = clamp(P.vx / 170, -1, 1) * .12;
  cx.drawImage(SP.shadow, P.x - 30, fy - 12, 60, 28);
  if (P.inv > 0 && Math.floor(tm / 70) % 2) cx.globalAlpha = .45;
  cx.save(); cx.translate(P.x, fy); cx.rotate(lean + (mv ? Math.sin(P.walk * 2) * .04 : 0)); cx.scale(P.face * (1 + (mv ? Math.sin(P.walk * 2) * .03 : 0)), 1 - (mv ? Math.sin(P.walk * 2) * .03 : 0));
  const im = SP['hero' + P.hero]; cx.drawImage(im, -im.lw / 2, -im.lh - bob, im.lw, im.lh); if (P.hurt > 0) { cx.globalAlpha = .8; cx.drawImage(SP['hero' + P.hero + 'W'], -im.lw / 2, -im.lh - bob, im.lw, im.lh); } cx.restore(); cx.globalAlpha = 1;
  const w = 52; rr(P.x - w / 2 - 2, fy + 5, w + 4, 10, 5); cx.fillStyle = '#1c1424'; cx.fill(); rr(P.x - w / 2, fy + 7, Math.max(2, w * P.hp / P.max), 6, 3); cx.fillStyle = P.hp / P.max > .35 ? '#58e07a' : '#ff5a6a'; cx.fill();
}
function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
function drawFx(tm) {
  if (P.auraR) { const r = P.auraR; cx.fillStyle = 'rgba(120,210,255,.16)'; cx.beginPath(); cx.arc(P.x, P.y + 12, r, 0, TAU); cx.fill(); cx.strokeStyle = 'rgba(255,255,255,.85)'; cx.lineWidth = 3; cx.setLineDash([16, 12]); cx.lineDashOffset = -tm / 30; cx.beginPath(); cx.arc(P.x, P.y + 12, r - 1, 0, TAU); cx.stroke(); cx.setLineDash([]); cx.strokeStyle = 'rgba(80,170,255,.9)'; cx.lineWidth = 2; cx.beginPath(); cx.arc(P.x, P.y + 12, r + 2, 0, TAU); cx.stroke(); }
  if (P.orbs) for (const o of P.orbs) { cx.fillStyle = 'rgba(20,10,60,.28)'; cx.beginPath(); cx.ellipse(o.x, o.y + 26, 10, 4, 0, 0, TAU); cx.fill(); for (let k = 1; k < 5; k++) { cx.globalAlpha = .35 - k * .06; cx.fillStyle = '#9a6aff'; cx.beginPath(); cx.arc(P.x + Math.cos(o.a - k * .14) * Math.hypot(o.x - P.x, (o.y - P.y) / .92), P.y + Math.sin(o.a - k * .14) * Math.hypot(o.x - P.x, (o.y - P.y) / .92) * .92, 11 - k * 1.5, 0, TAU); cx.fill(); } cx.globalAlpha = 1; cx.lineWidth = 3; cx.strokeStyle = OL; cx.fillStyle = '#b48aff'; cx.beginPath(); cx.arc(o.x, o.y, 12, 0, TAU); cx.fill(); cx.stroke(); cx.fillStyle = '#e6d4ff'; cx.beginPath(); cx.arc(o.x - 3, o.y - 3, 5, 0, TAU); cx.fill(); cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(o.x - 4, o.y - 4.5, 2, 0, TAU); cx.fill(); }
  for (const s of shots) { if (s.k === 'bolt') { const a = Math.atan2(s.vy, s.vx); for (let k = 4; k >= 1; k--) { cx.globalAlpha = .5 - k * .09; cx.fillStyle = '#4aa8ff'; cx.beginPath(); cx.arc(s.x - Math.cos(a) * k * 8, s.y - Math.sin(a) * k * 8, 8 - k * 1.2, 0, TAU); cx.fill(); } cx.globalAlpha = 1; cx.lineWidth = 3; cx.strokeStyle = OL; cx.fillStyle = '#7ee0ff'; cx.beginPath(); cx.arc(s.x, s.y, 9, 0, TAU); cx.fill(); cx.stroke(); cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(s.x - 2, s.y - 2, 4, 0, TAU); cx.fill(); } }
  for (const s of eshots) { cx.lineWidth = 2.6; cx.strokeStyle = OL; cx.fillStyle = '#ff5a3a'; cx.beginPath(); cx.arc(s.x, s.y, s.r + 2, 0, TAU); cx.fill(); cx.stroke(); cx.fillStyle = '#ffd08a'; cx.beginPath(); cx.arc(s.x - 1.5, s.y - 1.5, s.r * .45, 0, TAU); cx.fill(); }
  for (const f of fxs) {
    if (f.k === 'zap') { const a = f.life / f.max; let seed = f.seed * 1000; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647; const x1 = f.x + (r() - .5) * 80, y1 = f.y - 520; const pts = [[x1, y1]]; for (let i = 1; i < 9; i++) pts.push([x1 + (f.x - x1) * i / 9 + (r() - .5) * 46, y1 + (f.y - y1) * i / 9]); pts.push([f.x, f.y]);
      for (const [lw, col] of [[10, `rgba(40,110,255,${a})`], [5, `rgba(150,220,255,${a})`], [2.2, `rgba(255,255,255,${a})`]]) { cx.strokeStyle = col; cx.lineWidth = lw; cx.lineJoin = 'round'; cx.beginPath(); pts.forEach((p, i) => (i ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1]))); cx.stroke(); }
      cx.fillStyle = `rgba(255,255,255,${a * .7})`; cx.beginPath(); cx.ellipse(f.x, f.y + 14, 34 * a + 8, 12 * a + 3, 0, 0, TAU); cx.fill(); }
    else if (f.k === 'nova') { const a = Math.max(0, f.life), col = f.enemy ? '255,70,110' : '255,150,40'; cx.fillStyle = `rgba(${col},${a * .18})`; cx.beginPath(); cx.arc(f.x, f.y + 12, f.r, 0, TAU); cx.fill(); cx.strokeStyle = OL; cx.lineWidth = 12 * a + 4; cx.beginPath(); cx.arc(f.x, f.y + 12, f.r, 0, TAU); cx.stroke(); cx.strokeStyle = `rgba(${col},${Math.min(1, a * 1.4)})`; cx.lineWidth = 8 * a + 2; cx.stroke(); cx.strokeStyle = `rgba(255,240,170,${a})`; cx.lineWidth = 3 * a + 1; cx.stroke(); }
  }
  for (const p of parts) { const a = Math.min(1, p.life / p.max * 1.6); cx.globalAlpha = a; cx.fillStyle = p.c; cx.beginPath(); cx.rect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); cx.fill(); } cx.globalAlpha = 1;
  for (const s of shots) if (s.k === 'axe') { cx.fillStyle = 'rgba(255,255,255,.18)'; cx.beginPath(); cx.arc(s.x, s.y, 26 * (s.r / 20), s.rot - 2.4, s.rot - .4); cx.lineTo(s.x, s.y); cx.fill(); spr(SP.axe, s.x, s.y, 1.25 * (s.r / 20), s.rot, 1); }
}
function drawPickups(tm) {
  for (const g of gems) {
    const bob = Math.sin(g.ph * 4) * 3; cx.drawImage(SP.shadow, g.x - 11, g.y + 8, 22, 9);
    if (g.kind === 'xp') spr(SP.gem[g.k], g.x, g.y + bob - 4, .8 + g.k * .22, 0);
    else if (g.kind === 'coin') spr(SP.coin, g.x, g.y + bob - 4, 1, 0, Math.cos(g.ph * 5));
    else if (g.kind === 'chest') { cx.strokeStyle = 'rgba(255,215,80,' + (.55 + Math.sin(g.ph * 5) * .25) + ')'; cx.lineWidth = 3; cx.beginPath(); cx.ellipse(g.x, g.y + 12, 34, 13, 0, 0, TAU); cx.stroke(); spr(SP.chest, g.x, g.y + bob * .4 - 6, 1.3, 0); }
    else spr(SP[g.kind], g.x, g.y + bob - 4, 1.15, 0);
  }
}
function tintColor(t01) { // day -> warm sunset -> blue dusk
  const k = clamp(t01, 0, 1), A = [255, 255, 255], B = [255, 214, 170], C = [150, 160, 220]; const f = k < .55 ? [A, B, k / .55] : [B, C, (k - .55) / .45]; const m = (i) => Math.round(f[0][i] + (f[1][i] - f[0][i]) * f[2]); return `rgb(${m(0)},${m(1)},${m(2)})`;
}
let menuEnts = null;
function drawAll(tm, menu) {
  const w = cv.width, h = cv.height, s = DPR * Z; cx.setTransform(1, 0, 0, 1, 0, 0); cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
  const shx = cam.sh ? rnd(-cam.sh, cam.sh) * .4 : 0, shy = cam.sh ? rnd(-cam.sh, cam.sh) * .4 : 0; const camx = menu ? 0 : cam.x, camy = menu ? 0 : cam.y;
  cx.setTransform(s, 0, 0, s, w / 2 - camx * s + shx * DPR, h / 2 - camy * s + shy * DPR);
  drawGround(tm, camx, camy);
  const vx0 = camx - VW / Z / 2 - 140, vx1 = camx + VW / Z / 2 + 140, vy0 = camy - VH / Z / 2 - 160, vy1 = camy + VH / Z / 2 + 200;
  const list = worldProps(vx0, vx1, vy0, vy1);
  if (!menu && P) { drawPickups(tm); for (const e of enemies) if (e.x > vx0 && e.x < vx1 && e.y > vy0 && e.y < vy1) list.push(e); list.push(P); }
  else { if (!menuEnts) { menuEnts = []; for (let i = 0; i < 18; i++) menuEnts.push({ id: i + 1, t: i < 9 ? 'slime' : i < 15 ? 'bat' : i < 17 ? 'brute' : 'watcher', ang: rnd(0, TAU), rad: rnd(180, 520), sp: rnd(.08, .22) * (Math.random() < .5 ? -1 : 1), r: 16, flash: 0, slow: 0, x: 0, y: 0, vx: 0 }); } for (const m of menuEnts) { m.ang += m.sp * .016; const nx = Math.cos(m.ang) * m.rad * 1.3, ny = Math.sin(m.ang) * m.rad * .8; m.vx = nx - m.x; m.x = nx; m.y = ny; m.r = ETYPE[m.t].r; list.push(m); } }
  list.sort((a, b) => a.y - b.y);
  for (const o of list) { if (o.isProp) drawProp(o); else if (o === P) drawPlayer(tm); else drawEntity(o, tm); }
  if (!menu && P) { drawFx(tm); cx.textAlign = 'center'; cx.lineJoin = 'round'; for (const q of texts) { cx.globalAlpha = Math.min(1, q.life * 2.5); cx.font = `900 ${Math.round(18 * q.s)}px "Trebuchet MS",sans-serif`; cx.lineWidth = 5; cx.strokeStyle = OL; cx.strokeText(q.txt, q.x, q.y); cx.fillStyle = q.col; cx.fillText(q.txt, q.x, q.y); } cx.globalAlpha = 1; }
  cx.setTransform(1, 0, 0, 1, 0, 0);
  if (!menu && G) { cx.globalCompositeOperation = 'multiply'; cx.fillStyle = tintColor(G.t / 470); cx.fillRect(0, 0, w, h); cx.globalCompositeOperation = 'source-over'; }
  const g = cx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .42, w / 2, h / 2, Math.hypot(w, h) * .62); g.addColorStop(0, 'rgba(20,10,40,0)'); g.addColorStop(1, 'rgba(20,10,40,.42)'); cx.fillStyle = g; cx.fillRect(0, 0, w, h);
  if (P && !menu && P.hurt > 0) { const hg = cx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.hypot(w, h) * .6); hg.addColorStop(0, 'rgba(255,30,60,0)'); hg.addColorStop(1, `rgba(255,30,60,${P.hurt * 1.5})`); cx.fillStyle = hg; cx.fillRect(0, 0, w, h); }
}
function drawHud(tm) {
  const w = cv.width, u = UI * DPR, pad = 10 * u; cx.setTransform(1, 0, 0, 1, 0, 0); cx.textAlign = 'left'; cx.lineJoin = 'round';
  const txt = (s, x, y, size, col, al) => { cx.font = `900 ${Math.round(size * u)}px "Trebuchet MS",sans-serif`; cx.textAlign = al || 'left'; cx.lineWidth = 5 * u; cx.strokeStyle = OL; cx.strokeText(s, x, y); cx.fillStyle = col || '#fff'; cx.fillText(s, x, y); };
  // XP bar
  const bx = pad + 34 * u, bw = w - bx - pad, by = pad, bh = 16 * u; rr(bx - 2 * u, by - 2 * u, bw + 4 * u, bh + 4 * u, 9 * u); cx.fillStyle = OL; cx.fill(); rr(bx, by, bw, bh, 7 * u); cx.fillStyle = '#3a3258'; cx.fill();
  const fw = Math.max(bh, bw * P.xp / P.need); rr(bx, by, fw, bh, 7 * u); cx.fillStyle = lgH(bx, by, bh, '#7ae8ff', '#2a8cff'); cx.fill(); rr(bx + 3 * u, by + 2 * u, Math.max(0, fw - 6 * u), bh * .32, 3 * u); cx.fillStyle = 'rgba(255,255,255,.45)'; cx.fill();
  cx.beginPath(); cx.arc(pad + 15 * u, by + bh / 2, 17 * u, 0, TAU); cx.fillStyle = OL; cx.fill(); cx.beginPath(); cx.arc(pad + 15 * u, by + bh / 2, 14 * u, 0, TAU); cx.fillStyle = HEROES[P.hero].col; cx.fill(); txt(String(P.lvl), pad + 15 * u, by + bh / 2 + 7 * u, 19, '#fff', 'center');
  // timer pill
  const tw = 96 * u, tx = w / 2 - tw / 2, ty = by + bh + 10 * u; rr(tx, ty, tw, 36 * u, 18 * u); cx.fillStyle = 'rgba(28,20,36,.82)'; cx.fill(); cx.strokeStyle = G.t > 400 ? '#ff6a6a' : 'rgba(255,255,255,.35)'; cx.lineWidth = 2 * u; cx.stroke(); txt(fmtT(G.t), w / 2, ty + 27 * u, 24, G.t > 400 ? '#ff9a9a' : '#fff', 'center');
  // HP + stats panel
  const px0 = pad, py0 = ty - 2 * u, hpw = 170 * u; rr(px0, py0, hpw + 46 * u, 56 * u, 14 * u); cx.fillStyle = 'rgba(28,20,36,.78)'; cx.fill();
  cx.font = `${Math.round(22 * u)}px sans-serif`; cx.textAlign = 'left'; cx.fillStyle = '#fff'; cx.fillText('❤️', px0 + 8 * u, py0 + 25 * u);
  rr(px0 + 38 * u, py0 + 8 * u, hpw, 18 * u, 9 * u); cx.fillStyle = '#3a3258'; cx.fill(); const hf = Math.max(6 * u, hpw * P.hp / P.max); rr(px0 + 38 * u, py0 + 8 * u, hf, 18 * u, 9 * u); cx.fillStyle = P.hp / P.max > .35 ? lgH(px0, py0 + 8 * u, 18 * u, '#7aef8a', '#26b050') : lgH(px0, py0 + 8 * u, 18 * u, '#ff8a8a', '#d02a3a'); cx.fill(); rr(px0 + 42 * u, py0 + 10 * u, Math.max(0, hf - 8 * u), 5 * u, 2 * u); cx.fillStyle = 'rgba(255,255,255,.4)'; cx.fill();
  txt(Math.ceil(P.hp) + '/' + P.max, px0 + 38 * u + hpw / 2, py0 + 22 * u, 12, '#fff', 'center');
  txt('☠ ' + P.kills, px0 + 12 * u, py0 + 48 * u, 15, '#ffd1d9'); txt('🪙 ' + P.gold, px0 + 100 * u, py0 + 48 * u, 15, '#ffd84a');
  // weapon / passive slots
  const icons = []; for (const k in P.w) icons.push([WEAPONS[k].ico, P.w[k].lvl, 1]); for (const k in P.p) icons.push([PASSIVES[k].ico, P.p[k], 0]);
  icons.forEach((ic, i) => { const col = i % 7, row = Math.floor(i / 7), x = pad + col * 40 * u, y = py0 + 66 * u + row * 46 * u; rr(x, y, 36 * u, 42 * u, 9 * u); cx.fillStyle = ic[2] ? 'rgba(70,50,140,.88)' : 'rgba(40,32,64,.86)'; cx.fill(); cx.strokeStyle = ic[2] ? '#a88aff' : 'rgba(255,255,255,.2)'; cx.lineWidth = 2 * u; cx.stroke(); cx.textAlign = 'center'; cx.font = `${Math.round(21 * u)}px sans-serif`; cx.fillStyle = '#fff'; cx.fillText(ic[0], x + 18 * u, y + 25 * u); for (let k = 0; k < (ic[2] ? 6 : 5); k++) { cx.fillStyle = k < ic[1] ? '#ffd23a' : 'rgba(255,255,255,.18)'; cx.fillRect(x + 4 * u + k * (ic[2] ? 5 : 6) * u, y + 33 * u, (ic[2] ? 4 : 5) * u, 4 * u); } });
  if (G.boss && !G.boss.dead) { const bw = Math.min(w * .5, 520 * u), x0 = (w - bw) / 2, y0 = ty + 52 * u; rr(x0 - 3 * u, y0 - 3 * u, bw + 6 * u, 20 * u, 10 * u); cx.fillStyle = OL; cx.fill(); rr(x0, y0, Math.max(8 * u, bw * Math.max(0, G.boss.hp / G.boss.mhp)), 14 * u, 7 * u); cx.fillStyle = G.boss.t === 'boss1' ? lgH(x0, y0, 14 * u, '#ffb04a', '#e0501a') : lgH(x0, y0, 14 * u, '#8ff0ff', '#2a8cff'); cx.fill(); txt('☠ ' + (G.boss.name || t('boss')), w / 2, y0 - 8 * u, 15, '#fff', 'center'); }
  if (SV.runs === 0 && G.t < 9) txt(t('move'), w / 2, cv.height - 40 * u, 17, '#fff', 'center');
  if (joy.on) { const k = DPR; cx.globalAlpha = .55; cx.strokeStyle = '#fff'; cx.lineWidth = 3 * k; cx.beginPath(); cx.arc(joy.ox * k, joy.oy * k, 56 * k, 0, TAU); cx.stroke(); cx.fillStyle = '#fff'; const dx = joy.x - joy.ox, dy = joy.y - joy.oy, l = Math.min(56, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); cx.beginPath(); cx.arc((joy.ox + Math.cos(a) * l) * k, (joy.oy + Math.sin(a) * l) * k, 24 * k, 0, TAU); cx.fill(); cx.globalAlpha = 1; }
}
function lgH(x, y, h, c1, c2) { const g = cx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2); return g; }
