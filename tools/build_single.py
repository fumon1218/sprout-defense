"""Build one self-contained HTML fragment (all CSS, JS, images and GLB models inlined).
Usage: python3 tools/build_single.py <out.html>"""
import base64, glob, json, os, re, sys
def rd(p): return open(p, encoding='utf-8').read()
idx = rd('index.html')
body = re.search(r'<body>(.*?)<script', idx, re.S).group(1)
imgs = {os.path.basename(f)[:-5]: 'data:image/webp;base64,' + base64.b64encode(open(f, 'rb').read()).decode() for f in sorted(glob.glob('assets/img/*.webp'))}
parts = ['<title>새싹맨 디펜스</title>', '<style>' + rd('css/style.css') + '</style>', body,
         '<script>window.IMG_DATA=' + json.dumps(imgs) + ';</script>',
         '<script>' + rd('js/glbview.js') + '</script>', '<script>' + rd('assets/hero/hero_data.js') + '</script>',
         '<script>' + rd('js/game.js') + '</script>']
open(sys.argv[1], 'w', encoding='utf-8').write('\n'.join(parts))
print('written', sys.argv[1], round(os.path.getsize(sys.argv[1]) / 1e6, 2), 'MB')
