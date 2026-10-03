# Realistic graphics remake — plan

**Status:** draft. The live demo stays as-is until a phase is explicitly started.  
**Goal:** remake the *look* of Trisolarian Survival so the world, suns, and people read as a harsh alien landscape — while keeping the current survival loop, story, and mobile play.

This is a fan-inspired sketch of Liu Cixin’s ideas. The remake should **not** copy shots, costumes, or sets from the TV drama.

---

## What we have now

| Layer | Today |
|---|---|
| Engine | Three.js + Vite + TypeScript, GitHub Pages |
| Terrain | One 512 m plane, procedural height, color uniforms (cold / heat / stable) |
| Props | Boxes, cones, capsules built in code (`Ruins`, `CivilizationProps`, `HumanoidNpc`) |
| Sky | Gradient shader dome + three sphere “suns” with sprite glow |
| Light | One shadow-casting sun, hemisphere fill, ACES tone mapping |
| People | Low-poly robe figures + name poles |
| Audio / systems | Orbital phases, survival, logs, NPCs, civilization stages — **keep these** |

The gameplay is the demo. The graphics are a prototype skin on top of it.

---

## What “realistic” means here

Not a film render and not Unreal. A **believable first-person place** on an iPhone:

- Ground that looks like baked clay, ash, and cracked stone — not a painted plane.
- Buildings and dehydration pits with real silhouettes, wear, and shadow.
- Three suns that bloom, color the air, and throw light that matches the phase (one sun, two suns, tri-solar, flying star).
- NPCs that read as people in heavy climate robes, at the scale of the player.
- Stable Era that actually turns green: grass, wet grove, softer light — so the contrast with chaos is the emotion.

**Out of scope for the remake:** new combat, a bigger map, licensed drama assets, or a second engine unless the web budget fails (see Risks).

---

## Approach

**Visual remake in place.** Keep `Game`, orbital state machine, survival, dialogue, and saves. Replace world presentation behind the same landmarks (pit, observatory, grove, spawn).

Do **not** start by rewriting the game in Unity/Unreal. Those can look better, but they drop the current mobile web demo and the systems already shipped. Revisit a native engine only if Phase 2 cannot hold 30 fps on a recent phone.

---

## Art direction

One sentence: **a drought planet under argumentative stars.**

- **Chaotic Era:** ochre and iron dust, hard shadows, heat shimmer near the ground, cold phases go blue-grey and hazy.
- **Tri-Solar:** three distinct disks (amber, white-gold, deep red) with overlapping light; the ground should show mixed shadow colors.
- **Flying Star:** one red sun enormous and low; the other two small or gone; horizon glare, short lethal window.
- **Stable Era:** the same geography, but damp soil, low green cover, grove pool with reflection, warm single sun.
- **People:** original settlers — wrapped faces, layered cloth, tools (scroll, dial staff, cuttings). No drama lookalikes.
- **Civilization stages:** the same props as now (cairns → pit scaffolds → observatory works → grove path → lantern roads), rebuilt as real meshes so later cycles feel inhabited.

---

## Technical direction

Stay on Three.js. Turn on the features the prototype skipped:

1. **glTF scenes** for landmarks and NPCs (Blender → glTF, Draco or meshopt, KTX2 textures).
2. **PBR materials** (`MeshStandardMaterial` / `MeshPhysicalMaterial`): albedo, normal, roughness, occlusion. A few hero materials, reused.
3. **Image-based lighting:** small HDR or PMREM from the current sky colors, updated when the era changes — so robes and stone pick up sky color.
4. **Shadows:** one sun shadow in calm phases; in tri-solar, fake extra color with lights that do not all cast shadows (mobile cannot afford three shadow maps).
5. **Sky:** keep the three `SunBody` objects, add a sun disk shader (limb darkening), stronger bloom only on flying star / tri-solar, atmospheric fog tied to phase (already partially there).
6. **Terrain:** heightmap or the current procedural mesh, plus a detail normal and triplanar rock/dust so it is not one flat color. Optional: a second mesh for the near ground (higher detail under the player only).
7. **Foliage:** instanced grass cards and a few grove trees, hidden or dead in chaos, alive in Stable Era.
8. **Quality tiers:** `deviceProfile` already knows touch vs desktop. Phone = fewer shadows, smaller textures, no heavy bloom. Desktop = sharper textures and a short post stack.

