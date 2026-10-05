# Path B — Unity production plan

**Status:** approved direction (web demo remains reference on `main`; Unity is the visual + long-term gameplay host).  
**Companion:** [`VISUAL_TARGET_FF8_UNITY_FORK.md`](./VISUAL_TARGET_FF8_UNITY_FORK.md), [`ORBITAL_SIM.md`](./ORBITAL_SIM.md), [`GDD.md`](./GDD.md)

---

## 1. Goal

Build **Trisolarian Survival** in Unity as a **cinematic stylized JRPG environment** (FF7 Remake–tier mood, not MetaHuman photoreal): harsh tri-solar sky, readable ground, authored landmarks, first-person survival loop ported from the web demo.

**Success looks like:**

- One **vertical slice** you would put in a trailer: spawn fall → walk wasteland → **Stable Era** grove pool → read one log → survive one **Flying Star** without the ground vanishing into the sky.
- Orbital rules **match** [`ORBITAL_SIM.md`](./ORBITAL_SIM.md) (same phase names, tuning exported from `src/orbital/config.ts`).
- **Separate repo** with LFS-friendly art; web repo stays the design source of truth until U3 parity.

---

## 2. Non-goals (Path B v1)

- Replacing the Vite/Three.js tree inside this repo.
- Full open world, multiplayer, or combat.
- Licensed drama assets, character likenesses, or novel text beyond fair fan abstraction ([`GDD.md`](./GDD.md)).
- WebGL build as primary ship target (PC/Mac first; console/mobile later).

---

## 3. Repo strategy

| Artifact | Location |
|----------|----------|
| Playable web sketch | `lawrence-via-mk1987/3body` → `main`, GitHub Pages |
| Unity game | **New repo** e.g. `3body-unity` (recommended) or Unity Hub project under `unity/TrisolarianSurvival/` with **Git LFS** |
| Shared design | Copy or **git submodule** `3body/docs/` → `3body-unity/docs/reference/` |
| Narrative / i18n | Export script from web (`logs`, `i18n`, NPC strings) → Unity `StreamingAssets` or CSV |

**Branches (Unity repo):**

- `main` — always buildable vertical slice
- `feature/*` — art or systems
- Tag `sync-orbital-v1` when C# constants match web `ORBITAL_CONFIG` + phase enum

**Web repo after Path B kickoff:**

- Freeze graphics on `main` except bugs and content (logs, copy, orbital tuning).
- Path A milestones remain documented history; no new hero glTF unless needed as **Unity source art**.

---

## 4. Engine choice: URP vs HDRP

| | **URP** | **HDRP** |
|--|---------|----------|
| **Best for** | Broad PC + future console/mobile, faster iteration | Maximum atmosphere, volumetrics, filmic post |
| **Risk** | Less “wow” out of the box | Heavier team, longer bake times, stricter hardware |
| **Recommendation** | **Default for U1–U2** unless you have a dedicated env artist + target RTX-only | Upgrade path in U2 if slice needs volumetric fog / stack LUT |

**Decision gate (U0):** pick URP 17+ LTS or HDRP 17+ LTS and lock in writing. Stylized PBR + baked GI works in both.

---

## 5. Visual target (locked for planning)

From [`VISUAL_TARGET_FF8_UNITY_FORK.md`](./VISUAL_TARGET_FF8_UNITY_FORK.md):

- **Stylized realism** — worn stone, cloth banners, cracked soil, **solid readable ground** (Terrain Layer + mesh decals; no browser SSAO hacks).
- **Era readability** — chaos ochre / stable gold-green / flying-star red; sky and soil **never share the same flat color**.
- **Landmarks as set pieces** — pit, observatory, grove pool (replace procedural `meshKit` boxes).
- **One skinned NPC** in slice (registrar or grove keeper); others billboards or static meshes until U3.

Mood board deliverable (U0): 6–10 frames — chaos spawn trench, tri-solar, stable grove, flying star horizon, pit registrar, UI mock.

