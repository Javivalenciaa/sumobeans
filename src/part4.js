
/* ============================== rendering ============================== */
const GL = {}; let groundPat = null; const amb = [];
function buildGlows() { [['cy', '94,231,255'], ['gr', '109,255,160'], ['pk', '255,79,216'], ['go', '255,200,61'], ['or', '255,150,40'], ['rd', '255,60,90'], ['wh', '255,255,255'], ['vi', '150,110,255']].forEach(([k, c]) => { GL[k] = mk(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, `rgba(${c},1)`); g.addColorStop(.25, `rgba(${c},.55)`); g.addColorStop(1, `rgba(${c},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }); }); for (let i = 0; i < 70; i++) amb.push({ x: Math.random(), y: Math.random(), s: rnd(.5, 2.4), v: rnd(.01, .05), p: rnd(0, 6) }); HEROES.forEach((h, i) => { SP['hero' + i + 'W'] = white(SP['hero' + i]); }); }
function spr(img, x, y, sc, rot, flip, alpha) { const w = img.lw * sc, h = img.lh * sc; if (alpha != null) cx.globalAlpha = alpha; if (rot || (flip && flip !== 1)) { cx.save(); cx.translate(x, y); if (rot) cx.rotate(rot); if (flip) cx.scale(flip, 1); cx.drawImage(img, -w / 2, -h / 2, w, h); cx.restore(); } else cx.drawImage(img, x - w / 2, y - h / 2, w, h); if (alpha != null) cx.globalAlpha = 1; }
function glow(k, x, y, r, a) { cx.globalAlpha = a; cx.drawImage(GL[k], x - r, y - r, r * 2, r * 2); cx.globalAlpha = 1; }
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function drawWorldBase(tm, camx, camy) {
  const vx0 = camx - VW / Z / 2 - 80, vx1 = camx + VW / Z / 2 + 80, vy0 = camy - VH / Z / 2 - 80, vy1 = camy + VH / Z / 2 + 80;
  if (!groundPat) groundPat = cx.createPattern(SP.ground, 'repeat'); cx.fillStyle = groundPat; cx.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
  const C = 150; const decs = [];
  for (let i = Math.floor(vx0 / C); i <= Math.floor(vx1 / C); i++) for (let j = Math.floor(vy0 / C); j <= Math.floor(vy1 / C); j++) { const h = hash(i, j); if (h < .55) continue; const px = i * C + hash(j, i) * C, py = j * C + hash(i + 7, j + 3) * C, k = Math.floor(hash(i + 1, j + 9) * SP.dec.length); decs.push([py, px, k, h]); }
  decs.sort((a, b) => a[0] - b[0]);
  for (const [py, px, k, h] of decs) { const im = SP.dec[k]; if (k === 3) { cx.globalAlpha = .55 + Math.sin(tm / 700 + h * 9) * .25; spr(im, px, py, .9 + h * .6, 0); cx.globalAlpha = 1; continue; } cx.drawImage(SP.shadow, px - im.lw * .45, py + im.lh * .2, im.lw * .9, im.lw * .45); spr(im, px, py, .9 + h * .5, 0); if (k === 2 || k === 5) { cx.globalCompositeOperation = 'lighter'; glow(k === 2 ? 'pk' : 'vi', px, py - im.lh * .2, 34, .35 + Math.sin(tm / 500 + h * 7) * .12); cx.globalCompositeOperation = 'source-over'; } }
}
function drawEntity(e, tm) {
  const T = ETYPE[e.t], sc = T.sw / SP[T.spr === 'bat' ? 'batBody' : T.spr].lw; let img = SP[T.spr === 'bat' ? 'batBody' : T.spr];
  const fy = e.y + e.r * .7, bob = Math.sin(tm / 130 + e.id) * .06; cx.drawImage(SP.shadow, e.x - e.r * 1.1, fy - e.r * .35, e.r * 2.2, e.r * 1.1);
  if (e.elite || e.boss) { cx.globalCompositeOperation = 'lighter'; glow(e.boss ? (e.t === 'boss1' ? 'or' : 'cy') : 'go', e.x, e.y, e.r * 2.4, .45 + Math.sin(tm / 200) * .12); cx.globalCompositeOperation = 'source-over'; }
  cx.save(); cx.translate(e.x, fy + (e.t === 'bat' || e.t === 'watcher' ? -e.r * .5 + Math.sin(tm / 260 + e.id) * 4 : 0)); const flip = (e.vx || 0) < -.05 ? -1 : 1; cx.scale(flip * (1 - bob) * sc, (1 + bob) * sc);
  if (e.t === 'bat') { const f = Math.sin(tm / 55 + e.id) * .6; cx.save(); cx.translate(-4, -16); cx.rotate(-f); cx.scale(-1, 1); cx.drawImage(e.flash > 0 ? SP.batWingW : SP.batWing, -2, -10, 30, 22); cx.restore(); cx.save(); cx.translate(4, -16); cx.rotate(f); cx.drawImage(e.flash > 0 ? SP.batWingW : SP.batWing, -2, -10, 30, 22); cx.restore(); }
  cx.drawImage(img, -img.lw / 2, -img.lh, img.lw, img.lh); if (e.flash > 0) { cx.globalAlpha = .85; const w = SP[T.spr + 'W' ] || SP[(T.spr === 'bat' ? 'batBody' : T.spr) + 'W']; cx.drawImage(w, -img.lw / 2, -img.lh, img.lw, img.lh); cx.globalAlpha = 1; }
  cx.restore();
  if (e.slow > 0) { cx.globalCompositeOperation = 'lighter'; glow('cy', e.x, e.y, e.r * 1.3, .35); cx.globalCompositeOperation = 'source-over'; }
  if (e.elite && !e.boss) { const w = 54; cx.fillStyle = '#000a'; cx.fillRect(e.x - w / 2, e.y - e.r - 14, w, 5); cx.fillStyle = '#ffc83d'; cx.fillRect(e.x - w / 2, e.y - e.r - 14, w * Math.max(0, e.hp / e.mhp), 5); }
}
function drawPlayer(tm) {
  const h = HEROES[P.hero], mv = Math.hypot(P.vx, P.vy) > 20, fy = P.y + 22; cx.drawImage(SP.shadow, P.x - 30, fy - 10, 60, 30);
  cx.globalCompositeOperation = 'lighter'; glow(h.glow === '#ffb347' ? 'or' : h.glow === '#8dffc4' ? 'gr' : 'cy', P.x, P.y + 4, 62 + Math.sin(tm / 250) * 4, .32); cx.globalCompositeOperation = 'source-over';
  const bob = mv ? Math.abs(Math.sin(P.walk)) * 5 : Math.sin(tm / 400) * 1.5, lean = clamp(P.vx / 170, -1, 1) * .14;
  if (P.inv > 0 && Math.floor(tm / 60) % 2) cx.globalAlpha = .45;
  cx.save(); cx.translate(P.x, fy); cx.rotate(lean); cx.scale(1.25 * P.face * (1 + (mv ? Math.sin(P.walk * 2) * .03 : 0)), 1.25 * (1 - (mv ? Math.sin(P.walk * 2) * .03 : 0))); const im = SP['hero' + P.hero]; cx.drawImage(im, -im.lw / 2, -im.lh - bob + 4, im.lw, im.lh); if (P.hurt > 0) { cx.globalAlpha = .8; const w = SP['hero' + P.hero + 'W']; cx.drawImage(w, -im.lw / 2, -im.lh - bob + 4, im.lw, im.lh); } cx.restore(); cx.globalAlpha = 1;
  // hp bar
  const w = 50; cx.fillStyle = '#000b'; cx.fillRect(P.x - w / 2 - 1, fy + 8, w + 2, 7); cx.fillStyle = P.hp / P.max > .35 ? '#47e0a0' : '#ff4466'; cx.fillRect(P.x - w / 2, fy + 9, w * P.hp / P.max, 5);
}
function drawFx(tm) {
  cx.globalCompositeOperation = 'lighter';
  if (P.auraR) { const r = P.auraR, g = cx.createRadialGradient(P.x, P.y + 8, r * .2, P.x, P.y + 8, r); g.addColorStop(0, 'rgba(94,231,255,0)'); g.addColorStop(.8, 'rgba(94,231,255,.12)'); g.addColorStop(1, 'rgba(160,240,255,.4)'); cx.fillStyle = g; cx.beginPath(); cx.arc(P.x, P.y + 8, r, 0, TAU); cx.fill(); cx.strokeStyle = 'rgba(190,250,255,.7)'; cx.lineWidth = 2.5; cx.setLineDash([14, 10]); cx.lineDashOffset = -tm / 40; cx.beginPath(); cx.arc(P.x, P.y + 8, r - 2, 0, TAU); cx.stroke(); cx.setLineDash([]); }
  if (P.orbs) for (const o of P.orbs) { glow('vi', o.x, o.y, 34, .8); for (let k = 1; k < 5; k++) glow('cy', P.x + Math.cos(o.a - k * .13) * Math.hypot(o.x - P.x, (o.y - P.y) / .92), P.y + Math.sin(o.a - k * .13) * Math.hypot(o.x - P.x, (o.y - P.y) / .92) * .92, 13 - k * 2, .5 - k * .09); glow('wh', o.x, o.y, 11, 1); }
  for (const s of shots) { if (s.k === 'bolt') { const a = Math.atan2(s.vy, s.vx); for (let k = 3; k >= 1; k--) glow('cy', s.x - Math.cos(a) * k * 9, s.y - Math.sin(a) * k * 9, 12 - k * 2.4, .45); glow('cy', s.x, s.y, 24, .9); glow('wh', s.x, s.y, 10, 1); } else { glow('wh', s.x, s.y, 36, .35); } }
  for (const s of eshots) { glow('rd', s.x, s.y, s.r * 3.2, .9); glow('wh', s.x, s.y, s.r * 1.2, 1); }
  for (const f of fxs) {
    if (f.k === 'zap') { const a = f.life / f.max; let seed = f.seed * 1000; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647; const x1 = f.x + (r() - .5) * 80, y1 = f.y - 520; const pts = [[x1, y1]]; for (let i = 1; i < 9; i++) pts.push([x1 + (f.x - x1) * i / 9 + (r() - .5) * 46, y1 + (f.y - y1) * i / 9]); pts.push([f.x, f.y]);
      for (const [lw, col] of [[14, `rgba(94,200,255,${a * .35})`], [6, `rgba(190,240,255,${a * .8})`], [2.2, `rgba(255,255,255,${a})`]]) { cx.strokeStyle = col; cx.lineWidth = lw; cx.lineJoin = 'round'; cx.beginPath(); pts.forEach((p, i) => (i ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1]))); cx.stroke(); } glow('cy', f.x, f.y, 70, a * .9); }
    else if (f.k === 'nova') { const a = Math.max(0, f.life), col = f.enemy ? '255,70,120' : '255,150,40'; const g = cx.createRadialGradient(f.x, f.y, f.r * .4, f.x, f.y, f.r); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},${a * .5})`); cx.fillStyle = g; cx.beginPath(); cx.arc(f.x, f.y, f.r, 0, TAU); cx.fill(); cx.strokeStyle = `rgba(255,${f.enemy ? 160 : 230},170,${a})`; cx.lineWidth = 6 + 10 * a; cx.beginPath(); cx.arc(f.x, f.y, f.r, 0, TAU); cx.stroke(); }
  }
  for (const p of parts) { const a = p.life / p.max; cx.globalAlpha = a; cx.fillStyle = p.c; cx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); } cx.globalAlpha = 1;
  cx.globalCompositeOperation = 'source-over';
  for (const s of shots) if (s.k === 'axe') { spr(SP.axe, s.x, s.y, 1.35 * (s.r / 20), s.rot, 1); }
}
function drawPickups(tm) {
  for (const g of gems) {
    const bob = Math.sin(g.ph * 4) * 3;
    if (g.kind === 'xp') { cx.globalCompositeOperation = 'lighter'; glow(['cy', 'gr', 'pk'][g.k], g.x, g.y, 18 + g.k * 6, .55); cx.globalCompositeOperation = 'source-over'; spr(SP.gem[g.k], g.x, g.y + bob, .8 + g.k * .25, 0); }
    else if (g.kind === 'coin') { cx.globalCompositeOperation = 'lighter'; glow('go', g.x, g.y, 16, .4); cx.globalCompositeOperation = 'source-over'; spr(SP.coin, g.x, g.y + bob, 1, 0, Math.cos(g.ph * 5)); }
    else if (g.kind === 'chest') { cx.globalCompositeOperation = 'lighter'; glow('go', g.x, g.y, 54, .55 + Math.sin(g.ph * 5) * .15); cx.globalCompositeOperation = 'source-over'; cx.drawImage(SP.shadow, g.x - 24, g.y + 6, 48, 24); spr(SP.chest, g.x, g.y + bob * .5, 1.25, 0); }
    else { cx.globalCompositeOperation = 'lighter'; glow(g.kind === 'heart' ? 'rd' : 'cy', g.x, g.y, 24, .5); cx.globalCompositeOperation = 'source-over'; spr(SP[g.kind], g.x, g.y + bob, 1.2, 0); }
  }
}
function drawAll(tm, menu) {
  const w = cv.width, h = cv.height, s = DPR * Z; cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, w, h);
  const shx = cam.sh ? rnd(-cam.sh, cam.sh) * .5 : 0, shy = cam.sh ? rnd(-cam.sh, cam.sh) * .5 : 0; const camx = menu ? Math.sin(tm / 6000) * 400 + tm * .01 : cam.x, camy = menu ? Math.cos(tm / 7000) * 300 : cam.y;
  cx.setTransform(s, 0, 0, s, w / 2 - camx * s + shx * DPR, h / 2 - camy * s + shy * DPR);
  drawWorldBase(tm, camx, camy);
  if (!menu && P) {
    drawPickups(tm); const list = enemies.slice(); list.push(P); list.sort((a, b) => a.y - b.y);
    const vx0 = camx - VW / Z / 2 - 120, vx1 = camx + VW / Z / 2 + 120, vy0 = camy - VH / Z / 2 - 140, vy1 = camy + VH / Z / 2 + 140;
    for (const e of list) { if (e === P) drawPlayer(tm); else if (e.x > vx0 && e.x < vx1 && e.y > vy0 && e.y < vy1) drawEntity(e, tm); }
    drawFx(tm);
    cx.textAlign = 'center'; cx.lineJoin = 'round'; for (const q of texts) { cx.globalAlpha = Math.min(1, q.life * 2.5); cx.font = `800 ${Math.round(17 * q.s)}px "Trebuchet MS",sans-serif`; cx.lineWidth = 4; cx.strokeStyle = '#000c'; cx.strokeText(q.txt, q.x, q.y); cx.fillStyle = q.col; cx.fillText(q.txt, q.x, q.y); } cx.globalAlpha = 1;
  } else { // menu ambience
    /* menu: just the arena and embers */
  }
  // screen space: vignette, embers, bloom
  cx.setTransform(1, 0, 0, 1, 0, 0);
  cx.globalCompositeOperation = 'lighter'; for (const a of amb) { const yy = ((a.y - tm * .001 * a.v) % 1 + 1) % 1; cx.fillStyle = `rgba(255,${150 + (a.s * 40) | 0},255,${.25 + .25 * Math.sin(tm / 500 + a.p)})`; cx.beginPath(); cx.arc(a.x * w, yy * h, a.s * DPR, 0, TAU); cx.fill(); } cx.globalCompositeOperation = 'source-over';
  const g = cx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .28, w / 2, h / 2, Math.hypot(w, h) * .56); g.addColorStop(0, 'rgba(6,2,16,0)'); g.addColorStop(.6, 'rgba(6,2,16,.35)'); g.addColorStop(1, 'rgba(3,0,10,.88)'); cx.fillStyle = g; cx.fillRect(0, 0, w, h);
  if (P && !menu && P.hurt > 0) { const a = P.hurt * 1.6, hg = cx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, Math.hypot(w, h) * .6); hg.addColorStop(0, 'rgba(255,0,60,0)'); hg.addColorStop(1, `rgba(255,0,60,${a})`); cx.fillStyle = hg; cx.fillRect(0, 0, w, h); }
  bloom(w, h);
}
function bloom(w, h) {
  b1.setTransform(1, 0, 0, 1, 0, 0); b1.clearRect(0, 0, bl1.width, bl1.height); if (CAN_FILTER) b1.filter = 'brightness(1.25) contrast(1.5) saturate(1.3)'; b1.drawImage(cv, 0, 0, bl1.width, bl1.height); if (CAN_FILTER) b1.filter = 'none';
  b2.clearRect(0, 0, bl2.width, bl2.height); b2.drawImage(bl1, 0, 0, bl2.width, bl2.height);
  cx.globalCompositeOperation = 'lighter'; cx.imageSmoothingEnabled = true; cx.globalAlpha = .55; cx.drawImage(bl2, 0, 0, w, h); cx.globalAlpha = .28; cx.drawImage(bl1, 0, 0, w, h); cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
}
function drawHud(tm) {
  const w = cv.width, u = UI * DPR; cx.setTransform(1, 0, 0, 1, 0, 0); cx.textAlign = 'left'; cx.lineJoin = 'round';
  const bh = 16 * u; cx.fillStyle = '#000b'; cx.fillRect(0, 0, w, bh + 4 * u); const g = cx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#5ee7ff'); g.addColorStop(1, '#ff4fd8'); cx.fillStyle = g; cx.fillRect(0, 2 * u, w * P.xp / P.need, bh);
  cx.fillStyle = '#ffffff30'; cx.fillRect(0, 2 * u, w * P.xp / P.need, bh * .4);
  const txt = (s, x, y, size, col, al) => { cx.font = `800 ${Math.round(size * u)}px "Trebuchet MS",sans-serif`; cx.textAlign = al || 'left'; cx.lineWidth = 4 * u; cx.strokeStyle = '#000d'; cx.strokeText(s, x, y); cx.fillStyle = col || '#fff'; cx.fillText(s, x, y); };
  txt(t('lvlup') + ' ' + P.lvl, 10 * u, bh + 26 * u, 18, '#fff'); txt(fmtT(G.t), w / 2, bh + 34 * u, 30, G.t > 400 ? '#ff8d8d' : '#fff', 'center');
  txt('☠ ' + P.kills, 10 * u, bh + 50 * u, 15, '#ffd1d9'); txt('🪙 ' + P.gold, 10 * u, bh + 70 * u, 15, '#ffc83d');
  const hpw = 150 * u, hx = 10 * u, hy = bh + 80 * u; cx.fillStyle = '#000b'; cx.fillRect(hx - 2 * u, hy - 2 * u, hpw + 4 * u, 14 * u); cx.fillStyle = P.hp / P.max > .35 ? '#3fe08f' : '#ff4466'; cx.fillRect(hx, hy, hpw * P.hp / P.max, 10 * u); txt(Math.ceil(P.hp) + '/' + P.max, hx + hpw + 8 * u, hy + 10 * u, 12, '#fff');
  const icons = []; for (const k in P.w) icons.push([WEAPONS[k].ico, P.w[k].lvl, 1]); for (const k in P.p) icons.push([PASSIVES[k].ico, P.p[k], 0]);
  icons.forEach((ic, i) => { const col = i % 7, row = Math.floor(i / 7), x = 10 * u + col * 38 * u, y = hy + 20 * u + row * 44 * u; cx.fillStyle = ic[2] ? '#2a1a60cc' : '#1a1030cc'; cx.fillRect(x, y, 34 * u, 40 * u); cx.strokeStyle = ic[2] ? '#7a5aff' : '#3a2a66'; cx.lineWidth = 1.5 * u; cx.strokeRect(x, y, 34 * u, 40 * u); cx.textAlign = 'center'; cx.font = `${Math.round(21 * u)}px sans-serif`; cx.fillStyle = '#fff'; cx.fillText(ic[0], x + 17 * u, y + 23 * u); cx.font = `800 ${Math.round(11 * u)}px sans-serif`; cx.fillStyle = '#ffc83d'; cx.fillText('Lv' + ic[1], x + 17 * u, y + 36 * u); });
  if (G.boss && !G.boss.dead) { const bw = Math.min(w * .6, 520 * u), bx = (w - bw) / 2, by = bh + 70 * u; cx.fillStyle = '#000c'; cx.fillRect(bx - 3 * u, by - 3 * u, bw + 6 * u, 18 * u); cx.fillStyle = G.boss.t === 'boss1' ? '#ff7a2a' : '#5ee7ff'; cx.fillRect(bx, by, bw * Math.max(0, G.boss.hp / G.boss.mhp), 12 * u); txt('☠ ' + (G.boss.name || t('boss')), w / 2, by - 8 * u, 15, '#fff', 'center'); }
  if (SV.runs === 0 && G.t < 9) txt(t('move'), w / 2, cv.height - 40 * u, 17, '#e9d9ff', 'center');
  if (joy.on) { const k = DPR; cx.globalAlpha = .45; cx.strokeStyle = '#fff'; cx.lineWidth = 3 * k; cx.beginPath(); cx.arc(joy.ox * k, joy.oy * k, 56 * k, 0, TAU); cx.stroke(); cx.fillStyle = '#fff'; const dx = joy.x - joy.ox, dy = joy.y - joy.oy, l = Math.min(56, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); cx.beginPath(); cx.arc((joy.ox + Math.cos(a) * l) * k, (joy.oy + Math.sin(a) * l) * k, 24 * k, 0, TAU); cx.fill(); cx.globalAlpha = 1; }
}
