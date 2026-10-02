# Grassland Kingdom — Stage 1 MVP

## Goal
Turn the existing Sprout Defense prototype into the first playable fantasy tower-defense stage using the completed asset set.

## Why this path
The current engine already implements the expensive core loop:
- 10-wave progression
- path following and enemy spawning
- tower build pads
- tower placement / upgrade / sell
- ranged and splash projectiles
- slow / DOT effects
- flying enemies
- hero/skill hooks
- boss wave
- win / lose flow
- responsive HUD controls

So Stage 1 will evolve the existing engine instead of rewriting it.

## Stage 1 theme
**Grassland Kingdom**

Visual direction:
- bright green kingdom valley
- winding dirt road
- stone/wood bridges
- blue kingdom banners
- friendly castle destination
- goblin/orc invasion

## MVP tower roles
1. Archer Tower — fast physical single-target
2. Barracks — melee blockers / soldiers
3. Mage Tower — magic damage / armor counter
4. Artillery Tower — slow AoE physical damage

## MVP enemies
1. Goblin Scout — fast / low HP
2. Orc Warrior — standard melee
3. Armored Orc — high physical armor
4. Mountain Troll — high HP / slow
5. Shaman — support enemy
6. Bat — flying
7. Mini-boss — wave 10

## Wave target
10 waves. Introduce one new tactical idea every 1–2 waves.

## Implementation order
1. Keep the current canvas engine and input system.
2. Replace plant-theme gameplay data with fantasy TD data.
3. Define asset filenames and folders before importing images.
4. Wire Archer / Mage / Artillery first.
5. Add Barracks blocker behavior after ranged loop is stable.
6. Replace enemies and rebalance 10 waves.
7. Replace HUD with completed fantasy UI assets.
8. Add one boss and victory/result panel.
9. Optimize tablet rendering and touch targets.
10. Merge to main only after Stage 1 is playable end-to-end.

## Asset folder convention
```
assets/
  maps/grassland/
  towers/archer/
  towers/barracks/
  towers/mage/
  towers/artillery/
  enemies/
  heroes/
  projectiles/
  vfx/
  ui/
  props/
```

## First playable completion criteria
A player can:
- load Stage 1
- place four tower types
- earn/spend gold
- upgrade towers
- fight ground and flying enemies
- survive 10 waves
- fight a boss
- win or lose and restart

## Development rule
Do not over-split the code during MVP. Keep the project simple and GitHub Pages friendly. Refactor only after the first full stage is stable.
