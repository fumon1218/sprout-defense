# Sprout Defense (새싹맨 디펜스)

3D tower defense prototype starring the hero commander **Sprout-man (새싹맨)**.
Dark gothic high fantasy, classic tower defense rules, isometric view.

## Run
Just open `index.html` in a browser (double-click). No server, build step or external libraries needed.
Optional: `python3 -m http.server 8000` and open http://localhost:8000.

The hero models are embedded in `assets/hero/hero_data.js` so the game also works from `file://`.
After replacing `assets/hero/hero_stage*.glb`, run `python3 tools/build_hero_data.py`.
`python3 tools/build_single.py out.html` builds a single self-contained page. The hero is rendered from the GLB files with a small built-in WebGL viewer (`js/glbview.js`); if WebGL is unavailable the 2D sprite is used.

## How to play
- Pick a tower (1-4 keys or the bottom bar), then click a glowing build pad.
- Click a built tower to upgrade (Lv.3 max) or sell.
- Sprout-man is the commander: towers inside his green aura get +25% damage.
- Skills: **Q** Photosynthesis Burst (area damage), **W** Vine Barrier (root enemies), **E** Bloom of Life (restore tree HP).
- Space starts the next wave. 10 waves; Sprout-man evolves at wave 4 (sapling → young tree) and wave 7 (ancient tree).

## Layout
```
index.html, css/, js/     game (game.js) and mini GLB viewer (glbview.js)
assets/img/               transparent WebP sprites (towers, enemies, map tiles, hero art)
assets/hero/              Sprout-man 3D models, reduced for real-time use (~20k triangles, ~2 MB each)
tools/                    process_images.py (PNG -> WebP sprites), build_hero_data.py, build_single.py
```

## Asset pipeline
Gemini image → Tripo AI (image to GLB) → reduce → `assets/`.
- Keep raw Tripo/Gemini output outside the repo, or under `assets/source/` (stored with Git LFS).
- Game-ready targets: hero ~10-20k triangles, towers ~5k, textures 1024-2048px.

## Status
Prototype. The hero GLBs were reduced with a simple vertex-clustering script and show cracks/rough surfaces; re-export them from Tripo (low-poly) or Blender for final quality. Game balance is untuned.
