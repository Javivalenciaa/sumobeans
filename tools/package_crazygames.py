#!/usr/bin/env python3
"""Builds dist/bumper-orbs-crazygames.zip and checks CrazyGames technical requirements.
Usage: python3 tools/package_crazygames.py wss://your-relay.example.com   (the multiplayer relay, see docs/SERVER.md)"""
import os, re, zipfile, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
url = sys.argv[1] if len(sys.argv) > 1 else None
html = open(os.path.join(root, 'index.html'), encoding='utf8').read()
if url:
    if not re.match(r'^wss://[A-Za-z0-9.-]+(:\d+)?$', url): sys.exit('The relay must be a secure wss:// address')
    html, n = re.subn(r"wss://34-28-108-52\.sslip\.io", url, html)
    if n == 0: sys.exit('relay marker not found')
bad = []
for u in sorted(set(re.findall(r'https?://[A-Za-z0-9./_?=&%-]+', html))):
    if not u.startswith('https://sdk.crazygames.com/'): bad.append('external URL: ' + u)
for n in ['crazygames-sdk-v3.js', 'loadingStart', 'loadingStop', 'gameplayStart', 'gameplayStop', 'requestAd', 'rewarded', 'midgame', 'muteAudio', 'happytime', 'showInviteButton', 'getInviteParam', '.data']:
    if n not in html: bad.append('missing: ' + n)
if re.search(r'<a\s[^>]*href=["\']https?:', html): bad.append('external links')
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
out = os.path.join(root, 'dist', 'bumper-orbs-crazygames.zip')
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z: z.writestr('index.html', html)
print(out, '%d KB html, %d KB zip' % (len(html) // 1024, os.path.getsize(out) // 1024), '| relay:', url or '(default)')
if bad: print('PROBLEMS:\n  ' + '\n  '.join(bad)); sys.exit(1)
print('OK: requirements check passed')
