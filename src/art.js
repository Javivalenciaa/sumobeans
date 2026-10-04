
/* ============================== art: crisp cel-shaded sprites, painted at the real screen resolution ============================== */
const SP = {}; let SS = 1;
const OL = '#1c1424';
function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = Math.ceil(w * SS); c.height = Math.ceil(h * SS); const x = c.getContext('2d'); x.scale(SS, SS); x.lineJoin = 'round'; x.lineCap = 'round'; fn(x, w, h); c.lw = w; c.lh = h; return c; }
function white(src) { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); c.lw = src.lw; c.lh = src.lh; return c; }
const P2 = (fn) => { const p = new Path2D(); fn(p); return p; };
const lg = (x, x0, y0, x1, y1, ...c) => { const g = x.createLinearGradient(x0, y0, x1, y1); c.forEach((s, i) => g.addColorStop(i / (c.length - 1), s)); return g; };
const rg = (x, cx, cy, r0, r1, ...c) => { const g = x.createRadialGradient(cx, cy, r0, cx, cy, r1); c.forEach((s, i) => g.addColorStop(i / (c.length - 1), s)); return g; };
function shape(x, d, fill, lw, fx) { x.lineWidth = (lw || 2.4) * 2; x.strokeStyle = OL; x.stroke(d); x.fillStyle = fill; x.fill(d); if (fx) { x.save(); x.clip(d); fx(x); x.restore(); } }
function ell(cx, cy, rx, ry, rot) { return P2((p) => p.ellipse(cx, cy, rx, ry, rot || 0, 0, TAU)); }
function eyes(x, ex1, ex2, ey, r, pup, col) { for (const e of [ex1, ex2]) { x.fillStyle = '#fff'; x.beginPath(); x.arc(e, ey, r, 0, TAU); x.fill(); x.lineWidth = 1.4; x.strokeStyle = OL; x.stroke(); x.fillStyle = col || OL; x.beginPath(); x.arc(e + (pup || 0), ey + r * .12, r * .55, 0, TAU); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(e + (pup || 0) + r * .18, ey - r * .15, r * .2, 0, TAU); x.fill(); } }
function shine(x, cx, cy, rx, ry, rot, a) { x.fillStyle = `rgba(255,255,255,${a || .45})`; x.beginPath(); x.ellipse(cx, cy, rx, ry, rot || 0, 0, TAU); x.fill(); }
function shadeBottom(x, w, h, a) { x.fillStyle = lg(x, 0, h * .35, 0, h, 'rgba(10,0,40,0)', `rgba(10,0,40,${a || .35})`); x.fillRect(0, 0, w, h); }

