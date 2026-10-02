# Stage 1 Asset Drop Map

새 이미지 파일을 아래 경로/파일명으로 넣으면 게임이 자동으로 우선 사용합니다.
파일이 없으면 기존 `assets/img/*.webp` 자산으로 fallback 됩니다.

## Map / props
- `assets/ui/build-pad.png`
- `assets/props/kingdom-gate.png`
- `assets/maps/grassland/road-straight.png`
- `assets/props/grassland-decor.png`

## Towers
- `assets/towers/archer/archer-l1.png`
- `assets/towers/barracks/barracks-l1.png`
- `assets/towers/mage/mage-l1.png`
- `assets/towers/artillery/artillery-l1.png`

## Enemies
- `assets/enemies/goblin-scout.png`
- `assets/enemies/orc-warrior.png`
- `assets/enemies/fantasy-bat.png`
- `assets/enemies/mountain-troll.png`
- `assets/enemies/boss-ogre-king.png`

## Hero
- `assets/heroes/knight-hero.png`

## Next import batch
After the first visual pass, add:
- armored orc
- shaman
- projectile set
- hit/explosion VFX
- fantasy HUD
- upgrade panel
- victory/defeat panels
- Stage 1 full grassland battlefield background

## Rule
Do not rename working legacy files yet. New assets override them safely through the fallback loader.
