'use strict';
/* Blob Sumo relay: el anfitrion (navegador) simula la partida; este servidor solo reenvia mensajes. */
const http = require('http');

const MAX_PLAYERS = 4;
const MAX_MSG = 8192;
const RATE_LIMIT = 150;
const ALLOWED = (process.env.ALLOWED_ORIGINS || 'crazygames.com').split(',').map(s => s.trim()).filter(Boolean);
const rooms = new Map();
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

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
function leave(ws) {
  const room = ws.room;
  if (!room) return;
  ws.room = null;
  if (room.host === ws) {
    for (const c of room.clients.values()) { send(c, { t: 'closed' }); c.room = null; try { c.close(); } catch (e) {} }
    rooms.delete(room.code);
  } else {
    room.clients.delete(ws.pid);
    send(room.host, { t: 'peer', id: ws.pid, on: 0 });
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
        case 'create': {
          if (ws.room) return;
          const code = newCode();
          if (!code) return send(ws, { t: 'error', msg: 'full' });
          const room = { code, host: ws, clients: new Map(), nextId: 1, joinable: true };
          rooms.set(code, room); ws.room = room; ws.pid = 0;
          send(ws, { t: 'created', code, id: 0 });
          break;
        }
        case 'join': {
          if (ws.room) return;
          const room = rooms.get(String(m.code || '').toUpperCase());
          if (!room) return send(ws, { t: 'error', msg: 'noroom' });
          if (!room.joinable) return send(ws, { t: 'error', msg: 'busy' });
          if (room.clients.size + 1 >= MAX_PLAYERS) return send(ws, { t: 'error', msg: 'full' });
          ws.pid = room.nextId++; ws.room = room; room.clients.set(ws.pid, ws);
          send(ws, { t: 'joined', code: room.code, id: ws.pid });
          send(room.host, { t: 'peer', id: ws.pid, on: 1 });
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
  if (iv.unref) iv.unref();
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
