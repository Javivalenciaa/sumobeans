# Flag Fury online (relay server)

Flag Fury uses the same relay as Sumo Beans / Bumper Orbs (`server/server.js`), with one backward-compatible change:
per-game room settings (`GAME_CFG`). The game id sent by the client is still `banderazo` (internal name): rooms of **6 players**
and a **6 s** public-match wait (then bots fill the empty slots). Other games keep 5 players / 15 s. Max message size is 16 KB.

## Deploy WITHOUT touching `main` (Google Cloud VM created with server/deploy/setup.sh)
```
cd /opt/sumobeans
sudo git fetch origin banderazo
sudo git checkout origin/banderazo -- server/server.js server/package.json
sudo systemctl restart blobsumo
sudo systemctl status blobsumo --no-pager
```
(`ALLOWED_ORIGINS` already has `crazygames.com,javivalenciaa.github.io`.)

## How the game uses it
- Host-authoritative: the first player in a room simulates the match (bots included) and sends snapshots at 15 Hz.
- Other players send their position and inputs at 30 Hz; hits, flags, pickups and rewards are decided by the host.
- If the server is unreachable, public play falls back to a match against bots.
- Test locally: `cd server && npm install && PORT=8080 ALLOWED_ORIGINS='*' node server.js`, open the game on localhost
  (it connects to `ws://localhost:8080`) or add `?server=ws://host:port`.
- Private rooms: share the 4-letter code or the invite link (`?room=ABCD`, also wired to the CrazyGames invite link).