Target budgets (phone): draw calls under ~150 in the play area, textures mostly 1K, total download under ~25 MB after the first load.

---

## Phases

Each phase should be playable on the existing URL. Do not replace everything in one drop.

### Phase 0 — Look target (no gameplay change)

- Still frames: thaw (two suns), tri-solar (three suns), flying star, stable grove, pit registrar at conversational distance.
- A one-page material list (dust, basalt, cloth, water, sun).
- Confirm phone tier vs desktop tier.

**Done when:** the stills are agreed, and nothing in the live demo has moved.

### Phase 1 — Light and ground

- Terrain shading: triplanar dust/rock, era tint on top of texture instead of replacing it.
- Contact shadows / AO on the player’s nearby ground.
- Sun disks and glow upgraded so three suns read at a glance in Tri-Solar.
- Fog and exposure per phase (flying star should feel blinding; eclipse relief should feel dim).

**Done when:** standing in the open wasteland already feels like a place, before any new building.

### Phase 2 — Landmarks

Replace code-built landmarks with authored meshes, same positions in `landmarks.ts`:

- Dehydration pit and folded rows
- Observatory dome and scaffold
- Grove pool, trees, waystone
- Spawn clutter and civilization-stage kits (cairns, scaffolds, lanterns)

Keep gameplay triggers (talk radius, drink, fold, log markers) on the old coordinates.

**Done when:** a player can finish one cycle and recognize pit, dome, and grove without the compass.

### Phase 3 — People

- One humanoid glTF (or three outfit variants) with a simple idle.
- Face mostly shadowed by cloth; hands and posture carry the role (registrar, predictor, keeper).
- Name poles stay, but shorter and secondary.
- Dialogue camera unchanged (first person); no cutscenes required.

**Done when:** the registrar reads as a person from the distance in the current mobile screenshot, and Talk still works.

### Phase 4 — Era dressing and juice

- Stable Era: grass instances, wet ground near the pool, softer sun.
- Heat: subtle ground shimmer and sun bloom.
- Cold: frost tint, breath is optional and easy to cut on mobile.
- Civilization stage swaps use the new kits, not extra code primitives.

**Done when:** a Chaotic screenshot and a Stable screenshot of the same grove are obviously different without reading the HUD.

### Phase 5 — Polish and ship

- Compress textures, measure iPhone-class frame time, drop features that miss 30 fps.
- Loading screen while glTF/KTX2 fetch.
- Update README screenshots.
- Leave the primitive builders in the repo until the new art is the default, then delete them.

---

## What stays untouched

- Orbital phases, forecast, temperature, dehydration, shelter
- Logs, journal, counsel, civilization number and stages
- Mobile controls and Sky sheet
- English / 中文 copy
- GitHub Pages deploy

If a pretty mesh blocks a talk radius or the pit ring, the mesh moves — the rule does not.

---

## Risks

| Risk | Response |
|---|---|
| Realistic art is too heavy for Safari | Quality tiers; Phase 1–2 must pass on a phone before Phase 3 |
| Download size on Pages | KTX2, shared materials, lazy-load grove trees |
| “Realistic” turns into endless asset work | Phase 2 is three landmarks only |
| Looks like the TV show | Original silhouettes; no reproduced costumes or title imagery |
| Three shadow-casting suns | Only the dominant sun casts a shadow |

---

## Suggested order of work

1. Agree this doc (especially phone vs desktop quality).
2. Phase 0 stills.
3. Phase 1 in a branch, playable beside the current build.
4. Only then commission or build the pit, observatory, and grove meshes.

The first visual win is **ground + three readable suns**. Buildings and people come after the sky already feels like Trisolaris.
