# Visual target — “FF8+” fidelity vs Unity fork

**Status:** Path **B (Unity)** selected — see **[PATH_B_UNITY_PLAN.md](./PATH_B_UNITY_PLAN.md)** for milestones. Web `main` stays the design reference and Pages demo; no Unity tree in this repo root.  
**Path A** milestones on web are **complete enough** for the browser; further graphics effort moves to Unity.

---

## Why the web demo reads “Minecraft-like”

That look is mostly **tech and art scope**, not a wrong creative direction:

| Factor | Today | Effect |
|--------|--------|--------|
| **Landmarks & NPCs** | Procedural `meshKit` boxes/cylinders (`REALISM_REMAKE_PLAN` Phase 2) | Blocky silhouettes, repeating primitives |
| **Characters** | `buildHumanoidNpc` robe stacks, no skinned mesh | FF7/early-FF8 *real-time* poly feel, not modern JRPG hero art |
| **Textures** | Procedural 512–1K dust/cloth | Reads flat at mid distance; little micro-detail |
| **World scale** | Single terrain plane + instanced grass | Fine for survival sketch; not dense set dressing |
| **Lighting** | One shadow sun + fills + desktop bloom/SSAO | Good for web; not cinematic key/fill/rim + volumetrics |
| **Post** | Light grain/vignette on desktop only | No color grading stack, DOF, or filmic LUT |

So the game **plays** like a survival demo but **presents** like an intentional low-poly web prototype. Moving toward **Final Fantasy VIII–*tier* production value** (see below) is primarily an **asset + lighting + animation** project, not a few shader tweaks.

---

## What “Final Fantasy VIII and above” should mean here

**FF VIII (1999)** was not “photo realistic.” It mixed:

- **Pre-rendered** backgrounds (fixed camera paintings) for cities and dungeons  
- **Low-poly real-time** characters on top  
- **Cinematic framing** and strong art direction  

When people say “FF8 **and above**” today they usually mean one of:

1. **Modern JRPG polish** — PBR materials, normal maps, hair/cloth, mocap or hand animation, dense props, sky/atmosphere, color grading (think *FF7 Remake*, *FF16*, *XIII* environments — still stylized, not Unreal MetaHuman).  
2. **Photorealism** — HDRP/UE5, scanned surfaces, high poly, ray-traced or baked GI (closer to film VFX than 1999 Square).

**Recommendation for Trisolarian Survival:** target **(1) cinematic stylized realism** — harsh alien suns, worn cloth, stone pit, observatory metal — **not** generic Earth photoreal. That keeps the fan project distinct and cheaper than full scan-based PBR everywhere.

---

## Can Unity be “super duper photo realistic”?

**Yes, Unity can go far beyond this Three.js demo** — especially with **HDRP**, high-res meshes, baked lighting, Volumetric fog, post-processing volumes, and authored assets.

Tradeoffs:

| | **Keep Three.js (GitHub Pages)** | **Unity fork (PC / console / optional WebGL)** |
|--|----------------------------------|--------------------------------------------------|
| **Reach** | Link in browser, phones, no install | Download / Steam / itch; mobile is a separate quality pass |
| **Graphics ceiling** | Good “indie web” PBR; tight download budget | HDRP, Nanite-like workflows (via assets), cinematics |
| **What you reuse** | All current code | **Design docs**, orbital *rules*, narrative text, locale strings — **not** the TS game loop |
| **Cost** | Art in glTF + KTX2, stay &lt; ~25 MB | Art pipeline, C#, scenes, build farm, likely **separate repo** |
| **Risk** | Hit phone 30 fps | Two products to maintain unless web demo is frozen as “sketch” |

The existing [`REALISM_REMAKE_PLAN.md`](./REALISM_REMAKE_PLAN.md) already says: revisit Unity/Unreal **only if** the web visual budget fails. Your instinct (separate branch / fork) matches that.

---

## Recommended repo strategy: parallel branches, not one mixed tree

**Do not** replace `main`’s Vite app with Unity in the same folder — Unity’s `Assets/`, `ProjectSettings/`, and LFS binaries fight the web repo.

Preferred:

```
3body/                          ← this repo (web reference, keeps shipping)
docs/                           ← shared GDD, ORBITAL_SIM, narrative (copy or submodule)
unity/TrisolarianSurvival/      ← optional stub; or new repo 3body-unity
```

**Branch naming (web repo):**

- `main` — playable Pages demo, incremental visual wins  
- `cursor/ff8-visual-target-3d2d` — **this plan** (docs + acceptance criteria)  
- Future: `cursor/web-pbr-hero-3d2d` — glTF landmarks + skinned NPC on web only  

**Unity repo (when you start):**

- Branch `main` = vertical slice: one pit + one Stable grove + FP controller  
- Tag `sync-orbital-v1` when rules match [`ORBITAL_SIM.md`](./ORBITAL_SIM.md)

---

