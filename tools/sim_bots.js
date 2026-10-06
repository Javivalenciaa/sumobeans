// balance check: bots only, how long do rounds/matches last?
const fs = require('fs'); const src = fs.readFileSync(__dirname + '/../src/part3.js', 'utf8');
const pre = 'const rnd=(a,b)=>a+Math.random()*(b-a),irnd=(a,b)=>Math.floor(rnd(a,b+1)),pick=a=>a[(Math.random()*a.length)|0];const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;';
const mod = new Function(pre + src + ';return {Sim,WIN_ROUNDS,MAXP};')(); const { Sim } = mod;
const N = +process.argv[2] || 20; const roundLens = [], matchLens = []; let draws = 0, rounds = 0;
for (let m = 0; m < N; m++) {
  const s = new Sim(); for (let i = 0; i < 5; i++) s.addOrb(i, 'b' + i, i, false); s.startMatch(); let T = 0, rs = 0, lastRound = s.round;
  for (let i = 0; i < 60 * 600 && s.phase !== 4; i++) { s.step(1 / 60); T += 1 / 60; s.events = []; if (s.round !== lastRound) { roundLens.push((T - rs)); rs = T; lastRound = s.round; rounds++; } if (s.phase === 3 && s.winner === -1) draws++; }
  matchLens.push(T);
}
const avg = (a) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
console.log('matches', N, '| avg match', avg(matchLens), 's | avg round', avg(roundLens), 's | max round', Math.max(...roundLens).toFixed(0), 's | rounds', rounds, '| draws', draws);
