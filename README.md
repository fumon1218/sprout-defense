# Sprout Defense

3D tower defense game starring the hero commander **Sprout-man (새싹맨)**.

- **Rules**: classic tower defense (fixed path, build tiles, waves). The hero is placed as a commander with an aura and active skills.
- **Tone**: dark gothic high fantasy.
- **Platforms**: PC / mobile / web.
- **Item grades**: F (common) → E → D → C → B → A → S.

## Asset pipeline
Gemini image → Tripo AI (image to GLB) → optimize → `assets/`

## Layout
```
assets/
  hero/      Sprout-man evolution stages
  weapons/   weapons by grade
  towers/    defense towers
  enemies/   enemy units
  map/       modular map tiles and props
docs/        design notes and prompts
```

## Asset rules
- Only optimized, game-ready models go in `assets/` (target: hero ~10k tris, towers ~5k tris, textures 1024-2048px).
- Raw Tripo/Gemini outputs stay outside the repo.
- Binary assets (`.glb`, `.png`, ...) are stored with Git LFS.
