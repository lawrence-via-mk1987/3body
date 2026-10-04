# Performance notes (Safari iOS first)

Trisolarian Survival targets **~30 fps on a recent iPhone** in the dehydration pit / registrar area. Desktop adds SSAO, heat haze, bloom, and richer music arpeggio.

## Quality tiers

Resolved in `src/platform/renderQuality.ts` from `deviceProfile` (`mobile` → phone, `tablet`, else desktop).

| Setting | Phone | Tablet | Desktop |
|--------|-------|--------|---------|
| Pixel ratio cap | 1.35 | 1.75 | 2 |
| Terrain segments | 144 | 224 | 256 |
| Ground/prop texture size | 512 | 1024 | 1024 |
| Grove grass blades | 140 | 360 | 700 |
| SSAO | off | off | on |
| PMREM rebake min interval | 3.5 s | 2 s | 1.5 s |
| Music chaos arpeggio | off | on | on |

## Measuring

1. Deploy or run `npm run dev` and open Safari **Web Inspector** → **Timelines** while walking the pit rim and grove.
2. Watch for **PMREM** spikes when the sky palette shifts; phone tier throttles rebakes via `pmremRebakeMinSec`.
3. After realism changes, hard-refresh GitHub Pages (`Cmd+Shift+R`) so cached `dist/` assets update.

## Asset budget

- Pit rim glTF: `public/models/dehydration_pit_rim.gltf` (~52 KB embedded buffer). Regenerate with `npm run bake:pit-gltf`.
- Keep total Pages payload under ~25 MB; prefer procedural terrain/sky over large textures.

## If frame time is still high on phone

- Lower `grassBlades` or `terrainSegments` in the phone tier.
- Disable secondary sun lights (trade tri-solar colour for one fewer directional pass).
- Confirm SSAO is off (`data-ssao` absent on `<body>` for mobile).
