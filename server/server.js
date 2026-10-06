'use strict';
/* Relay compartido (Sumo Beans y Bumper Orbs): cada partida lleva un identificador de juego (g) para no mezclar jugadores de juegos distintos.
   Blob Sumo relay: el anfitrion (navegador) simula la partida; este servidor solo reenvia mensajes,
   organiza las partidas publicas (cuenta atras y arranque) y traspasa el anfitrion si se va. */
const http = require('http');

const MAX_PLAYERS = 5;
const MAX_MSG = 8192;
const RATE_LIMIT = 150;
const PUB_WAIT_MS = +process.env.PUB_WAIT_MS || 15000;   // espera hasta rellenar con bots
const FULL_GRACE_MS = +process.env.FULL_GRACE_MS || 2000; // si se llena, arranca en 2 s
const GO_TIMEOUT_MS = +process.env.GO_TIMEOUT_MS || 10000; // si el anfitrion no arranca, se cierra la sala
const ALLOWED = (process.env.ALLOWED_ORIGINS || 'crazygames.com').split(',').map(s => s.trim()).filter(Boolean);
const rooms = new Map();
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const log = (...a) => { if (!process.env.QUIET) console.log(new Date().toISOString().slice(11, 19), ...a); };

function newCode() {
  for (let n = 0; n < 50; n++) {
    let c = '';
    for (let i = 0; i < 4; i++) c += ALPHA[Math.floor(Math.random() * ALPHA.length)];
    if (!rooms.has(c)) return c;
  }
  return null;
}
const send = (ws, o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };
function originOk(origin) {
  if (!ALLOWED.length || ALLOWED.includes('*')) return true;
  if (!origin) return true;
  try {
    const h = new URL(origin).hostname;
    return ALLOWED.some(a => h === a || h.endsWith('.' + a) || h === 'localhost' || h === '127.0.0.1');
  } catch (e) { return false; }
}
function closeRoom(room, why) {
  log('room', room.code, 'closed:', why);
  for (const c of room.clients.values()) { send(c, { t: 'closed' }); c.room = null; try { c.close(); } catch (e) {} }
  if (room.host) { room.host.room = null; if (why === 'zombie') { try { room.host.close(); } catch (e) {} } }
  rooms.delete(room.code);
}
// El anfitrion se fue en mitad de una partida: el jugador con menor id pasa a ser el nuevo anfitrion.
function migrateHost(room) {
  let nh = null;
  for (const c of room.clients.values()) if (!nh || c.pid < nh.pid) nh = c;
  room.clients.delete(nh.pid);
  room.host = nh;
  send(nh, { t: 'host' });
  for (const c of room.clients.values()) { send(nh, { t: 'peer', id: c.pid, on: 1 }); send(c, { t: 'hostchanged', id: nh.pid }); }
  log('room', room.code, 'host migrated to player', nh.pid, '; players', room.clients.size + 1);
}
function leave(ws) {
  const room = ws.room;
  if (!room) return;
  ws.room = null;
  if (room.host === ws) {
    if (!room.joinable && room.clients.size > 0) migrateHost(room); // partida en curso: continua
    else closeRoom(room, 'host left');
  } else {
    room.clients.delete(ws.pid);
    send(room.host, { t: 'peer', id: ws.pid, on: 0 });
    log('room', room.code, 'player', ws.pid, 'left; players', room.clients.size + 1);
  }
}
const gameId = (m) => (typeof m.g === 'string' && /^[a-z0-9-]{1,24}$/.test(m.g) ? m.g : 'blob'); // sin g = cliente antiguo (Sumo Beans)
function createRoom(ws, pub, g) {
  const code = newCode();
  if (!code) return send(ws, { t: 'error', msg: 'full' });
  const room = { g: g || 'blob', code, host: ws, clients: new Map(), nextId: 1, joinable: true, pub: !!pub, created: Date.now(), deadline: Date.now() + PUB_WAIT_MS, go: false, goAt: 0, lastCd: -1 };
  rooms.set(code, room); ws.room = room; ws.pid = 0;
  send(ws, { t: 'created', code, id: 0, pub: room.pub });
  log('room', code, room.pub ? 'PUBLIC' : 'private', 'created');
}
function joinRoom(ws, room) {
  ws.pid = room.nextId++; ws.room = room; room.clients.set(ws.pid, ws);
  send(ws, { t: 'joined', code: room.code, id: ws.pid, pub: room.pub });
  send(room.host, { t: 'peer', id: ws.pid, on: 1 });
  if (room.pub && room.clients.size + 1 >= MAX_PLAYERS) room.deadline = Math.min(room.deadline, Date.now() + FULL_GRACE_MS);
  log('room', room.code, 'player', ws.pid, 'joined; players', room.clients.size + 1);
}
function members(room) { return [room.host, ...room.clients.values()]; }
function tickRooms() {
  const now = Date.now();
  for (const room of [...rooms.values()]) {
    if (!room.pub) continue;
    if (!room.go) {
      if (!room.joinable) continue; // el anfitrion ya arranco por su cuenta
      const rem = room.deadline - now;
      const s = Math.max(0, Math.ceil(rem / 1000));
      if (s !== room.lastCd) { room.lastCd = s; for (const w of members(room)) send(w, { t: 'cd', s }); }
      if (rem <= 0) { room.go = true; room.goAt = now; send(room.host, { t: 'go' }); log('room', room.code, 'GO with', room.clients.size + 1, 'players'); }
    } else if (room.joinable && now - room.goAt > GO_TIMEOUT_MS) {
      closeRoom(room, 'zombie');
    }
  }
}
function attach(wss) {
  wss.on('connection', (ws, req) => {
    if (!originOk(req && req.headers && req.headers.origin)) { ws.close(1008, 'origin'); return; }
    ws.room = null; ws.pid = -1; ws.alive = true; ws.tokens = RATE_LIMIT; ws.refill = Date.now();
    ws.on('pong', () => { ws.alive = true; });
    ws.on('message', (raw) => {
      const now = Date.now();
      ws.tokens = Math.min(RATE_LIMIT, ws.tokens + (now - ws.refill) * RATE_LIMIT / 1000); ws.refill = now;
      if (--ws.tokens < 0) return;
      if (raw.length > MAX_MSG) return;
      let m; try { m = JSON.parse(raw); } catch (e) { return; }
      if (!m || typeof m.t !== 'string') return;
      switch (m.t) {
        case 'ping': break;
        case 'create': if (!ws.room) createRoom(ws, false, gameId(m)); break;
        case 'quick': {
          if (ws.room) return;
          let best = null;
          for (const r of rooms.values()) {
            if (!r.pub || !r.joinable || r.go || r.g !== gameId(m)) continue;
            if (r.clients.size + 1 >= MAX_PLAYERS) continue;
            if (r.deadline - now < 2500) continue;
            if (!best || r.clients.size > best.clients.size || (r.clients.size === best.clients.size && r.created < best.created)) best = r;
          }
          if (best) joinRoom(ws, best); else createRoom(ws, true, gameId(m));
          break;
        }
        case 'join': {
          if (ws.room) return;
          const room = rooms.get(String(m.code || '').toUpperCase());
          if (!room || room.g !== gameId(m)) return send(ws, { t: 'error', msg: 'noroom' });
          if (!room.joinable) return send(ws, { t: 'error', msg: 'busy' });
          if (room.clients.size + 1 >= MAX_PLAYERS) return send(ws, { t: 'error', msg: 'full' });
          joinRoom(ws, room);
          break;
        }
        case 'joinable': if (ws.room && ws.room.host === ws) ws.room.joinable = !!m.v; break;
        case 'h': if (ws.room && ws.room.host !== ws) send(ws.room.host, { t: 'm', from: ws.pid, d: m.d }); break;
        case 'a': if (ws.room && ws.room.host === ws) for (const c of ws.room.clients.values()) send(c, { t: 'm', from: 0, d: m.d }); break;
      }
    });
    ws.on('close', () => leave(ws));
    ws.on('error', () => leave(ws));
  });
  const iv = setInterval(() => {
    for (const ws of wss.clients) { if (!ws.alive) { try { ws.terminate(); } catch (e) {} continue; } ws.alive = false; try { ws.ping(); } catch (e) {} }
  }, 20000);
  const iv2 = setInterval(tickRooms, 250);
  if (iv.unref) iv.unref();
  if (iv2.unref) iv2.unref();
  return wss;
}
module.exports = { attach, rooms };

if (require.main === module) {
  const { WebSocketServer } = require('ws');
  const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('blob-sumo relay ok'); });
  attach(new WebSocketServer({ server, maxPayload: MAX_MSG }));
  const port = process.env.PORT || 8080;
  server.listen(port, () => console.log('relay listening on ' + port));
}
