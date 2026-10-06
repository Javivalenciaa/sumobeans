# Banderazo online (relay server)

Banderazo uses the same relay as Sumo Beans / Bumper Orbs (`server/server.js`), with one backward-compatible change:
per-game room settings (`GAME_CFG`). Banderazo (`g: 'banderazo'`) gets rooms of **6 players** and a **6 s** public-match wait
(then bots fill the empty slots). Other games keep 5 players / 15 s. Max message size is now 16 KB (snapshots).

## Deploy (Google Cloud VM, created with server/deploy/setup.sh)
```
cd /opt/sumobeans && sudo git pull --ff-only
sudo systemctl restart blobsumo
sudo systemctl status blobsumo --no-pager
```
`ALLOWED_ORIGINS` already contains `crazygames.com,javivalenciaa.github.io` (edit `/etc/systemd/system/blobsumo.service`
and `sudo systemctl daemon-reload && sudo systemctl restart blobsumo` if you need to change it).

## How the game uses it
- Host-authoritative: the first player in a room simulates the match (bots included) and sends snapshots at 15 Hz.
- Other players send their position and inputs at 30 Hz; hits, flags, pickups and rewards are decided by the host.
- If the server is unreachable the game falls back to the offline match against bots.
- Test locally: `cd server && npm install && PORT=8080 ALLOWED_ORIGINS='*' node server.js`, open the game on localhost
  (it connects to `ws://localhost:8080`) or add `?server=ws://host:port`.
- Private rooms: share the 4-letter code or the invite link (`?room=ABCD`, also wired to the CrazyGames invite link).
