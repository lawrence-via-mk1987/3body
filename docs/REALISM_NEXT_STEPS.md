# Realism — what’s next (after Phases 1–4)

Phases **1–4** of `REALISM_REMAKE_PLAN.md` are shipped in code (procedural landmarks, humanoids, era dressing, desktop SSAO, clouds, collision). This doc is the **recommended order** for the next visual wins without changing gameplay rules.

## Shipped (5a / 5b partial)

- **Triplanar** dust/clay on **steep** trench walls (terrain shader blends planar ↔ triplanar by slope).
- **Tri-solar** patchy warm ground tint (`uTriSolarBlend`); flying star uses a lighter mix.
- **Flying star** sun disk scale increased (dominant red sun reads enormous at the horizon).
- **Contact shadows** under predictor and grove keeper (`contactShadow.ts`).
- **Stable grove pool** glossier (lower roughness, stronger env reflection).

## Principles

- **Phone first:** every step must stay playable at ~30 fps on a recent iPhone; desktop gets extras (SSAO, heat haze, richer music arpeggio).
- **Landmarks over scatter:** one great pit/dome/grove reads better than ten generic props.
- **No drama assets:** original silhouettes only; no TV poster art or OST.

## Phase 5a — Terrain & contact (code-only, small download)

| Item | Why |
|------|-----|
| **Triplanar** dust/rock on steep trench walls | Stops “stretched paint” on cliffs; biggest ground realism gap left in Phase 1 follow-ups |
| **Soft contact shadows** under props (blob AO or baked vertex) | Grounding at pit rim, cart wheels, NPC feet |
| **Puddle/reflection** in stable grove (planar reflection or fake glossy plane) | Stable vs chaos contrast in one screenshot |

## Phase 5b — Sky & light (code-only)

| Item | Why |
|------|-----|
| **Phase-tuned sun disk size** (flying star = huge red limb) | Matches story beats without new meshes |
| **Secondary sun tint on terrain** (existing extra lights; tune colors) | Tri-solar “mixed shadow color” from the plan |
| **Optional desktop grain/vignette** (very light post pass) | Cinematic without Unreal |

## Phase 5c — Optional authored art (larger effort)

| Item | Why |
|------|-----|
| **One glTF landmark** (dehydration pit OR observatory) | Same `landmarks.ts` triggers; swap builder behind `Ruins` |
| **KTX2 + Draco** for that mesh only | Keep Pages under ~25 MB total |
| **Single humanoid glTF** with idle | Replace `buildHumanoidNpc` mesh; keep talk radii |

## Phase 5d — Ship & measure

- Frame time on Safari iOS after each sub-phase  
- Update README screenshots (chaos vs stable grove, pit registrar distance)  
- Remove duplicate prototype builders only when glTF is default  

## Not pursuing (unless web budget fails)

- Second engine (Unity/Unreal)  
- Full open-world scale-up  
- Three shadow-casting suns (mobile cost)  

## Suggested sequence

1. **5a triplanar cliffs** + contact shadow tweak  
2. **5b flying-star sun scale** + tri-solar ground tint polish  
3. **5c one glTF pit** if you commission or build art  
4. **5d perf pass** and README  

Music (procedural) is tracked in `docs/JAPANESE_AND_MUSIC_PLAN.md` Part B; **M1.5** (phase tone + stings) ships in code alongside this doc.