const HEROES = [
  { n: ['Aria', 'Aria'], role: ['Mage · Arcane Bolt', 'Maga · Rayo Arcano'], w: 'bolt', hp: 0, spd: 0, cost: 0, col: '#7aa4ff' },
  { n: ['Bron', 'Bron'], role: ['Warrior · Spin Axe, +25 HP', 'Guerrero · Hacha, +25 vida'], w: 'axe', hp: 25, spd: 0, cost: 600, col: '#ff8a6a' },
  { n: ['Sylph', 'Sylph'], role: ['Druid · Spirit Orbs, +10% speed', 'Druida · Orbes, +10% velocidad'], w: 'orbit', hp: 0, spd: .1, cost: 1400, col: '#86e06a' },
];
function heroSprite(i) {
  return mk(60, 78, (x, w, h) => {
    x.translate(30, 0);
    // boots
    for (const s of [-1, 1]) shape(x, ell(s * 9, 73, 8, 5), '#5a3a22', 2);
    if (i === 0) { // MAGE: blue robe, pointy hat, glowing staff
      shape(x, P2((p) => { p.moveTo(-14, 34); p.quadraticCurveTo(-26, 58, -20, 72); p.lineTo(20, 72); p.quadraticCurveTo(26, 58, 14, 34); p.closePath(); }), lg(x, -20, 34, 20, 72, '#6f94ff', '#3a54d4'), 2.6, (c) => { shine(c, -8, 46, 5, 12, .2, .35); shadeBottom(c, 0, 0, 0); c.fillStyle = 'rgba(20,10,80,.25)'; c.fillRect(6, 30, 20, 50); });
      shape(x, P2((p) => p.rect(-14, 50, 28, 6)), '#ffcf4a', 1.8); shape(x, ell(0, 53, 4, 4), '#ff6a4a', 1.4);
      shape(x, ell(0, 26, 12, 12), '#ffd6ae', 2.4, (c) => { shine(c, -4, 21, 4, 3, 0, .4); }); // head
      x.fillStyle = OL; x.beginPath(); x.arc(-4.6, 27, 1.9, 0, TAU); x.arc(4.6, 27, 1.9, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,120,120,.5)'; x.beginPath(); x.arc(-8, 31, 2.4, 0, TAU); x.arc(8, 31, 2.4, 0, TAU); x.fill();
      x.strokeStyle = OL; x.lineWidth = 1.4; x.beginPath(); x.arc(0, 31, 3, .2, Math.PI - .2); x.stroke();
      shape(x, P2((p) => { p.moveTo(-17, 17); p.quadraticCurveTo(0, 8, 17, 17); p.quadraticCurveTo(0, 22, -17, 17); p.closePath(); }), '#4a64e0', 2.4);
      shape(x, P2((p) => { p.moveTo(-11, 15); p.quadraticCurveTo(-8, 0, 8, -4); p.quadraticCurveTo(2, 4, 11, 15); p.closePath(); }), lg(x, -11, 0, 11, 15, '#7d9bff', '#3a54d4'), 2.4);
      shape(x, P2((p) => p.rect(-11, 11, 22, 4)), '#ffcf4a', 1.6);
      x.save(); x.translate(26, 30); x.rotate(.12); shape(x, P2((p) => p.rect(-2, 0, 4, 46)), '#8a5a2a', 1.8); shape(x, ell(0, -4, 7, 7), rg(x, -2, -6, 1, 8, '#fff', '#7ee8ff', '#2a8cff'), 2); x.restore();
    } else if (i === 1) { // WARRIOR: red tunic, steel helmet w/ plume, shield
      shape(x, P2((p) => { p.moveTo(-16, 32); p.quadraticCurveTo(-24, 56, -18, 72); p.lineTo(18, 72); p.quadraticCurveTo(24, 56, 16, 32); p.closePath(); }), lg(x, -18, 32, 18, 72, '#ff7a5a', '#c2381f'), 2.6, (c) => { shine(c, -8, 46, 5, 12, .2, .3); c.fillStyle = 'rgba(60,0,0,.22)'; c.fillRect(6, 30, 20, 50); });
      shape(x, P2((p) => { p.moveTo(-15, 32); p.lineTo(15, 32); p.lineTo(12, 52); p.lineTo(-12, 52); p.closePath(); }), lg(x, -15, 32, 15, 52, '#e9eef5', '#8f9db4'), 2.4, (c) => { shine(c, -6, 38, 5, 3, 0, .5); });
      shape(x, P2((p) => p.rect(-16, 56, 32, 6)), '#6a4a2a', 1.8); shape(x, P2((p) => p.rect(-3, 54, 6, 10)), '#ffcf4a', 1.4);
      shape(x, ell(0, 24, 13, 12.5), '#ffd6ae', 2.4);
      x.fillStyle = OL; x.beginPath(); x.arc(-4.6, 26, 1.9, 0, TAU); x.arc(4.6, 26, 1.9, 0, TAU); x.fill(); x.strokeStyle = OL; x.lineWidth = 1.6; x.beginPath(); x.moveTo(-8, 21); x.lineTo(-2.5, 23); x.moveTo(8, 21); x.lineTo(2.5, 23); x.stroke(); x.beginPath(); x.moveTo(-3, 31); x.lineTo(3, 31); x.stroke();
      shape(x, P2((p) => { p.moveTo(-14, 22); p.quadraticCurveTo(-15, 6, 0, 5); p.quadraticCurveTo(15, 6, 14, 22); p.lineTo(9, 18); p.lineTo(-9, 18); p.closePath(); }), lg(x, -14, 5, 14, 22, '#f4f7fb', '#8794ac'), 2.4, (c) => { shine(c, -6, 10, 4, 2.4, -.3, .6); });
      shape(x, P2((p) => { p.moveTo(-3, 6); p.quadraticCurveTo(0, -8, 14, -4); p.quadraticCurveTo(6, 0, 4, 7); p.closePath(); }), '#ff4a3a', 2);
      shape(x, ell(-26, 48, 11, 14), lg(x, -36, 36, -16, 62, '#b07a3a', '#6a4220'), 2.6, (c) => { c.fillStyle = '#ffcf4a'; c.beginPath(); c.arc(-26, 48, 4.5, 0, TAU); c.fill(); });
      x.save(); x.translate(25, 40); x.rotate(.35); shape(x, P2((p) => p.rect(-2.5, -6, 5, 22)), '#cfd8e6', 1.8); shape(x, P2((p) => p.rect(-6, 14, 12, 4)), '#ffcf4a', 1.6); shape(x, P2((p) => p.rect(-2, 18, 4, 8)), '#6a3a1a', 1.6); x.restore();
    } else { // DRUID: green hooded cloak, leaf crown, nature staff
      shape(x, P2((p) => { p.moveTo(-15, 32); p.quadraticCurveTo(-26, 56, -19, 72); p.lineTo(19, 72); p.quadraticCurveTo(26, 56, 15, 32); p.closePath(); }), lg(x, -19, 32, 19, 72, '#58c46a', '#25804a'), 2.6, (c) => { shine(c, -8, 46, 5, 12, .2, .3); c.fillStyle = 'rgba(0,50,20,.25)'; c.fillRect(6, 30, 20, 50); });
      shape(x, P2((p) => p.rect(-15, 54, 30, 6)), '#8a5a2a', 1.8); shape(x, ell(0, 57, 4, 4), '#ffd84a', 1.4);
      shape(x, P2((p) => { p.moveTo(-13, 30); p.quadraticCurveTo(-18, 6, 0, 4); p.quadraticCurveTo(18, 6, 13, 30); p.closePath(); }), '#3e9a52', 2.4);
      shape(x, ell(0, 24, 11.5, 11.5), '#ffd6ae', 2.4, (c) => { shine(c, -4, 19, 4, 3, 0, .4); });
      x.fillStyle = OL; x.beginPath(); x.arc(-4.4, 25, 1.9, 0, TAU); x.arc(4.4, 25, 1.9, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,120,120,.5)'; x.beginPath(); x.arc(-7.6, 29, 2.3, 0, TAU); x.arc(7.6, 29, 2.3, 0, TAU); x.fill(); x.strokeStyle = OL; x.lineWidth = 1.4; x.beginPath(); x.arc(0, 28.5, 3, .2, Math.PI - .2); x.stroke();
      shape(x, P2((p) => { p.moveTo(-11, 15); p.quadraticCurveTo(0, 4, 11, 15); p.lineTo(8, 18); p.quadraticCurveTo(0, 12, -8, 18); p.closePath(); }), '#8a5a2a', 2);
      for (const [lx, ly, ro] of [[-8, 11, -.9], [0, 8, 0], [8, 11, .9]]) { x.save(); x.translate(lx, ly); x.rotate(ro); shape(x, P2((p) => { p.moveTo(0, 2); p.quadraticCurveTo(-5, -5, 0, -11); p.quadraticCurveTo(5, -5, 0, 2); }), '#8be06a', 1.8); x.restore(); }
      x.save(); x.translate(26, 30); x.rotate(.1); shape(x, P2((p) => p.rect(-2.2, 0, 4.4, 46)), '#7a4a22', 1.8); shape(x, ell(0, -6, 8, 8), rg(x, -2, -8, 1, 9, '#d8ffc0', '#6ee060', '#2a9a3a'), 2); shine(x, -2.5, -9, 2.5, 1.8, 0, .8); x.restore();
    }
  });
}
function buildSprites() {
  [0, 1, 2].forEach((i) => { SP['hero' + i] = heroSprite(i); SP['hero' + i + 'W'] = white(SP['hero' + i]); });
  SP.slime = mk(48, 42, (x) => {
    shape(x, P2((p) => { p.moveTo(4, 36); p.bezierCurveTo(0, 22, 8, 6, 24, 6); p.bezierCurveTo(40, 6, 48, 22, 44, 36); p.bezierCurveTo(32, 40, 16, 40, 4, 36); p.closePath(); }), lg(x, 0, 6, 0, 40, '#aaff8a', '#44d65a', '#1f9a45'), 2.6, (c) => { shine(c, 15, 14, 7, 3.6, -.5, .5); c.fillStyle = 'rgba(0,60,30,.18)'; c.beginPath(); c.ellipse(24, 38, 24, 8, 0, 0, TAU); c.fill(); });
    eyes(x, 16, 32, 24, 5.6, 1.2); x.strokeStyle = OL; x.lineWidth = 2.4; x.beginPath(); x.moveTo(10, 15); x.lineTo(20, 19); x.moveTo(38, 15); x.lineTo(28, 19); x.stroke(); x.beginPath(); x.arc(24, 33, 3.5, Math.PI + .3, -.3); x.stroke();
  });
  SP.batBody = mk(28, 28, (x) => {
    shape(x, P2((p) => { p.moveTo(6, 10); p.lineTo(5, 0); p.lineTo(11, 6); p.moveTo(22, 10); p.lineTo(23, 0); p.lineTo(17, 6); }), '#7a3ac4', 2);
    shape(x, ell(14, 15, 10.5, 10), lg(x, 0, 5, 0, 25, '#c27aff', '#7a3ac4', '#4a1a8a'), 2.4, (c) => { shine(c, 10, 10, 4, 2.4, -.5, .5); });
    eyes(x, 10.5, 17.5, 14, 3.4, 0, '#d01a3a'); x.fillStyle = '#fff'; for (const fx of [11, 17]) { x.beginPath(); x.moveTo(fx - 1.4, 21); x.lineTo(fx, 24.5); x.lineTo(fx + 1.4, 21); x.fill(); }
  });
  SP.batWing = mk(34, 26, (x) => { shape(x, P2((p) => { p.moveTo(1, 10); p.quadraticCurveTo(16, -4, 33, 3); p.quadraticCurveTo(27, 9, 30, 15); p.quadraticCurveTo(22, 11, 21, 21); p.quadraticCurveTo(14, 13, 9, 24); p.quadraticCurveTo(7, 16, 1, 10); p.closePath(); }), lg(x, 0, 0, 34, 0, '#6a2ab0', '#3a1272'), 2.2, (c) => { c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(2, 10); c.lineTo(27, 12); c.moveTo(2, 10); c.lineTo(21, 20); c.stroke(); }); });
  const brute = (elite) => mk(84, 84, (x) => {
    x.translate(42, 0);
    shape(x, ell(-16, 78, 12, 6), '#4a2a14', 2); shape(x, ell(16, 78, 12, 6), '#4a2a14', 2);
    shape(x, P2((p) => { p.moveTo(-26, 76); p.bezierCurveTo(-38, 50, -32, 30, -14, 28); p.lineTo(14, 28); p.bezierCurveTo(32, 30, 38, 50, 26, 76); p.closePath(); }), lg(x, 0, 28, 0, 78, '#ff9a5a', '#e0602a', '#a83a1a'), 3, (c) => { shine(c, -16, 40, 7, 14, .3, .3); });
    shape(x, P2((p) => { p.moveTo(-24, 58); p.lineTo(24, 58); p.lineTo(20, 78); p.lineTo(-20, 78); p.closePath(); }), '#7a4a26', 2.4);
    if (elite) { shape(x, P2((p) => { p.moveTo(-34, 36); p.quadraticCurveTo(-46, 28, -36, 22); p.lineTo(-18, 30); p.lineTo(-24, 44); p.closePath(); }), lg(x, -46, 22, -18, 44, '#ffe27a', '#d4961a'), 2.4); shape(x, P2((p) => { p.moveTo(34, 36); p.quadraticCurveTo(46, 28, 36, 22); p.lineTo(18, 30); p.lineTo(24, 44); p.closePath(); }), lg(x, 46, 22, 18, 44, '#ffe27a', '#d4961a'), 2.4); }
    shape(x, ell(0, 22, 20, 17), lg(x, 0, 6, 0, 38, '#ffa86a', '#d8602a'), 3, (c) => { shine(c, -8, 14, 7, 3, -.3, .4); });
    shape(x, P2((p) => { p.moveTo(-16, 10); p.quadraticCurveTo(-30, 4, -26, -10); p.quadraticCurveTo(-18, 0, -10, 4); p.closePath(); }), '#f2ead2', 2.4); shape(x, P2((p) => { p.moveTo(16, 10); p.quadraticCurveTo(30, 4, 26, -10); p.quadraticCurveTo(18, 0, 10, 4); p.closePath(); }), '#f2ead2', 2.4);
    x.fillStyle = '#fff'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(s * 8.5, 20, 6, 5.5, 0, 0, TAU); x.fill(); x.lineWidth = 1.6; x.strokeStyle = OL; x.stroke(); x.fillStyle = '#d01a1a'; x.beginPath(); x.arc(s * 8, 21, 2.6, 0, TAU); x.fill(); x.fillStyle = '#fff'; }
    x.strokeStyle = OL; x.lineWidth = 3; x.beginPath(); x.moveTo(-17, 11); x.lineTo(-3, 17); x.moveTo(17, 11); x.lineTo(3, 17); x.stroke();
    x.fillStyle = '#2a0e08'; x.beginPath(); x.ellipse(0, 30, 10, 5.5, 0, 0, TAU); x.fill(); x.fillStyle = '#fff'; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 8, 28); x.lineTo(s * 10, 18); x.lineTo(s * 5, 27); x.fill(); x.lineWidth = 1.4; x.strokeStyle = OL; x.stroke(); }
    if (elite) shape(x, P2((p) => { p.moveTo(-12, 2); p.lineTo(-12, -10); p.lineTo(-6, -3); p.lineTo(0, -13); p.lineTo(6, -3); p.lineTo(12, -10); p.lineTo(12, 2); p.closePath(); }), lg(x, 0, -13, 0, 2, '#fff1a0', '#e0a31a'), 2.2);
  });
  SP.brute = brute(false); SP.elite = brute(true);
  SP.watcher = mk(54, 56, (x) => {
    shape(x, P2((p) => { p.moveTo(6, 22); p.quadraticCurveTo(-8, 10, -2, 0); p.quadraticCurveTo(14, 8, 18, 18); p.closePath(); }), '#8a4ad8', 2.2); shape(x, P2((p) => { p.moveTo(48, 22); p.quadraticCurveTo(62, 10, 56, 0); p.quadraticCurveTo(40, 8, 36, 18); p.closePath(); }), '#8a4ad8', 2.2);
    for (let i = 0; i < 5; i++) { x.strokeStyle = OL; x.lineWidth = 7; x.beginPath(); x.moveTo(15 + i * 6, 40); x.quadraticCurveTo(12 + i * 7 + (i % 2 ? 4 : -4), 49, 14 + i * 6.5, 55); x.stroke(); x.strokeStyle = '#b86ae8'; x.lineWidth = 3.4; x.stroke(); }
    shape(x, ell(27, 26, 21, 20), rg(x, 22, 20, 2, 24, '#fffdf0', '#ffe3b0', '#e0a050'), 2.8, (c) => { c.strokeStyle = 'rgba(210,60,60,.35)'; c.lineWidth = 1.2; for (let i = 0; i < 7; i++) { const a = i * .9; c.beginPath(); c.moveTo(27 + Math.cos(a) * 12, 26 + Math.sin(a) * 12); c.quadraticCurveTo(27 + Math.cos(a + .3) * 16, 26 + Math.sin(a + .3) * 16, 27 + Math.cos(a) * 21, 26 + Math.sin(a) * 21); c.stroke(); } });
    shape(x, ell(27, 27, 11, 11), rg(x, 27, 27, 1, 11, '#b05af0', '#6a1ab0', '#3a0a70'), 2.2); x.fillStyle = OL; x.beginPath(); x.arc(27, 27, 5, 0, TAU); x.fill(); shine(x, 23, 22, 3.4, 2.6, 0, .95);
  });
  const boss = (kind) => mk(160, 160, (x) => {
    x.translate(80, 0);
    if (kind === 1) { // WARDEN: stone golem with glowing cracks
      shape(x, ell(-36, 152, 24, 8), '#3a3440', 2.6); shape(x, ell(36, 152, 24, 8), '#3a3440', 2.6);
      shape(x, P2((p) => { p.moveTo(-50, 148); p.bezierCurveTo(-72, 100, -64, 56, -34, 46); p.lineTo(34, 46); p.bezierCurveTo(64, 56, 72, 100, 50, 148); p.closePath(); }), lg(x, 0, 46, 0, 150, '#a8a4b4', '#7a7688', '#4a465a'), 3.4, (c) => { shine(c, -30, 70, 12, 26, .3, .22); c.strokeStyle = '#ffb02a'; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-30, 130); c.lineTo(-18, 104); c.lineTo(-28, 86); c.lineTo(-14, 66); c.moveTo(28, 134); c.lineTo(20, 110); c.lineTo(32, 92); c.moveTo(0, 140); c.lineTo(4, 112); c.lineTo(-4, 94); c.stroke(); c.strokeStyle = '#fff1a0'; c.lineWidth = 1.2; c.stroke(); });
      for (const s of [-1, 1]) shape(x, ell(s * 64, 100, 16, 24, s * .2), lg(x, 0, 76, 0, 124, '#b4b0c0', '#6a6678'), 3, (c) => { shine(c, s * 60, 90, 5, 10, 0, .25); });
      shape(x, ell(0, 36, 30, 26), lg(x, 0, 10, 0, 62, '#bcb8c8', '#7a7688'), 3.4, (c) => { shine(c, -12, 24, 9, 4, -.3, .3); });
      shape(x, P2((p) => { p.moveTo(-28, 20); p.lineTo(-38, 2); p.lineTo(-18, 12); p.closePath(); }), '#8a8698', 2.4); shape(x, P2((p) => { p.moveTo(28, 20); p.lineTo(38, 2); p.lineTo(18, 12); p.closePath(); }), '#8a8698', 2.4);
      x.fillStyle = '#2a2230'; x.beginPath(); x.ellipse(0, 38, 22, 11, 0, 0, TAU); x.fill(); x.fillStyle = '#ffb02a'; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 18, 32); x.lineTo(s * 4, 40); x.lineTo(s * 17, 44); x.closePath(); x.fill(); } x.fillStyle = '#fff1a0'; for (const s of [-1, 1]) { x.beginPath(); x.arc(s * 11, 38, 2.6, 0, TAU); x.fill(); }
    } else { // HOLLOW KING: skeleton king, cape, crown, cyan eyes
      shape(x, P2((p) => { p.moveTo(-54, 148); p.quadraticCurveTo(-70, 90, -38, 44); p.lineTo(38, 44); p.quadraticCurveTo(70, 90, 54, 148); p.closePath(); }), lg(x, 0, 44, 0, 150, '#7a3ac8', '#4a1a90', '#2a0a60'), 3.4, (c) => { c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(-60, 50, 22, 100); });
      shape(x, P2((p) => { p.moveTo(-24, 70); p.lineTo(24, 70); p.lineTo(18, 148); p.lineTo(-18, 148); p.closePath(); }), '#e8e2d0', 2.8); x.strokeStyle = OL; x.lineWidth = 2.6; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(-18, 82 + i * 12); x.quadraticCurveTo(0, 90 + i * 12, 18, 82 + i * 12); x.stroke(); } x.beginPath(); x.moveTo(0, 72); x.lineTo(0, 140); x.stroke();
      shape(x, ell(0, 38, 28, 26), lg(x, 0, 12, 0, 64, '#fffaf0', '#d8d0b8'), 3.2, (c) => { shine(c, -10, 26, 8, 4, -.3, .5); });
      x.fillStyle = '#1c1424'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(s * 11, 36, 8.5, 9.5, 0, 0, TAU); x.fill(); x.fillStyle = '#6ff1ff'; x.beginPath(); x.arc(s * 11, 37, 4, 0, TAU); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(s * 11 - 1, 35.4, 1.6, 0, TAU); x.fill(); x.fillStyle = '#1c1424'; }
      x.beginPath(); x.moveTo(-4, 48); x.lineTo(0, 43); x.lineTo(4, 48); x.closePath(); x.fill(); x.strokeStyle = OL; x.lineWidth = 2.2; x.beginPath(); x.moveTo(-14, 56); x.lineTo(14, 56); for (let i = -12; i <= 12; i += 6) { x.moveTo(i, 52); x.lineTo(i, 60); } x.stroke();
      shape(x, P2((p) => { p.moveTo(-30, 18); p.lineTo(-34, -6); p.lineTo(-16, 6); p.lineTo(0, -12); p.lineTo(16, 6); p.lineTo(34, -6); p.lineTo(30, 18); p.closePath(); }), lg(x, 0, -12, 0, 18, '#fff1a0', '#e0a31a'), 2.8, (c) => { for (const [gx, gc] of [[-16, '#ff4a6a'], [0, '#6ff1ff'], [16, '#ff4a6a']]) { c.fillStyle = gc; c.beginPath(); c.arc(gx, 9, 3, 0, TAU); c.fill(); } });
      for (const s of [-1, 1]) shape(x, ell(s * 56, 92, 13, 22, s * .25), '#e8e2d0', 2.8);
    }
  });
  SP.boss1 = boss(1); SP.boss2 = boss(2);
  ['slime', 'brute', 'elite', 'watcher', 'boss1', 'boss2', 'batBody', 'batWing'].forEach((k) => { SP[k + 'W'] = white(SP[k]); });
  SP.gem = [['#7ee8ff', '#2a8cff'], ['#8dff9a', '#22b04a'], ['#ff9ae9', '#c02aa0']].map((c) => mk(22, 26, (x) => { shape(x, P2((p) => { p.moveTo(11, 1); p.lineTo(20, 9); p.lineTo(11, 25); p.lineTo(2, 9); p.closePath(); }), lg(x, 0, 0, 22, 26, c[0], c[1]), 1.8, (g) => { g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(11, 3); g.lineTo(16, 9); g.lineTo(11, 11); g.lineTo(6, 9); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(2, 9); g.lineTo(20, 9); g.stroke(); }); }));
  SP.coin = mk(20, 20, (x) => { shape(x, ell(10, 10, 8, 8), lg(x, 0, 0, 20, 20, '#fff08a', '#e0a31a'), 2, (c) => { c.strokeStyle = '#b8780a'; c.lineWidth = 1.6; c.beginPath(); c.arc(10, 10, 4.6, 0, TAU); c.stroke(); shine(c, 6.5, 6.5, 3, 1.8, -.7, .7); }); });
  SP.heart = mk(26, 24, (x) => { shape(x, P2((p) => { p.moveTo(13, 22); p.bezierCurveTo(-5, 10, 3, -3, 13, 6); p.bezierCurveTo(23, -3, 31, 10, 13, 22); }), lg(x, 0, 0, 0, 24, '#ff7a8a', '#e0203a'), 2, (c) => { shine(c, 7, 8, 3.4, 2.2, -.6, .7); }); });
  SP.magnet = mk(26, 26, (x) => { x.lineCap = 'butt'; x.lineWidth = 11; x.strokeStyle = OL; x.beginPath(); x.arc(13, 14, 7, Math.PI, 0); x.stroke(); x.lineWidth = 7; x.strokeStyle = '#ff4a5a'; x.beginPath(); x.arc(13, 14, 7, Math.PI, Math.PI * 1.5); x.stroke(); x.strokeStyle = '#4a7aff'; x.beginPath(); x.arc(13, 14, 7, Math.PI * 1.5, 0); x.stroke(); for (const px of [3.5, 16.5]) shape(x, P2((p) => p.rect(px, 14, 6, 8)), '#e8eef5', 1.6); });
  SP.chest = mk(44, 38, (x) => { shape(x, P2((p) => { p.moveTo(3, 35); p.lineTo(3, 16); p.quadraticCurveTo(22, -4, 41, 16); p.lineTo(41, 35); p.closePath(); }), lg(x, 0, 4, 0, 36, '#d08a44', '#7a4420'), 2.6, (c) => { c.fillStyle = '#ffcf4a'; c.fillRect(3, 17, 38, 5); c.fillRect(8, 8, 4, 28); c.fillRect(32, 8, 4, 28); shine(c, 12, 12, 7, 2.4, -.4, .35); }); shape(x, P2((p) => p.rect(18, 15, 8, 12)), '#ffe27a', 1.8); x.fillStyle = OL; x.beginPath(); x.arc(22, 21, 2, 0, TAU); x.fill(); });
  SP.axe = mk(44, 44, (x) => { shape(x, P2((p) => p.rect(20, 4, 4.4, 38)), '#8a5a2a', 1.8); shape(x, P2((p) => { p.moveTo(22, 6); p.quadraticCurveTo(44, 2, 42, 22); p.quadraticCurveTo(32, 17, 24, 24); p.closePath(); }), lg(x, 24, 4, 44, 24, '#ffffff', '#8fa0b8'), 2.2); shape(x, P2((p) => { p.moveTo(22, 6); p.quadraticCurveTo(0, 2, 2, 22); p.quadraticCurveTo(12, 17, 20, 24); p.closePath(); }), lg(x, 20, 4, 0, 24, '#ffffff', '#8fa0b8'), 2.2); });
  SP.shadow = mk(64, 32, (x) => { x.fillStyle = 'rgba(20,10,30,.34)'; x.beginPath(); x.ellipse(32, 16, 28, 11, 0, 0, TAU); x.fill(); x.fillStyle = 'rgba(20,10,30,.18)'; x.beginPath(); x.ellipse(32, 16, 31, 13.5, 0, 0, TAU); x.fill(); });
  buildWorldArt();
}
function buildWorldArt() {
  // seamless grass tile 512 logical px with painterly patches, blades, dirt and pebbles
  SP.ground = (() => { const S = 512, c = document.createElement('canvas'); c.width = c.height = Math.ceil(S * SS); const x = c.getContext('2d'); x.scale(SS, SS); let sd = 17; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const wrap = (fn) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) fn(ox, oy); };
    x.fillStyle = '#5eae45'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 70; i++) { const px = r() * S, py = r() * S, rr = 30 + r() * 80, lightc = r() > .5; wrap((ox, oy) => { x.fillStyle = lightc ? 'rgba(130,210,80,.22)' : 'rgba(30,110,60,.2)'; x.beginPath(); x.ellipse(px + ox, py + oy, rr, rr * (.6 + r() * .4), r() * 3, 0, TAU); x.fill(); }); }
    for (let i = 0; i < 9; i++) { const px = r() * S, py = r() * S, rr = 26 + r() * 44; wrap((ox, oy) => { x.fillStyle = 'rgba(176,128,76,.5)'; x.beginPath(); x.ellipse(px + ox, py + oy, rr, rr * .7, r() * 3, 0, TAU); x.fill(); x.fillStyle = 'rgba(214,170,110,.35)'; x.beginPath(); x.ellipse(px + ox - 4, py + oy - 5, rr * .78, rr * .52, 0, 0, TAU); x.fill(); }); }
    for (let i = 0; i < 2600; i++) { const px = r() * S, py = r() * S, k = r(), h = 5 + r() * 8; wrap((ox, oy) => { x.strokeStyle = k < .4 ? '#3f9a3e' : k < .75 ? '#7acb55' : '#9ce06a'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(px + ox, py + oy); x.lineTo(px + ox + (r() - .5) * 5, py + oy - h); x.stroke(); }); }
    for (let i = 0; i < 40; i++) { const px = r() * S, py = r() * S; wrap((ox, oy) => { x.fillStyle = '#8f8a96'; x.strokeStyle = '#4a4650'; x.lineWidth = 1.4; x.beginPath(); x.ellipse(px + ox, py + oy, 3 + r() * 2.5, 2 + r() * 1.5, 0, 0, TAU); x.fill(); x.stroke(); }); }
    for (let i = 0; i < 26; i++) { const px = r() * S, py = r() * S, col = pick(['#fff6a0', '#ffffff', '#ffb0d8', '#ffd08a']); wrap((ox, oy) => { x.fillStyle = col; x.strokeStyle = 'rgba(40,80,30,.7)'; x.lineWidth = 1; x.beginPath(); x.arc(px + ox, py + oy, 2.4, 0, TAU); x.fill(); x.stroke(); }); }
    return c; })();
  const tuft = (col) => mk(34, 26, (x) => { for (let i = 0; i < 7; i++) { x.strokeStyle = OL; x.lineWidth = 4.4; x.beginPath(); x.moveTo(17, 25); x.quadraticCurveTo(17 + (i - 3) * 4, 12, 17 + (i - 3) * 5.4, 3 + Math.abs(i - 3) * 2.4); x.stroke(); x.strokeStyle = col[i % 2]; x.lineWidth = 2.6; x.stroke(); } });
  const flower = (c1, c2) => mk(26, 30, (x) => { x.strokeStyle = '#2f8a3a'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(13, 29); x.lineTo(13, 14); x.stroke(); for (let i = 0; i < 5; i++) { const a = i * TAU / 5; shape(x, ell(13 + Math.cos(a) * 6, 10 + Math.sin(a) * 6, 4.4, 3.2, a), c1, 1.4); } shape(x, ell(13, 10, 3.4, 3.4), c2, 1.4); });
  SP.deco = {
    tuft: tuft(['#3f9a3e', '#7acb55']), flowerA: flower('#ff7aa8', '#ffe27a'), flowerB: flower('#ffffff', '#ffb02a'), flowerC: flower('#8ab4ff', '#fff6a0'),
    mush: mk(30, 30, (x) => { shape(x, P2((p) => p.rect(11, 14, 8, 14)), '#f4ead2', 1.8); shape(x, P2((p) => { p.moveTo(2, 18); p.quadraticCurveTo(15, -6, 28, 18); p.closePath(); }), lg(x, 0, 2, 0, 18, '#ff6a5a', '#c02a2a'), 2, (c) => { c.fillStyle = '#fff'; for (const [a, b, r2] of [[9, 12, 2.4], [16, 8, 2], [21, 13, 2.2]]) { c.beginPath(); c.arc(a, b, r2, 0, TAU); c.fill(); } }); }),
  };
  const tree = (k) => mk(k ? 70 : 96, k ? 130 : 128, (x, w, h) => {
    x.translate(w / 2, 0);
    if (k === 1) { // pine
      shape(x, P2((p) => p.rect(-6, h - 26, 12, 26)), '#7a4a22', 2.2);
      for (let i = 0; i < 4; i++) { const y0 = 8 + i * 26, wd = 14 + i * 9; shape(x, P2((p) => { p.moveTo(0, y0 - 4); p.lineTo(wd, y0 + 34); p.lineTo(-wd, y0 + 34); p.closePath(); }), lg(x, -wd, y0, wd, y0 + 34, '#3fa860', '#1f7a44'), 2.4, (c) => { c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.moveTo(0, y0 - 2); c.lineTo(-wd * .7, y0 + 30); c.lineTo(-wd * .2, y0 + 30); c.closePath(); c.fill(); }); }
    } else {
      shape(x, P2((p) => { p.moveTo(-8, h); p.quadraticCurveTo(-6, h - 30, -9, h - 52); p.lineTo(9, h - 52); p.quadraticCurveTo(6, h - 30, 8, h); p.closePath(); }), lg(x, -9, 0, 9, 0, '#9a6430', '#6a3e1a'), 2.4);
      for (const [cx2, cy2, r2, c2] of [[-22, 50, 26, '#44b84a'], [22, 50, 26, '#3aa845'], [0, 30, 34, '#5acd52'], [-6, 62, 26, '#44b84a']]) shape(x, ell(cx2, cy2, r2, r2 * .9), lg(x, cx2 - r2, cy2 - r2, cx2 + r2, cy2 + r2, '#8ae26a', c2, '#278a3a'), 2.6, (c) => { shine(c, cx2 - r2 * .35, cy2 - r2 * .4, r2 * .35, r2 * .22, -.5, .28); });
      x.fillStyle = '#ff5a4a'; for (const [ax, ay] of [[-20, 42], [14, 24], [26, 58]]) { x.beginPath(); x.arc(ax, ay, 4, 0, TAU); x.fill(); x.lineWidth = 1.4; x.strokeStyle = OL; x.stroke(); }
    }
  });
  const rock = (w, h, c1, c2) => mk(w, h, (x) => { shape(x, P2((p) => { p.moveTo(2, h - 3); p.lineTo(w * .1, h * .45); p.lineTo(w * .35, 4); p.lineTo(w * .72, h * .15); p.lineTo(w - 2, h * .6); p.lineTo(w - 4, h - 3); p.closePath(); }), lg(x, 0, 0, w, h, c1, c2), 2.6, (c) => { c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.moveTo(w * .1, h * .45); c.lineTo(w * .35, 4); c.lineTo(w * .45, h * .55); c.closePath(); c.fill(); c.fillStyle = 'rgba(30,20,60,.2)'; c.beginPath(); c.moveTo(w * .72, h * .15); c.lineTo(w - 2, h * .6); c.lineTo(w - 4, h - 3); c.lineTo(w * .55, h - 3); c.closePath(); c.fill(); }); });
  SP.prop = {
    tree: tree(0), pine: tree(1), rockA: rock(56, 42, '#b4b0c4', '#6e6a82'), rockB: rock(36, 28, '#c4bcc8', '#7e788a'),
    bush: mk(54, 40, (x) => { for (const [cx2, cy2, r2] of [[16, 26, 14], [38, 26, 14], [27, 18, 16]]) shape(x, ell(cx2, cy2, r2, r2 * .85), lg(x, cx2 - r2, cy2 - r2, cx2 + r2, cy2 + r2, '#7ad65a', '#2f9a44'), 2.4, (c) => { shine(c, cx2 - 4, cy2 - 5, 5, 3, -.5, .3); }); x.fillStyle = '#ff6a8a'; for (const [ax, ay] of [[18, 22], [34, 16], [40, 30]]) { x.beginPath(); x.arc(ax, ay, 2.6, 0, TAU); x.fill(); } }),
    stump: mk(40, 34, (x) => { shape(x, P2((p) => { p.moveTo(4, 32); p.lineTo(7, 10); p.lineTo(33, 10); p.lineTo(36, 32); p.closePath(); }), lg(x, 0, 0, 40, 0, '#a8723a', '#6a4220'), 2.4); shape(x, ell(20, 10, 13, 5.5), '#d8a468', 2.2, (c) => { c.strokeStyle = 'rgba(100,60,20,.6)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(20, 10, 8, 3, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(20, 10, 3.6, 1.4, 0, 0, TAU); c.stroke(); }); }),
    pillar: mk(44, 100, (x) => { shape(x, P2((p) => { p.moveTo(6, 98); p.lineTo(8, 14); p.lineTo(12, 8); p.lineTo(16, 18); p.lineTo(22, 4); p.lineTo(30, 14); p.lineTo(36, 10); p.lineTo(38, 98); p.closePath(); }), lg(x, 0, 0, 44, 0, '#d4d0dc', '#7e7a92'), 2.8, (c) => { c.strokeStyle = 'rgba(50,40,70,.35)'; c.lineWidth = 1.6; for (const yy of [30, 52, 74]) { c.beginPath(); c.moveTo(8, yy); c.lineTo(38, yy + 2); c.stroke(); } c.fillStyle = 'rgba(80,170,70,.5)'; c.beginPath(); c.ellipse(14, 88, 10, 6, 0, 0, TAU); c.fill(); }); shape(x, P2((p) => p.rect(2, 90, 40, 8)), '#9a96ac', 2.4); }),
    tomb: mk(40, 54, (x) => { shape(x, P2((p) => { p.moveTo(5, 52); p.lineTo(5, 20); p.quadraticCurveTo(20, -4, 35, 20); p.lineTo(35, 52); p.closePath(); }), lg(x, 0, 0, 40, 0, '#c8c4d4', '#7a768c'), 2.6, (c) => { c.strokeStyle = 'rgba(40,30,60,.55)'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(20, 16); c.lineTo(20, 34); c.moveTo(13, 22); c.lineTo(27, 22); c.stroke(); }); }),
  };
}
