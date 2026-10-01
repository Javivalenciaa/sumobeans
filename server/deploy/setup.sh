#!/usr/bin/env bash
# Uso: curl -fsSL https://raw.githubusercontent.com/Javivalenciaa/sumobeans/main/server/deploy/setup.sh | sudo bash -s -- 34-28-108-52.sslip.io
set -euo pipefail

DOMAIN="${1:?Falta el dominio. Ejemplo: sudo bash setup.sh 34-28-108-52.sslip.io}"
REPO="https://github.com/Javivalenciaa/sumobeans"
APP=/opt/sumobeans
ORIGINS="crazygames.com,javivalenciaa.github.io"

echo "== 1/5 Paquetes base"
# Repo antiguo de Caddy (clave caducada): se elimina si quedo de un intento anterior
rm -f /etc/apt/sources.list.d/caddy-stable.list /usr/share/keyrings/caddy-stable-archive-keyring.gpg
apt-get update || true
apt-get install -y git curl
if ! command -v node >/dev/null 2>&1; then apt-get install -y nodejs npm; fi
if ! command -v npm >/dev/null 2>&1; then echo "ERROR: node esta instalado pero falta npm"; exit 1; fi
NODE_BIN="$(command -v node)"
echo "node $($NODE_BIN -v) / npm $(npm -v)"

echo "== 2/5 Caddy (HTTPS automatico, paquete de Debian)"
if ! command -v caddy >/dev/null 2>&1; then apt-get install -y caddy; fi
caddy version

echo "== 3/5 Codigo del servidor"
id -u blobsumo >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin blobsumo
if [ -d "$APP/.git" ]; then git -C "$APP" pull --ff-only; else git clone "$REPO" "$APP"; fi
(cd "$APP/server" && npm install --omit=dev)
chown -R blobsumo:blobsumo "$APP"

echo "== 4/5 Servicio systemd (arranca solo y se reinicia si falla)"
cat > /etc/systemd/system/blobsumo.service <<EOF
[Unit]
Description=Blob Sumo relay
After=network.target

[Service]
User=blobsumo
WorkingDirectory=$APP/server
Environment=PORT=8080
Environment=ALLOWED_ORIGINS=$ORIGINS
ExecStart=$NODE_BIN server.js
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now blobsumo
systemctl restart blobsumo

echo "== 5/5 Caddy: https://$DOMAIN -> localhost:8080"
cat > /etc/caddy/Caddyfile <<EOF
$DOMAIN {
  reverse_proxy localhost:8080
}
EOF
systemctl enable caddy
systemctl restart caddy

sleep 5
echo
echo "Estado del servidor:"; systemctl --no-pager --lines=3 status blobsumo || true
echo "Prueba (debe decir 'blob-sumo relay ok'):"
curl -s "https://$DOMAIN" || echo "(aun no responde: espera 30 s y repite: curl https://$DOMAIN)"
echo
echo "Listo. URL para el juego: wss://$DOMAIN"
