# Unity fork — milestone checklist

Copy this file into the root of your **`3body-unity`** repository when you create it.  
Source plan: [`docs/PATH_B_UNITY_PLAN.md`](../docs/PATH_B_UNITY_PLAN.md)

---

## U0 — Project foundation

- [ ] Unity repo created (`3body-unity` or equivalent) with Git LFS for art binaries
- [ ] URP or HDRP choice recorded in Unity `README.md`
- [ ] Folder layout: `Assets/_Game/{Scenes,Scripts,Art,Prefabs,UI}`
- [ ] First-person controller in test scene
- [ ] C# enums: `EraKind`, `EraPhase`, `SunId` (match web `src/orbital/types.ts`)
- [ ] Submodule or copy of web `docs/` → `docs/reference/`
- [ ] **Content import:** copy `export/unity-snapshot/` from web repo → `Assets/StreamingAssets/WebReference/`
- [ ] Mood board approved (chaos / stable / flying star / pit / grove)

**Done when:** Sun placeholder moves on celestial sphere using exported `orbital_config.json`.

---

## U1 — Vertical slice

- [ ] Terrain ~500 m (heightmap or Unity Terrain)
- [ ] Landmarks at `landmarks.json` coordinates (greybox OK)
- [ ] `OrbitalDirector.cs` — thaw, stable_golden, flying_star minimum
- [ ] Three sun meshes + sun_a shadows
- [ ] Sky/fog/post from `sky_palettes.json`
- [ ] Spawn drop Y≈12; solid ground while moving/jumping (no transparency flicker)
- [ ] Survival UI (health, hydration, temperature bands)
- [ ] One log interact + panel (`logs/en.json`)
- [ ] Dehydration pit toggle at pit coordinates

**Done when:** 5–10 min loop: land → grove in Stable → read log → survive one Flying Star.

---

## U2 — Production pipeline

- [ ] Blender → Unity asset pipeline documented
- [ ] Baked GI on landmarks; real-time sun for phases
- [ ] Hero meshes (pit / observatory / grove) — import Path A glTF from web `public/assets/`
- [ ] One skinned NPC + idle
- [ ] Era post-processing volumes
- [ ] Volumetric fog with visible horizon line
- [ ] `npm run export:unity` re-run; Unity loads updated JSON without manual edits

**Done when:** Trailer-ready 60 s capture at 1080p.

---

## U3 — Web parity

- [ ] Full phase rotation + Stable Era probability
- [ ] Forecast UI
- [ ] All logs + zh/ja from `logs/*.json`
- [ ] NPCs (registrar, predictor, grove keeper)
- [ ] Journal, checkpoints, meta progression
- [ ] Side-by-side checklist vs web `main`

**Tag:** `parity-web-v1`

---

## U4 — Ship candidate (optional)

- [ ] Windows + macOS standalone builds
- [ ] Settings (quality, bindings, volume)
- [ ] Steam / itch page

---

## Content sync ritual

Whenever web `main` changes tuning or logs:

```bash
cd 3body
npm run export:unity
cp -r export/unity-snapshot/* ../3body-unity/Assets/StreamingAssets/WebReference/
```

Verify `manifest.json` → `gitSha` matches the web commit you intend to port.
