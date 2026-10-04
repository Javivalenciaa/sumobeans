#!/usr/bin/env python3
"""Builds dist/neon-horde-crazygames.zip and checks CrazyGames technical requirements."""
import os, re, zipfile, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(root, 'index.html'), encoding='utf8').read()
bad = []
for u in sorted(set(re.findall(r'https?://[A-Za-z0-9./_?=&%-]+', html))):
    if not u.startswith('https://sdk.crazygames.com/'): bad.append('external URL: ' + u)
for n in ['crazygames-sdk-v3.js', 'loadingStart', 'loadingStop', 'gameplayStart', 'gameplayStop', 'requestAd', 'rewarded', 'midgame', 'muteAudio', 'happytime', '.data']:
    if n not in html: bad.append('missing: ' + n)
if re.search(r'<a\s[^>]*href=["\']https?:', html): bad.append('external links')
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
out = os.path.join(root, 'dist', 'neon-horde-crazygames.zip')
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z: z.writestr('index.html', html)
print(out, '%d KB html, %d KB zip' % (len(html) // 1024, os.path.getsize(out) // 1024))
if bad: print('PROBLEMS:\n  ' + '\n  '.join(bad)); sys.exit(1)
print('OK: requirements check passed')