---

## 6. Milestones

### U0 — Project foundation (1 sprint)

**Outcomes:**

- [ ] New Unity repo created; `.gitignore` + **Git LFS** for `*.fbx`, `*.psd`, `*.wav`, `*.exr`
- [ ] URP (or HDRP) template, Input System, **first-person controller** (CharacterController or Rigidbody — pick one, document)
- [ ] Folder layout: `Assets/_Game/{Scenes,Scripts,Art,Prefabs,UI}`, `Assets/_ThirdParty`
- [ ] **Orbital spec imported:** C# enums `EraKind`, `EraPhase` mirroring `src/orbital/types.ts`
- [ ] Export **`docs/reference/`** submodule: GDD, ORBITAL_SIM, landmark coordinates (`landmarks.ts` → JSON)
- [ ] Mood board + URP/HDRP decision recorded in repo `README.md`

**Acceptance:** Empty scene, FP walk on a test plane, sun placeholder moves on celestial sphere from pseudocode in ORBITAL_SIM.

---

### U1 — Vertical slice (core fantasy)

**World:**

- [ ] Terrain **500×500 m** (Unity Terrain or heightmap from web `Terrain.ts` bake export — optional script later)
- [ ] Landmark **blockout** at web coordinates (pit, grove, observatory — greybox acceptable)
- [ ] **Solid ground** — Terrain Layers (albedo/normal/ORM) + triplanar on cliffs; no transparency vs sky

**Orbital:**

