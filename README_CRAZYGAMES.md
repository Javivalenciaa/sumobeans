# Blob Sumo 3D -> CrazyGames

## Archivos
- `index.html` (el juego, se sube a mano, ver abajo)
- `server/` relay online (Node + ws), desplegable en Render directamente desde este repo

## Probar en local
1. `cd server && npm install && npm start` (puerto 8080)
2. En index.html, antes de `<script type="module">`, anade: `<script>window.BLOB_NET_URL='ws://localhost:8080'</script>`
3. Sirve la carpeta (`npx serve .`) y abre dos pestanas: ONLINE > CREAR SALA / UNIRSE CON CODIGO.
4. Anade `?dev=1` a la URL para empezar con 1000 monedas.

## Publicar el servidor (Render)
1. New > Web Service > este repo. Root directory: `server`. Build: `npm install`. Start: `npm start`.
2. Variable `ALLOWED_ORIGINS=crazygames.com`.
3. Pon la URL `wss://tu-app.onrender.com` en index.html (sustituye `wss://CAMBIA-ESTO.onrender.com`).

## Antes de enviar a CrazyGames
- Descarga `three.module.js` v0.160.0 junto a index.html y cambia el importmap a `./three.module.js`.
- Cambia nombre y aspecto de Tronco y Tiburon (parecen memes conocidos; CrazyGames pide contenido original).
- ZIP con index.html en la raiz y subida en developer.crazygames.com (Basic Launch primero).
