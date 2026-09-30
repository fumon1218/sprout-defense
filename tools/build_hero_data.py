"""Embed the hero GLB files as base64 so the game also runs when index.html is opened directly (file://).
Usage: python3 tools/build_hero_data.py   (run again after replacing assets/hero/hero_stage*.glb)"""
import base64, json
out = {n: base64.b64encode(open(f'assets/hero/hero_stage{n}.glb', 'rb').read()).decode() for n in (1, 2, 3)}
open('assets/hero/hero_data.js', 'w').write('window.HERO_GLB = ' + json.dumps(out) + ';\n')
print('hero_data.js written')
