# Runtime integration status

Source of truth: `tower_defense_game_image_assets.xlsx` (166 rows)

## Definition of done
An Excel row is counted as runtime-complete only when:
1. its approved library artwork is represented by a canonical GitHub runtime asset (individual file or documented atlas region);
2. game code references the canonical runtime asset where the row has a gameplay role;
3. sprite/atlas QA rejects neighboring fragments and clipped silhouettes;
4. deployment/runtime checks pass.

## Current repository audit
- Excel mapping: 166 / 166
- Current binary/runtime files under `assets/`: 38
- Missing asset-path references in current `game.js`: 0
- Distinct asset paths currently referenced by `game.js`: 26
- Demo tower pads validated: 4 / 4
- Runtime registry added for staged 166-row integration
- Stage 1 build-pad selection/range alignment: fixed
- Latest Pages deployment before this audit: success
- Full 166-row runtime completion: **not yet complete**

## Batch order
1. Tower levels and tower combat animation
2. Stage 1 enemy set + boss
3. Projectiles / impact VFX
4. Heroes / friendly units
5. Environment props
6. HUD / icons / menu / world map
7. Remaining biome maps
8. Animation sheets and contamination QA
9. Full 10-wave regression test and final 166/166 audit

Do not report 100% until every row satisfies the definition above.
