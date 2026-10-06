# Relay server (shared with Sumo Beans)
`server/server.js` is the same relay used by Sumo Beans, with one backward-compatible change: rooms carry a game id (`g`),
so a "quick match" or a room code from one game never connects to the other. Old Sumo Beans clients send no `g` and keep working.

## Update the existing relay (the one at wss://34-28-108-52.sslip.io)
1. Copy `server/server.js` over the one running on that machine (same folder as the old file).
2. Restart it (`sudo systemctl restart <your-service>` or `pm2 restart all`, whatever you used).
3. Environment: `ALLOWED_ORIGINS=crazygames.com` is enough for production. To test from GitHub Pages add `javivalenciaa.github.io`
   (comma separated); localhost is always allowed.

## Test locally
`cd server && npm install && PORT=8080 ALLOWED_ORIGINS='*' node server.js`, then open `index.html` from a local web server
(it uses `ws://localhost:8080` automatically on localhost), or add `?server=ws://localhost:8080`.