- [ ] `OrbitalDirector` (C# singleton): `EraStateMachine`, `SunPhaseController`, `TemperatureField` per spec
- [ ] Three suns: mesh + light; **one shadow-casting sun** (sun_a)
- [ ] Phases for slice: `thaw`, `stable_golden`, `flying_star` (minimum); others stubbed with palette tables
- [ ] Sky: Volume or custom skybox; **fog/exposure per phase** (ScriptableObject palettes)

**Gameplay:**

- [ ] Spawn drop from Y≈12 (match web feel)
- [ ] Vitality / hydration / temperature bands from GDD (simplified UI)
- [ ] One **log marker** interact + UI panel (English only first)
- [ ] Dehydration pit interact (toggle stasis) — logic port from `ShelterZones` / survival config

**Acceptance:**

- 5–10 minute play: land → walk to grove → trigger Stable → read log → survive one Flying Star using shelter or pit.
- Ground **never** flickers transparent when moving/jumping (materials authored, no post stack on terrain albedo).

---

### U2 — Production pipeline & polish

**Art:**

- [ ] Blender → FBX/glTF → Unity; Substance Painter ORM workflow documented
- [ ] **Baked GI** for landmarks (Lightmap or APV); real-time sun for phase changes
- [ ] Hero meshes: pit rim, observatory dome, grove pool edge (reuse Path A glTF as **import sources** where possible)
- [ ] One **skinned humanoid** + idle; replace greybox registrar/keeper

**Rendering:**

- [ ] Post Volume per era (color grading, bloom, optional DOF on dialogue)
- [ ] Volumetric fog (URP volumetric or HDRP native) — tuned so **horizon line is visible**
- [ ] Wind on banners/cloth (Shader Graph or Unity Cloth)

**Tools:**

- [ ] `npm run export:unity-content` (web repo) → JSON: logs, NPC lines, landmark positions, ORBITAL_CONFIG
- [ ] Unity Editor menu: **Import Content Snapshot**

**Acceptance:** Trailer-ready 60 s capture at 1080p; stable vs chaos obvious in one screenshot each.

---

### U3 — Web demo parity (systems)

Port in order (each shippable):

1. Forecast UI + meta confidence (`ForecastModel`)
2. Full phase rotation + Stable Era probability
3. Civilization stages / props (`CivilizationProps`)
4. Settlement NPCs (predictor, grove keeper) + dialogue
5. Journal, checkpoints, meta progression
6. Voice / narration hooks (Unity `AudioSource` + addressables; optional TTS parity)
7. Japanese locale (import exported strings)

**Acceptance:** Side-by-side checklist vs web `main` (same log count, same era durations ±10%, same landmark triggers).

Tag **`parity-web-v1`**.

---

### U4 — Ship candidate (optional)

- Steam / itch page, build pipeline (GitHub Actions + Unity Builder)
- Settings menu, rebinding, accessibility
- Performance tiers (quality presets)
- Mac + Windows standalone

---

## 7. Port map (web → Unity)

| Web (TypeScript) | Unity (C#) |
|------------------|------------|
| `OrbitalDirector.ts` | `OrbitalDirector.cs` + ScriptableObject palettes |
| `EraStateMachine.ts` | `EraStateMachine.cs` |
| `SunPhaseController.ts` | `SunPhaseController.cs` |
| `SunBody.ts` | `SunBody.cs` (Transform + Light) |
| `ForecastModel.ts` | `ForecastModel.cs` |
| `Terrain.ts` height field | Heightmap asset or `TerrainData` |
| `landmarks.ts` | `LandmarkDatabase` ScriptableObject |
| `Game.ts` loop | `GameDirector.cs` + scene flow |
| `FirstPersonController.ts` | Unity FP controller + same spawn constants |
| `ShelterZones` / survival | `SurvivalModel.cs` |
| i18n / logs | Imported JSON / CSV |

**Tuning:** Single source — export `ORBITAL_CONFIG` from web; Unity loads `orbital_config.json` at boot (avoid dual manual edit).

---

## 8. Art & content reuse from Path A

Already on web `main` (use as Unity import, not runtime in browser):

- `public/assets/` hero glTF/GLB, Draco, KTX2 textures
- `scripts/generate-*` — keep generating in **web repo**; copy artifacts into Unity `Assets/_Game/Art/Heroes/`
- Era LUT PNGs → Unity `Volume` curves or 3D LUT textures

Do **not** port Three.js shaders verbatim; reauthor as Shader Graph / URP Lit.

---

## 9. Team & skills (realistic)

| Role | U0–U1 | U2+ |
|------|-------|-----|
| Programmer (C#) | FP, orbital, survival UI | Parity ports, tools |
| Environment artist | Greybox + one terrain layer | Landmarks, set dressing |
| Character artist | Optional stub | Skinned NPC |
| Tech artist | Shader Graph, lightmaps | Volumes, wind |

Solo dev: stretch U1 to 2–3 sprints; cut to **one landmark + stable grove only**.

---

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Two repos drift | Content export script; orbital JSON single source |
| Ground/sky merge (again) | Terrain Layer + explicit horizon fog color ≠ soil albedo; test jump/sprint in U1 acceptance |
| Scope creep | U1 locked to 3 phases, 1 log, 1 NPC mesh |
| LFS / repo size | Heroes only in Unity repo; compress textures BC7/ASTC |
| Fan legal | GDD rules: original silhouettes, no drama recreation |

---

## 11. Immediate next actions

1. **Create `3body-unity` repo** (private or public) — Unity Hub → **URP 3D** template, commit baseline.
2. **Submodule** this repo’s `docs/` + add `tools/export-unity-snapshot` (follow-up task on web repo).
3. **U0 sprint:** FP controller + celestial sun motion + mood board sign-off.
4. **Freeze web graphics** on `main`; file bugs only (ground latch, etc. stay maintained).

---

## 12. Definition of done (Path B planning)

Planning is complete when:

- [x] This document merged on web `main`
- [ ] Unity repo exists with README pointing here
- [ ] URP/HDRP choice recorded in Unity README
- [ ] U1 acceptance checklist copied into Unity repo `MILESTONES.md`

---

*Last updated: Path B selected after web ground-readability pass; web demo remains playable at https://lawrence-via-mk1987.github.io/3body/*
