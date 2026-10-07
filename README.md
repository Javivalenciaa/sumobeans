# Flag Fury

3v3 first-person Capture the Flag arena (single HTML file, Three.js inlined). Swords, spears, crossbows, 4 maps, local / public / private multiplayer.

- `index.html` - TEST build for GitHub Pages (also runs on *.github.io).
- `release/FlagFury-crazygames.zip` - FINAL build for CrazyGames (sitelocked to CrazyGames domains), plus covers, preview videos, privacy policy, terms and listing text.
- `src/` + `build.py` (+ `three.min.js`) - sources. `python build.py` makes the release build, `python build.py --test` the Pages test build.
- `server/` and `docs/SERVER.md` - relay server and deploy notes.
