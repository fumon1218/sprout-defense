# Canonical asset upload manifest

Source: tower_defense_game_image_assets.xlsx / 01_전체자산목록

- Spreadsheet data rows: 166 (rows 2–167; row 1 is header)
- Library image files currently discovered: 144
- Mapping coverage: 166/166
- Important: several library PNGs are composite sheets containing multiple canonical assets, so library file count is not the same as canonical asset count.

## Canonical GitHub folders
- 01 maps: assets/maps, assets/tiles
- 02 towers: assets/towers
- 03 heroes/allies: assets/heroes, assets/units
- 04 enemies: assets/enemies
- 05 bosses: assets/bosses
- 06 projectiles/skills: assets/projectiles, assets/skills
- 07 effects: assets/vfx
- 08 environment: assets/environment
- 09 UI/HUD: assets/ui
- 10 icons: assets/icons
- 11 world/menu: assets/menu
- 12 animation: assets/animations

## Upload rule
A row is complete only when its individual canonical image/atlas exists in GitHub. A composite source sheet does not count as multiple uploaded runtime assets merely because it is mapped.

## Current repair action
All 144 Library images were materialized for classification. Composite sheets are to be split/exported using the Excel canonical filenames before GitHub binding.