## Path A — Push the **web** demo toward FF8-*tier* (no Unity)

Goal: **less blocky, more “set piece”** while keeping GitHub Pages and phones.

**Shipped (Path A — milestone 1):** pit / dome / grove rim / registrar glTF, era color grade.

**Shipped (Path A — milestone 2):**

- glTF **predictor** + **observatory trim** (string courses, door lintel, steps) via `pathAHeroAssets.ts`
- Terrain **ORM-style** stack: baked **AO map**, triplanar AO/roughness, **detail normal** micro-breakup (`terrain-realism-v6-orm-detail-normal`)
- Regenerate heroes: `npm run assets:heroes`

**Shipped (Path A — milestone 3):**

- **Rigged predictor** glTF (`body` / `head` / `armL` / `armR`) with procedural idle + optional glTF `AnimationMixer`
- **Grove keeper** hero glTF + `swapGroveKeeperMesh`
- **Observatory shell hide** — procedural dome/drum/door trim batch toggled off when dome + trim heroes load (`Ruins.observatoryShellGroup`)
- **Draco GLB** pipeline: `npm run assets:heroes:all`, runtime `heroGltfLoader.ts` + `public/assets/draco/gltf/`

**Shipped (Path A — milestone 4):**

- **KTX2 hero PBR** — stone/moss/cloth sets (`heroKtx2Textures.ts`, `public/assets/textures/*.ktx2`, Basis transcoder in `public/assets/basis/`)
- **Set dressing** — instanced scatter rocks, pit/observatory banners, dehydration bundles (`SetDressing.ts`)
- **Sky + LUT polish** — god-ray streaks on `Sky.ts`, era strip LUTs in cinematic post (`npm run assets:luts`)

Ordered wins (each shippable on `main`):

1. **Hero glTF set (Phase 5c)** — pit rim, observatory dome, grove pool edge (KTX2 + Draco); rigged NPC idle. *(M4: KTX2 maps on heroes.)*  
2. **Material upgrade** — ORM textures on landmarks; triplanar + detail normal on terrain; drop visible “box” props from `meshKit` where glTF replaces them.  
3. **Sky & suns** — larger limb-darkened disks, god-rays/bloom tuning, era LUTs (stable gold vs chaos ochre vs flying-star red).  
4. **Set dressing** — instanced rocks, banners, dehydration rows as **merged meshes**, not loose primitives.  
5. **Camera & post (desktop)** — subtle DOF near talk/cutscenes, stronger grade; **no** full FF8 pre-rendered backgrounds unless you accept fixed cameras (big gameplay change).

**Realistic ceiling on web:** strong **FF7 Remake–lite environments at distance**, simple real-time characters — not full FF16 combat fidelity.

---

## Path B — **Unity** vertical slice (photoreal / HDRP option)

Goal: prove **one Chaotic Era walk + one Stable Era grove** looks like the target mood board.

### Phase U0 — Lock target (1–2 weeks human time, mostly art)

- Mood board: chaos wasteland, tri-solar sky, stable grove pool (reference: *your* aliens, not TV drama).  
- Decide **URP (broader)** vs **HDRP (prettier, heavier)**.  
- List reusable exports from web: `landmarks.ts` coordinates, era colors from `OrbitalDirector`, log IDs.

### Phase U1 — Vertical slice

- First-person controller, one 500 m terrain or modular blockout  
- Three suns + phase state machine ported from spec (C# reads same enum names as TS)  
- One landmark + one NPC interact (text UI)  
- One Stable / one Flying Star lighting profile  

### Phase U2 — Production pipeline

- Blender → FBX/glTF → Unity  
- Baked GI for landmarks; real-time sun for phases  
- Localization CSV from existing `logs.ts` / i18n JSON export script  

### Phase U3 — Parity with web demo

- Dehydration, forecast, counsel flags — only after slice is pretty enough to motivate the work  

**Photoreal checklist:** scanned or Substance surfaces, high-poly bake, volumetric fog, exposure volumes, contact shadows, wind on cloth (Shader Graph), audio middleware.

---

## Decision matrix (pick one primary track)

| If your priority is… | Choose |
|----------------------|--------|
| Shareable link, phones, fast iteration | **Path A** on `main` |
| Portfolio / trailer / “wow” screenshots | **Path B** Unity repo + freeze web as sketch |
| Both | Web stays canonical **design**; Unity is **visual remake** (two URLs, shared docs) |

---

## Immediate next step

**Path B:** Follow **[PATH_B_UNITY_PLAN.md](./PATH_B_UNITY_PLAN.md)** — create `3body-unity` repo, U0 foundation, then U1 vertical slice.

No Unity project is required in *this* repo — only shared documentation and [`unity/README.md`](../unity/README.md) pointer.

---

## Legal / fan note

Higher fidelity must still follow [`GDD.md`](./GDD.md): original silhouettes, no drama recreation, no licensed character likenesses — whether rendered in Three.js or Unity.
