# 2D Animation Asset Pipeline

## Goal
Keep classic 2D motion smooth while preventing neighboring sprite fragments from leaking into frames.

## Mandatory cleanup order
1. Use transparent PNG/WebP source.
2. Detect the actual occupied horizontal range for each animation row.
3. Split frames at alpha-density valleys, not by naive full-width division.
4. Remove detached components that belong to neighboring frames.
5. Preserve the character body, connected weapon/shield/staff, and intentional attack FX.
6. Add transparent safety padding around every frame.
7. Normalize every frame to the same canvas size.
8. Ground units use a fixed bottom-center foot anchor.
9. Flying units use a fixed body-center anchor.
10. Preview every animation as both a contact sheet and a looping GIF before shipping.

## Runtime timing
- idle: 6–8 fps
- walk: 10–12 fps
- attack: 12–16 fps
- hit: 12–16 fps, short
- death: 8–12 fps, no loop
- fly: 10–14 fps

## Current barracks atlas
Atlas layout:
- row 0: idle, 4 frames
- row 1: walk, 8 frames
- row 2: attack, 6 frames
- row 3: death, 7 frames

Runtime path:
`assets/units/knight-animation-atlas.webp`

Frame size:
`72 x 72`

The runtime falls back to the static soldier sprite if the atlas is unavailable.

## QA rejection rules
Reject and re-clean an asset when:
- another character's weapon, limb, armor, wing, or FX appears in the frame;
- a weapon/effect is clipped by the canvas edge;
- feet jump vertically between walk frames;
- body scale changes visibly between adjacent frames;
- attack FX begins in a different anchor position than the attacker;
- death animation snaps to a new position.

## Design rule
Prefer real sequential frames over procedural bobbing whenever a suitable sprite sheet exists. Procedural motion is only a fallback or a subtle secondary layer.
