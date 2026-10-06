
/* ============================== state, input, networking, UI ============================== */
const urlParam = (k) => { const m = location.search.match(new RegExp('[?&]' + k + '=([^&]*)')); return m ? decodeURIComponent(m[1]) : ''; };
const SERVER_URL = urlParam('server') || (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'ws://localhost:8080' : 'wss://34-28-108-52.sslip.io');
const touchMode = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
let mode = 'menu';          // menu | solo | host | client
let state = 'menu';         // menu | playing | paused | result
let sim = null, myId = 0, netEvents = [], lastPhase = 0, resultsShown = false, resTimer = 0;
const NET = { ws: null, code: '', pid: -1, roster: [], pub: false, cd: -1, live: false, lastSnap: null, snaps: [], inSend: 0, dashN: 0, lastDashN: {}, snapT: 0, peers: new Set(), status: '' };
const keys = {}, joy = { on: false, id: -1, ox: 0, oy: 0, x: 0, y: 0 }; let dashQueued = false, dashBtnId = -1;
const show = (id, on) => { $(id).hidden = !on; };
function hideAll() { ['#sMenu', '#sJoin', '#sLobby', '#sSkins', '#sHow', '#sPause', '#sRes'].forEach((s) => show(s, false)); }
function paintSnd() { const m = muted() && !adOn; $('#bSnd').textContent = m ? '🔇' : '🔊'; $('#bSnd2').textContent = (m ? '🔇 ' : '🔊 ') + t('snd'); }
function toggleSnd() { SV.mute = !SV.mute; paintSnd(); save(); if (!SV.mute) { actx(); sfx('click'); } }
function applyTexts() {
  document.documentElement.lang = LANG; $('#bSolo').textContent = t('solo'); $('#bQuick').textContent = t('quick'); $('#bCreate').textContent = t('create'); $('#bJoin').textContent = t('join'); $('#bSkins').textContent = t('skins'); $('#bHow').textContent = t('how');
  $('#bLang').textContent = '🌐 ' + (LANG === 'es' ? 'Español' : 'English'); $('#bDiff').textContent = '🤖 ' + t('bots') + ': ' + t(['easy', 'normal', 'hard'][SV.diff | 0]); $('#bResume').textContent = t('resume'); $('#bQuit').textContent = t('quit'); $('#pauseT').textContent = t('pause'); $('#bLang2').textContent = $('#bLang').textContent;
  $('#joinT').textContent = t('joinT'); $('#bJoinGo').textContent = t('go'); $('#bJoinX').textContent = t('cancel'); $('#codeIn').placeholder = '····'; $('#lobT').textContent = t('lobT'); $('#bStart').textContent = t('start'); $('#bCopy').textContent = t('copy'); $('#bLeave').textContent = t('leave');
  $('#skT').textContent = t('skT'); $('#bSkinsX').textContent = t('close'); $('#howT').textContent = t('howT'); $('#howTxt').innerHTML = t('howTxt'); $('#bHowX').textContent = t('close'); $('#bX2').textContent = t('x2'); $('#bAgain').textContent = t('again'); $('#bMenu').textContent = t('menu');
  paintSnd(); menuStats(); paintMenuOrb(); if (!$('#sSkins').hidden) renderSkins(); if (!$('#sLobby').hidden) renderLobby();
}
function setLang(l) { LANG = l === 'es' ? 'es' : 'en'; SV.lang = LANG; save(); applyTexts(); sfx('click'); }
function menuStats() { $('#mstats').textContent = '🪙 ' + SV.coins + '   ·   ' + t('wins') + ' ' + SV.wins + '   ·   ' + t('played') + ' ' + SV.played; }
function paintMenuOrb() { orbIcon($('#meOrb'), SV.skin, 44); $('#meName').textContent = SV.name; }
/* skins shop */
function renderSkins() {
  $('#skCoins').textContent = '🪙 ' + SV.coins; const el = $('#skList'); el.innerHTML = '';
  SKINS.forEach((s, i) => { const own = SV.skins.indexOf(i) >= 0, b = document.createElement('button'); b.className = 'sk' + (SV.skin === i ? ' on' : '') + (own ? '' : ' lock'); const c = document.createElement('canvas'); orbIcon(c, i, 32); b.appendChild(c); b.insertAdjacentHTML('beforeend', L2(s.n) + '<i>' + (SV.skin === i ? t('equip') : own ? t('owned') : '🪙 ' + s.cost) + '</i>');
    b.onclick = () => { if (own) { SV.skin = i; save(); sfx('click'); paintMenuOrb(); renderSkins(); } else if (SV.coins >= s.cost) { SV.coins -= s.cost; SV.skins.push(i); SV.skin = i; save(); sfx('coin'); paintMenuOrb(); menuStats(); renderSkins(); } else { toast(t('locked')); } }; el.appendChild(b); });
}
/* ------------------------------ input ------------------------------ */
window.addEventListener('keydown', (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0 && state !== 'menu') e.preventDefault();
  if (!keys[k] && (k === ' ' || k === 'Shift') && state === 'playing') dashQueued = true; keys[k] = true;
  if ((e.key === 'Escape' || k === 'p') && !e.repeat) { if (state === 'playing') pauseGame(); else if (state === 'paused') resumeGame(); }
  if (e.key === 'Enter' && !$('#sJoin').hidden) joinGo();
});
window.addEventListener('keyup', (e) => { keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; joy.on = false; if (state === 'playing' && mode === 'solo') pauseGame(); });
cv.addEventListener('pointerdown', (e) => {
  if (state !== 'playing') return; e.preventDefault(); const x = e.clientX, y = e.clientY;
  if (e.pointerType === 'touch' || touchMode) { if (x > VW * .58 && y > VH * .45 && dashBtnId < 0) { dashBtnId = e.pointerId; dashQueued = true; return; } }
  if (!joy.on && (e.pointerType === 'touch' || touchMode)) { joy.on = true; joy.id = e.pointerId; joy.ox = joy.x = x; joy.oy = joy.y = y; try { cv.setPointerCapture(e.pointerId); } catch (er) {} }
  else if (e.pointerType === 'mouse' && e.button === 0) dashQueued = true;
});
cv.addEventListener('pointermove', (e) => { if (joy.on && e.pointerId === joy.id) { joy.x = e.clientX; joy.y = e.clientY; const dx = joy.x - joy.ox, dy = joy.y - joy.oy, l = Math.hypot(dx, dy); if (l > 80) { joy.ox += dx / l * (l - 80); joy.oy += dy / l * (l - 80); } } });
const endPtr = (e) => { if (e.pointerId === joy.id) joy.on = false; if (e.pointerId === dashBtnId) dashBtnId = -1; };
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
function readInput() {
  let ix = (keys.d || keys.ArrowRight ? 1 : 0) - (keys.a || keys.ArrowLeft ? 1 : 0), iy = (keys.s || keys.ArrowDown ? 1 : 0) - (keys.w || keys.ArrowUp ? 1 : 0);
  if (joy.on) { const dx = joy.x - joy.ox, dy = joy.y - joy.oy, l = Math.hypot(dx, dy); if (l > 8) { const k = Math.min(1, l / 55) / l; ix = dx * k; iy = dy * k; } }
  const l = Math.hypot(ix, iy); if (l > 1) { ix /= l; iy /= l; } return [ix, iy];
}
/* ------------------------------ match flow ------------------------------ */
function fillBots(s, total) { const used = new Set(s.orbs.map((o) => o.name)); let n = 0; while (s.orbs.length < total) { let nm; do { nm = pick(BOT_NAMES) + (Math.random() < .3 ? irnd(2, 9) : ''); } while (used.has(nm)); used.add(nm); s.addOrb(100 + n++, nm, irnd(0, SKINS.length - 1), false); } }
function startSolo() {
  actx(); sim = new Sim(); sim.diff = SV.diff | 0; myId = 0; mode = 'solo'; sim.addOrb(0, SV.name, SV.skin, true); fillBots(sim, MAXP); beginPlay();
}
function beginPlay() { hideAll(); show('#topbtns', true); state = 'playing'; resultsShown = false; lastPhase = 0; parts = []; texts = []; sim.startMatch(); gameplay(true); musicOn = true; musicT = 0; sfx('click'); }
function handleEvents(evs, view) {
  for (const e of evs) {
    switch (e[0]) {
      case 'bump': sfx('bump', e[3]); spark(e[1], e[2], 6 + Math.round(e[3] * 8), '#fff6a8', 260, .45); shake = Math.max(shake, 4 + e[3] * 12); break;
      case 'dash': sfx('dash'); spark(e[2], e[3], 6, '#ffffff', 160, .35); break;
      case 'fall': { sfx('fall'); spark(e[2], e[3], 10, '#ffd0e8', 200, .8); shake = Math.max(shake, 5); const vo = view && view.orbs.find((q) => q.id === e[1]), ko = e[4] >= 0 && view && view.orbs.find((q) => q.id === e[4]); if (vo) pushFeed(ko ? ko.name + ' ➜ ' + vo.name : vo.name + ' 💨'); if (e[4] === myId && myId >= 0) { floatText(e[2], e[3], 'KO!', '#ffd23a'); } break; }
      case 'round': mapBanner = { txt: L2((MAPS[e[2]] || MAPS[0]).n), life: 3 }; break;
      case 'pick': { sfx('pick'); const o = view && view.orbs.find((q) => q.id === e[1]); spark(e[3], e[4], 12, PICK_COL[e[2]], 240, .6); if (o && o.id === myId) floatText(o.x, o.y - 40, t(['pickShield', 'pickHeavy', 'pickBoost', 'pickPulse'][e[2]]), PICK_COL[e[2]]); break; }
      case 'pulse': sfx('pulse'); spark(e[1], e[2], 24, '#ff9a6a', 380, .7); shake = Math.max(shake, 9); break;
      case 'tick': sfx('tick'); break;
      case 'go': sfx('go'); break;
      case 'rw': { const o = view && view.orbs.find((q) => q.id === e[1]); if (e[1] === myId) sfx('win'); else sfx('lose'); if (o) spark(o.x, o.y, 30, '#ffd23a', 420, 1); break; }
      case 'mw': break;
    }
  }
}
let curView = null, mapBanner = null;
function currentView() {
  if (mode === 'solo' || mode === 'host') return { p: sim.phase, cd: sim.cd, t: sim.t, R: sim.R, map: sim.map, hole: sim.hole, rd: sim.round, winner: sim.winner, mw: sim.matchWinner, orbs: sim.orbs, picks: sim.picks, meId: myId };
  if (mode === 'client' && NET.snaps.length) {
    const cur = NET.snaps[NET.snaps.length - 1], prev = NET.snaps.length > 1 ? NET.snaps[NET.snaps.length - 2] : cur, now = performance.now(); const a = prev === cur ? 1 : clamp((now - cur.at) / Math.max(30, cur.at - prev.at), 0, 1.2);
    const orbs = []; for (const row of cur.o) { const pr = prev.o.find((q) => q[0] === row[0]) || row, info = NET.roster.find((r) => r[0] === row[0]); if (!info) continue; const k = Math.min(1, a);
      orbs.push({ id: row[0], name: info[1], skin: info[2], human: !!info[3], x: lerp(pr[1], row[1], k), y: lerp(pr[2], row[2], k), vx: row[3], vy: row[4], fall: row[5], alive: !!row[6], shield: row[7], heavy: row[8], boost: row[9], dashCd: row[10], dash: row[11], score: row[12], kills: row[13] }); }
    return { p: cur.p, cd: cur.cd, t: cur.t, R: lerp(prev.R, cur.R, Math.min(1, a)), map: cur.mp || 0, hole: cur.h || 0, rd: cur.rd, winner: cur.w, mw: cur.mw, orbs, picks: cur.pk.map((q) => ({ id: q[0], k: q[1], x: q[2], y: q[3], age: q[4] })), meId: myId };
  }
  return null;
}
function myOrb(v) { return v && v.orbs.find((o) => o.id === myId); }
function results(v) {
  const list = v.orbs.slice().sort((a, b) => b.score - a.score || b.kills - a.kills); const me = list.findIndex((o) => o.id === myId);
  return { list, rank: me, won: v.mw === myId };
}
function showResults(v) {
  if (resultsShown) return; resultsShown = true; const r = results(v); gameplay(false); musicOn = false; state = 'result'; show('#topbtns', false); cgRoom(null);
  const meO = v.orbs.find((o) => o.id === myId), coins = 10 + (meO ? meO.kills * 5 : 0) + (r.won ? 30 : 0) + (r.rank === 1 ? 10 : 0); SV.coins += coins; SV.played++; if (r.won) { SV.wins++; happy(); sfx('win'); } else sfx('lose'); save(); menuStats();
  $('#resT').textContent = r.won ? t('youWin') : t('youLost'); $('#resWin').textContent = '🏆 ' + (v.orbs.find((o) => o.id === v.mw) || {}).name;
  const el = $('#resList'); el.innerHTML = ''; r.list.forEach((o, i) => { const d = document.createElement('div'); d.className = 'pl'; const c = document.createElement('canvas'); orbIcon(c, o.skin, 19); d.appendChild(c); d.insertAdjacentHTML('beforeend', '<span>' + (i + 1) + '. ' + o.name + (o.id === myId ? ' ⭐' : '') + '</span><em>' + o.score + ' 🏁 · ' + o.kills + ' 💥</em>'); el.appendChild(d); });
  window.__lastCoins = coins; $('#resCoins').textContent = '+' + coins + ' 🪙'; $('#bX2').disabled = false; show('#sRes', true);
  if (mode === 'host') { sendAll({ k: 'res' }); }
}
function pauseGame() { if (state !== 'playing') return; state = 'paused'; if (mode !== 'solo') { /* online: the match keeps going */ state = 'paused'; } show('#sPause', true); $('#pauseH').textContent = mode === 'solo' ? '' : ''; if (mode === 'solo') gameplay(false); }
function resumeGame() { if (state !== 'paused') return; state = 'playing'; show('#sPause', false); gameplay(true); sfx('click'); }
function leaveToMenu() {
  netLeave(); sim = null; mode = 'menu'; state = 'menu'; musicOn = false; gameplay(false); hideAll(); show('#topbtns', false); show('#sMenu', true); cgRoom(null); NET.snaps = []; NET.roster = []; NET.live = false; applyTexts();
}
function afterMatch(go) { const wait = performance.now() - CG.lastAd > 100000; if (wait) showAd('midgame', go); else go(); }
/* ------------------------------ networking ------------------------------ */
function sendRaw(o) { if (NET.ws && NET.ws.readyState === 1) NET.ws.send(JSON.stringify(o)); }
function sendAll(d) { sendRaw({ t: 'a', d }); }
function sendHost(d) { sendRaw({ t: 'h', d }); }
function netLeave() { try { if (NET.ws) { NET.ws.onclose = null; NET.ws.close(); } } catch (e) {} NET.ws = null; NET.code = ''; NET.pid = -1; NET.peers = new Set(); NET.cd = -1; NET.status = ''; }
function netConnect(first, onFail) {
  netLeave(); let opened = false, ws; try { ws = new WebSocket(SERVER_URL); } catch (e) { onFail && onFail(); return; } NET.ws = ws; NET.live = false; NET.snaps = []; NET.roster = [];
  const to = setTimeout(() => { if (!opened) { try { ws.close(); } catch (e) {} } }, 8000);
  ws.onopen = () => { opened = true; clearTimeout(to); first(); };
  ws.onerror = () => { if (!opened) { clearTimeout(to); onFail && onFail(); } };
  ws.onclose = () => { clearTimeout(to); if (!opened) { onFail && onFail(); return; } if (mode === 'host' || mode === 'client') { toast(t('lost')); leaveToMenu(); } };
  ws.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } netMsg(m); };
}
function offlineMsg() { toast(t('offline')); hideAll(); show('#sMenu', true); mode = 'menu'; }
function roomList() { return sim.orbs.map((o) => [o.id, o.name, o.skin, o.human ? 1 : 0]); }
function broadcastRoster(live) { if (mode !== 'host') return; sendAll({ k: 'ro', list: roomList(), live: live ? 1 : 0, code: NET.code }); NET.roster = roomList(); renderLobby(); }
function renderLobby() {
  if ($('#sLobby').hidden) return; $('#lobCode').textContent = NET.code || '····'; const el = $('#lobList'); el.innerHTML = '';
  const list = mode === 'host' ? sim.orbs : NET.roster.map((r) => ({ id: r[0], name: r[1], skin: r[2], human: !!r[3] }));
  list.forEach((o) => { const d = document.createElement('div'); d.className = 'pl'; const c = document.createElement('canvas'); orbIcon(c, o.skin, 19); d.appendChild(c); d.insertAdjacentHTML('beforeend', '<span>' + o.name + (o.id === myId ? ' ⭐' : '') + '</span><em>' + (o.human ? (o.id === (mode === 'host' ? myId : 0) && mode === 'host' ? t('host') : '') : t('bot')) + '</em>'); el.appendChild(d); });
  $('#lobSub').textContent = NET.pub ? t('findMatch') : t('botsFill'); $('#bStart').hidden = mode !== 'host' || NET.pub; $('#bCopy').hidden = NET.pub;
  $('#lobMsg').textContent = mode === 'host' ? (NET.pub ? (NET.cd >= 0 ? t('startsIn') + ' ' + NET.cd + 's' : '') : t('waiting')) : (NET.pub && NET.cd >= 0 ? t('startsIn') + ' ' + NET.cd + 's' : t('waitHost'));
}
function openLobby() { hideAll(); show('#sLobby', true); renderLobby(); }
function netStartHost(code, pub) {
  NET.code = code; NET.pub = pub; mode = 'host'; sim = new Sim(); myId = NET.pid = 0; sim.addOrb(0, SV.name, SV.skin, true); NET.roster = roomList(); openLobby(); if (!pub) cgRoom(code);
}
function hostStartMatch() { if (mode !== 'host' || !sim || sim.phase) return; sim.setDiff(SV.diff | 0); fillBots(sim, MAXP); sendRaw({ t: 'joinable', v: false }); broadcastRoster(true); beginPlay(); NET.live = true; }
function netMsg(m) {
  switch (m.t) {
    case 'created': netStartHost(m.code, !!m.pub); break;
    case 'joined': mode = 'client'; NET.code = m.code; NET.pub = !!m.pub; myId = NET.pid = m.id; NET.roster = []; openLobby(); sendHost({ k: 'hi', g: GAME_ID, v: 1, name: SV.name, skin: SV.skin }); break;
    case 'error': { const msg = { noroom: t('noRoom'), busy: t('busy'), full: t('full') }[m.msg] || m.msg; toast(msg); if (mode !== 'host' && mode !== 'client') { netLeave(); hideAll(); show('#sMenu', true); } break; }
    case 'peer': if (mode === 'host') { if (m.on) { NET.peers.add(m.id); const o = sim.get(m.id); if (o && sim.phase) { o.human = true; o.dropped = false; } } else { NET.peers.delete(m.id); const o = sim.get(m.id); if (o) { if (!sim.phase) sim.orbs.splice(sim.orbs.indexOf(o), 1); else o.human = false; } broadcastRoster(!!sim.phase); } } break;
    case 'cd': NET.cd = m.s; renderLobby(); break;
    case 'go': if (mode === 'host') hostStartMatch(); break;
    case 'host': becomeHost(); break;
    case 'hostchanged': NET.snaps = []; break;
    case 'closed': if (mode === 'client' || mode === 'host') { toast(t('lost')); leaveToMenu(); } break;
    case 'm': onPeerMsg(m.from, m.d); break;
  }
}
function onPeerMsg(from, d) {
  if (!d || typeof d.k !== 'string') return;
  if (mode === 'host') {
    if (d.k === 'hi') { if (d.g !== GAME_ID || sim.get(from)) return; const nm = String(d.name || 'Player').replace(/[^\w \-]/g, '').slice(0, 14) || 'Player'; if (sim.orbs.length >= MAXP) return; sim.addOrb(from, nm, clamp(d.skin | 0, 0, SKINS.length - 1), true); broadcastRoster(false); }
    else if (d.k === 'in') { const o = sim.get(from); if (!o) return; sim.input(from, +d.x || 0, +d.y || 0, (d.d | 0) !== (NET.lastDashN[from] || 0)); NET.lastDashN[from] = d.d | 0; }
  } else if (mode === 'client') {
    if (d.k === 'ro') { NET.roster = d.list; NET.code = d.code || NET.code; if (d.live && state !== 'playing' && state !== 'paused') { hideAll(); show('#topbtns', true); state = 'playing'; resultsShown = false; parts = []; texts = []; gameplay(true); musicOn = true; musicT = 0; } renderLobby(); }
    else if (d.k === 's') { d.at = performance.now(); NET.snaps.push(d); if (NET.snaps.length > 4) NET.snaps.shift(); NET.lastSnap = d; const v = currentView(); handleEvents(d.ev || [], v); if (d.p === 4 && !resultsShown) { resTimer = performance.now() + 2500; } }
  }
}
function becomeHost() {
  if (mode !== 'client') return; const s = NET.lastSnap, roster = NET.roster; if (!roster.length) { leaveToMenu(); return; }
  sim = new Sim(); for (const r of roster) { const o = sim.addOrb(r[0], r[1], r[2], false); o.human = false; } const me = sim.get(myId); if (me) me.human = true;
  if (s) { sim.phase = s.p; sim.cd = s.cd; sim.t = s.t; sim.R = s.R; sim.round = s.rd; sim.winner = s.w; sim.matchWinner = s.mw; for (const row of s.o) { const o = sim.get(row[0]); if (!o) continue; Object.assign(o, { x: row[1], y: row[2], vx: row[3], vy: row[4], fall: row[5], alive: !!row[6], shield: row[7], heavy: row[8], boost: row[9], dashCd: row[10], dash: row[11], score: row[12], kills: row[13] }); } sim.picks = s.pk.map((q) => ({ id: q[0], k: q[1], x: q[2], y: q[3], age: q[4] })); }
  mode = 'host'; NET.snaps = []; NET.lastDashN = {}; toast(t('hostMoved')); broadcastRoster(!!sim.phase);
}
function hostTick(now) { // snapshot broadcast at 20 Hz
  if (mode !== 'host' || now - NET.snapT < 50) return; NET.snapT = now; const s = sim.snapshot(); s.ev = netEvents.splice(0); sendAll(Object.assign({ k: 's' }, s));
}
function clientSendInput(now, ix, iy) { if (mode !== 'client' || now - NET.inSend < 33) return; NET.inSend = now; if (dashQueued) { NET.dashN = (NET.dashN + 1) & 255; dashQueued = false; } sendHost({ k: 'in', x: r2(ix), y: r2(iy), d: NET.dashN }); }
/* ------------------------------ main loop ------------------------------ */
let lastT = performance.now(), bgTime = 0;
function loop(tm) {
  const dt = Math.min(.05, (tm - lastT) / 1000); lastT = tm; const L = layout();
  let v = null;
  if (state === 'playing' || state === 'paused' || state === 'result') {
    const [ix, iy] = readInput();
    if ((state === 'playing' || (state === 'paused' && mode !== 'solo')) && (mode === 'solo' || mode === 'host') && sim) {
      if (state === 'playing') { sim.input(myId, ix, iy, dashQueued); } else sim.input(myId, 0, 0, false); dashQueued = false;
      sim.step(dt); const evs = sim.events; sim.events = []; netEvents.push(...evs); v = currentView(); handleEvents(evs, v); hostTick(tm);
      if (sim.phase === 4 && !resultsShown) { if (!resTimer) resTimer = tm + 2500; if (tm > resTimer) { resTimer = 0; showResults(currentView()); } }
    } else if (mode === 'client') { if (state === 'playing') clientSendInput(tm, ix, iy); else if (state === 'paused') clientSendInput(tm, 0, 0); v = currentView(); if (v && v.p === 4 && !resultsShown && resTimer && tm > resTimer) { resTimer = 0; showResults(v); } }
    else v = currentView();
  }
  curView = v;
  if (v) {
    drawGame(v, tm, dt); const me = myOrb(v); if (window.__nohud) { requestAnimationFrame(loop); return; } drawScores(v);
    drawFeed(dt); if (mapBanner && mapBanner.life > 0) { mapBanner.life -= dt; const u = Math.min(cv.width, cv.height) / 600; cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = Math.min(1, mapBanner.life); cx.textAlign = 'center'; cx.font = `900 ${Math.round(26 * u)}px "Trebuchet MS",sans-serif`; cx.lineWidth = 6 * u; cx.strokeStyle = OL; cx.lineJoin = 'round'; cx.strokeText('🗺 ' + mapBanner.txt, cv.width / 2, cv.height * .14); cx.fillStyle = '#fff'; cx.fillText('🗺 ' + mapBanner.txt, cv.width / 2, cv.height * .14); cx.restore(); }
    if (v.p === 1) drawHudBig(String(Math.max(1, Math.ceil(v.cd))), t('round') + ' ' + v.rd, '#ffd23a', 1 + (v.cd % 1) * .25);
    else if (v.p === 2 && v.t < .8) drawHudBig(t('go2'), '', '#7aff8a', 1);
    else if (v.p === 3 && v.winner >= 0) { const w = v.orbs.find((o) => o.id === v.winner); if (w) drawHudBig(w.name, t('winner'), '#ffd23a', .55); }
    if (state === 'playing') drawDashHud(me, touchMode);
    if (joy.on) { const k = DPR; cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = .5; cx.strokeStyle = '#fff'; cx.lineWidth = 3 * k; cx.beginPath(); cx.arc(joy.ox * k, joy.oy * k, 56 * k, 0, TAU); cx.stroke(); cx.fillStyle = '#fff'; const dx = joy.x - joy.ox, dy = joy.y - joy.oy, l = Math.min(56, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); cx.beginPath(); cx.arc((joy.ox + Math.cos(a) * l) * k, (joy.oy + Math.sin(a) * l) * k, 24 * k, 0, TAU); cx.fill(); cx.restore(); }
  } else {
    // menu background: a calm demo arena with bouncing bots
    bgTime += dt; if (!window.__demo) { window.__demo = new Sim(); fillBots(window.__demo, 5); window.__demo.startMatch(); window.__demo.cd = .1; }
    const d = window.__demo; if (d.phase === 3 || d.phase === 4) d.startMatch(); d.step(dt); d.events = []; if (d.phase === 2 && d.t > 20) d.startMatch();
    drawGame({ p: d.phase, cd: 0, t: Math.min(d.t, 10), R: d.R, map: d.map, hole: d.hole, rd: 1, winner: -1, orbs: d.orbs, picks: d.picks, meId: -1 }, tm, dt);
  }
  requestAnimationFrame(loop);
}
/* ------------------------------ boot ------------------------------ */
async function main() {
  await cgBoot(); loadSave(); resize(); window.addEventListener('resize', resize); applyTexts();
  $('#bSolo').onclick = startSolo; $('#bDice').onclick = () => { SV.name = randName(); save(); paintMenuOrb(); sfx('click'); };
  $('#bQuick').onclick = () => { actx(); sfx('click'); NET.pub = true; netConnect(() => sendRaw({ t: 'quick', g: GAME_ID }), offlineMsg); };
  $('#bCreate').onclick = () => { actx(); sfx('click'); netConnect(() => sendRaw({ t: 'create', g: GAME_ID }), offlineMsg); };
  $('#bJoin').onclick = () => { sfx('click'); hideAll(); show('#sJoin', true); $('#codeIn').value = ''; setTimeout(() => $('#codeIn').focus(), 50); };
  window.joinGo = () => { const c = $('#codeIn').value.trim().toUpperCase(); if (c.length !== 4) { toast(t('codeHint')); return; } actx(); netConnect(() => sendRaw({ t: 'join', code: c, g: GAME_ID }), offlineMsg); };
  $('#bJoinGo').onclick = window.joinGo; $('#bJoinX').onclick = () => { hideAll(); show('#sMenu', true); sfx('click'); };
  $('#bStart').onclick = hostStartMatch; $('#bLeave').onclick = () => { sfx('click'); leaveToMenu(); };
  $('#bCopy').onclick = () => { let link = location.origin + location.pathname + '?room=' + NET.code; try { const k = sdk(); if (k && k.game.inviteLink) link = k.game.inviteLink({ roomId: NET.code }) || link; } catch (e) {} try { navigator.clipboard.writeText(link); toast(t('copied')); } catch (e) { toast(link); } };
  $('#bSkins').onclick = () => { sfx('click'); renderSkins(); show('#sSkins', true); }; $('#bSkinsX').onclick = () => { show('#sSkins', false); sfx('click'); };
  $('#bHow').onclick = () => { sfx('click'); show('#sHow', true); }; $('#bHowX').onclick = () => { show('#sHow', false); sfx('click'); };
  $('#bLang').onclick = () => setLang(LANG === 'es' ? 'en' : 'es'); $('#bDiff').onclick = () => { SV.diff = ((SV.diff | 0) + 1) % 3; save(); sfx('click'); applyTexts(); }; $('#bLang2').onclick = () => setLang(LANG === 'es' ? 'en' : 'es');
  $('#bSnd').onclick = toggleSnd; $('#bSnd2').onclick = toggleSnd; $('#bPause').onclick = pauseGame; $('#bResume').onclick = resumeGame; $('#bQuit').onclick = () => { show('#sPause', false); afterMatch(leaveToMenu); };
  $('#bX2').onclick = () => { $('#bX2').disabled = true; showAd('rewarded', () => { SV.coins += window.__lastCoins || 0; save(); menuStats(); $('#resCoins').textContent = '+' + (window.__lastCoins * 2) + ' 🪙'; sfx('coin'); }, () => { $('#bX2').disabled = false; }); };
  $('#bAgain').onclick = () => afterMatch(() => { if (mode === 'solo') { hideAll(); startSolo(); } else leaveToMenu(); });
  $('#bMenu').onclick = () => afterMatch(leaveToMenu);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); if (state === 'playing' && mode === 'solo') pauseGame(); } }); window.addEventListener('pagehide', save);
  hideAll(); show('#sMenu', true); $('#loading').remove(); try { const k = sdk(); if (k) k.game.loadingStop(); } catch (e) {}
  if (!SV.seen) { SV.seen = 1; save(); show('#sHow', true); }
  const room = (CG.invite || urlParam('room') || '').toUpperCase().slice(0, 4); if (room.length === 4) { actx(); netConnect(() => sendRaw({ t: 'join', code: room, g: GAME_ID }), offlineMsg); }
  requestAnimationFrame((t0) => { lastT = t0; loop(t0); });
  window.__bo = { S: () => state, mode: () => mode, sim: () => sim, view: () => curView, NET, startSolo, hostStartMatch, setInput: (x, y) => { keys.__x = x; keys.__y = y; } };
}
main();
