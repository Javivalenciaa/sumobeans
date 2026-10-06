// regression: bots must move from the very first second of EVERY round, even while the human player stands still
const fs = require('fs'); const src = fs.readFileSync(__dirname + '/../src/part3.js', 'utf8');
const pre = 'const rnd=(a,b)=>a+Math.random()*(b-a),irnd=(a,b)=>Math.floor(rnd(a,b+1)),pick=a=>a[(Math.random()*a.length)|0];const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;';
const { Sim } = new Function(pre + src + ';return {Sim};')(); let bad = 0;
for (let diff = 0; diff < 3; diff++) {
  const s = new Sim(); s.diff = diff; s.addOrb(0, 'me', 0, true); for (let i = 1; i < 5; i++) s.addOrb(i, 'b' + i, i, false); s.startMatch();
  for (let round = 1; round <= 4; round++) {
    while (s.phase !== 2) s.step(1 / 60); const start = s.orbs.map((o) => [o.x, o.y]); let moved = 0, T = 0;
    for (let i = 0; i < 60 * 4 && s.phase === 2; i++) { s.input(0, 0, 0, false); s.step(1 / 60); T += 1 / 60; } s.orbs.forEach((o, k) => { if (!o.human && (Math.hypot(o.x - start[k][0], o.y - start[k][1]) > 25)) moved++; });
    const ok = moved >= 2; if (!ok) bad++; console.log((ok ? 'OK   ' : 'FAIL ') + 'difficulty ' + diff + ' round ' + s.round + ': ' + moved + '/4 bots moved in the first 4 s');
    while (s.phase === 2) s.step(1 / 60); while (s.phase === 3) s.step(1 / 60); if (s.phase === 4) break;
  }
}
process.exit(bad ? 1 : 0);
