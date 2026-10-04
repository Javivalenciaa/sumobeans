# Wild Horde
2D survivors-like for CrazyGames (single `index.html`, all art procedurally painted, no external assets).
Move (WASD / arrows / touch joystick); attacks are automatic. Level up, pick weapons and passives, beat the Warden (4:00) and the Hollow King (7:00).
- Meta progression: gold buys permanent upgrades and unlocks heroes.
- Ads: midgame between runs (≥100 s apart); rewarded only on request (Revive, Gold ×2, Reroll).
- Build: `cat src/part1.html src/part2.js src/art.js src/part3.js src/render.js src/part5.js > index.html` (parts are the source), `python3 tools/package_crazygames.py` builds the zip; tests in `tools/test*.js`.
