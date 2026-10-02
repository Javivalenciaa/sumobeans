# Sumo Beans -> CrazyGames

## Archivos
- `index.html` (el juego, se sube a mano, ver abajo)
- `server/` relay online (Node + ws), desplegable en Render directamente desde este repo

## Probar en local
1. `cd server && npm install && npm start` (puerto 8080)
2. En index.html, antes de `<script type="module">`, anade: `<script>window.BLOB_NET_URL='ws://localhost:8080'</script>`
3. Sirve la carpeta (`npx serve .`) y abre dos pestanas: ONLINE > CREAR SALA / UNIRSE CON CODIGO.

## Calidad / integracion CrazyGames
- Musica procedural (menu, partida y tramo final) y efectos; ajustes de musica/sonidos en el menu y en pausa (se guardan).
- Menu de pausa (boton arriba a la derecha, Esc o al salir de la pestana), tutorial "Como jugar" la primera vez, cuenta atras 3-2-1 en cada ronda.
- SDK: loadingStart/Stop, gameplayStart/Stop correctos (tambien al pausar/salir), anuncios midgame/rewarded con audio silenciado, idioma segun el navegador/CrazyGames (ES/EN).
- Calidad adaptativa: si los fps caen baja la resolucion y luego quita sombras.
- Partidas de 5 jugadores (tu + 4 bots; online hasta 5). Todos empiezan en un circulo en el centro del mapa (nadie aparece junto al borde).
- Mando (gamepad): stick mover, A saltar, X golpear, B agarrar, Start pausa; al acabar una partida: Jugar otra vez / Menu.
- Skins originales: Leno (mazo de madera) y Aleta (tiburon con zapatillas naranjas).

## Mapas (salen al azar, sin repetir hasta jugarlos todos; en local y online)
0 Jardin de hilo · 1 Canon de retales · 2 Gruas del cielo · 3 Nevada de algodon · 4 Fabrica de juguetes · 5 Volcan de lana · 6 Camiones sin fin · 7 Azotea de carton · 8 Barco de papel · 9 Discoteca de fieltro
- 10 **Caos en la Cocina Gigante**: vitroceramica que se calienta (quema y al final lanza por los aires a quien la pisa), batidora de varillas que baja y succiona con un vortice, charcos de miel (frenan y hacen dificil que te empujen), salero/molinillo/taza/tarro como obstaculos.
- 11 **Estacion Espacial Retro-Futurista**: baja gravedad (saltos altos, empujones mas largos), zonas holograficas de gravedad cero, paneles solares que orbitan y se voltean; si caes por el borde tienes un salto de rescate.
- 12 **Templo Maya del Tesoro Olvidado**: piramide de 3 niveles con escaleras (los muros se trepan saltando), la lava del foso sube y se come los niveles bajos, losas sueltas con trampa de lanzas, musgo resbaladizo arriba.

## Publicar el servidor (Render)
1. New > Web Service > este repo. Root directory: `server`. Build: `npm install`. Start: `npm start`.
2. Variable `ALLOWED_ORIGINS=crazygames.com`.
3. Pon la URL `wss://tu-app.onrender.com` en index.html (sustituye `wss://CAMBIA-ESTO.onrender.com`).

## Antes de enviar a CrazyGames
- Descarga `three.module.js` v0.160.0 junto a index.html y cambia el importmap a `./three.module.js`.
- Cambia nombre y aspecto de Tronco y Tiburon (parecen memes conocidos; CrazyGames pide contenido original).
- ZIP con index.html en la raiz y subida en developer.crazygames.com (Basic Launch primero).
