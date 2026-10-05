# Trisolarian Survival — Game Design Document

## Disclaimer

**This is a fan-inspired game inspired by the original *Three Body Problem* by Liu Cixin.**

This project is an unofficial, non-commercial fan work. It is not affiliated with, endorsed by, or connected to Liu Cixin, the *Remembrance of Earth's Past* series, or any rights holders. All original characters, settings, and story elements from the novels remain the property of their respective owners. This demo is created out of appreciation for the source material.

---

## Overview

**Title (working):** Trisolarian Survival / 3body  
**Genre:** First-person survival / environmental exploration  
**Platform:** Web demo (browser)  
**Tech stack:** Three.js, Vite, TypeScript  
**Tone:** Hope-in-cycles — bleak Chaotic Eras punctuated by precious, fragile Stable Eras where rebuilding feels meaningful  
**Narrative (shipped demo):** Environmental storytelling + text logs + journal  
**Narrative (next):** Diegetic wayfinding, then a small cast of **original** NPCs with text dialogue tied to era-survival problems (fan work — not licensed characters from the novels or drama)

### Elevator pitch

You are a Trisolarian during a Chaotic Era. Three suns move in unstable orbits above a harsh world. Days can scorch; nights can freeze. Read the sky, hoard water, seek shelter, and endure — or dehydrate and wait. When a rare Stable Era arrives, rebuild, explore ruins of past civilizations, and find hope that another cycle might last longer than the last.

### Design pillars

1. **Orbital chaos is the antagonist** — survival against the sky, not combat
2. **Hope-in-cycles** — suffering in Chaotic Eras makes Stable Eras feel earned and luminous
3. **First-person immersion** — look up at the suns; feel scale and dread in your own eyes
4. **Show, then tell** — ruins and logs first; NPCs and beacons clarify what the world expects you to do
5. **Scientific inspiration, gameplay abstraction** — inspired by the three-body problem, not a physics simulator

---

## Lore alignment

| Novel concept | Game interpretation |
|---|---|
| **Stable Era (恒纪元)** | Rare windows (~5–15% of time): mild temperatures, predictable light, vegetation returns, crafting/building enabled |
| **Chaotic Era (乱纪元)** | Default state: extreme heat, deep cold, rapid transitions |
| **Dehydration** | Core mechanic: enter dormant stasis to survive bad eras (vulnerable, no actions) |
| **Flying stars (飞星)** | One sun dominates the sky — lethal heat, awe-inspiring spectacle |
| **Tri-solar day** | Three suns visible — near-instant broil; highest danger |
| **Civilization cycles** | Meta-progression: each run is one civilization attempt; text logs and ruins reference prior cycles |

---

## Player experience

### Perspective

**First-person** — the player sees the world through Trisolarian eyes. Looking up at one, two, or three suns is a core moment. Dehydration is shown via first-person body/hand desiccation or a reflective pool glimpse.

### Tone: hope-in-cycles

- **Chaotic Eras** are harsh but not hopeless — dehydration, shelter, and preparation are valid paths through
- **Stable Eras** are visually warm, verdant, and quiet — time to explore ruins, read logs, craft, and breathe
- **Environmental contrast** drives emotion: cracked ochre wasteland → brief emerald calm → red apocalyptic sky
- **No nihilism** — each run ends with a log entry or ruin fragment that implies the next civilization learns something

### Narrative delivery

| Method | Examples |
|---|---|
| **Environmental** | Ruined shelters, mass dehydration pits, collapsed observatories, dried riverbeds that fill in Stable Eras |
| **Text logs** | Discoverable data pads / etched tablets — short entries from prior survivors, sages, and failed civilizations |
| **Player journal** | Auto-records era transitions and discoveries (shipped) |
| **Wayfinding beacons** | *(Planned)* World-anchored cues toward dehydration pit and Stable grove — see [Visual wayfinding](#visual-wayfinding) |
| **NPC counsel** | *(Planned)* Short text conversations with original survivors/sages at key landmarks — see [NPC chapter](#npc-chapter-drama-inspired-problems) |

---

## Core gameplay loop

```
OBSERVE SKY → PREDICT ERA → PREPARE → SURVIVE OR DEHYDRATE
                    ↑                              │
                    └──── Stable Era: explore ─────┘
```

1. **Observe** — sun count, apparent size, sky color
2. **Predict** — short forecast with deliberate uncertainty (instruments improve over runs)
3. **Prepare** — gather water, reinforce shelter, choose location, dehydrate
4. **Survive** — manage heat, cold, hydration
5. **Stable Era** — explore, read logs, craft, restore hope; ends without warning
6. **Cycle** — death, dormancy, or meta unlock; new run begins with slightly more knowledge

### Win condition (demo)

Survive long enough to experience one full Stable Era and discover the **Final Log** hidden in a ruin.

### Lose condition

Heat death, freeze, dehydration failure, or shelter breach during a flying star event.

---

## World design

### Scale

Single focused region (~1–2 km²) — enough for landmarks and exploration, small enough for a web demo.

### Terrain

- Cracked salt flats and ochre rock (Chaotic default)
- Ice-glazed basins after cold phases
- Brief grass and water channels during Stable Eras
- Underground cave networks for shelter

### Landmarks

- **Mass dehydration pit** — rows of desiccated forms (environmental, not interactive NPCs)
- **Ruined observatory** — broken predictor instruments; text logs about failed forecasts
- **Prior shelter ruins** — craftable upgrades hinted by debris
- **Stable Era grove** — only accessible/green when era permits; houses the Final Log

---

## Visual wayfinding

**Problem:** Players know landmarks exist from HUD text and logs, but the **world does not visually answer** “where is the pit?” or “where is the grove?”

**Goal:** Make critical survival locations **readable at a glance** without replacing exploration — guidance ramps up when the player is lost or the era demands action.

### Landmark targets (demo region)

| Landmark | Position (approx.) | Player need |
|---|---|---|
| **Mass dehydration pit** | (−42, 18) | Survive flying star / tri-solar; voluntary stasis |
| **Stable Era grove** | (28, −32) | Water (R), Final Log, hope beat |

### Visual language (consistent icons)

| Cue | Pit (Chaotic priority) | Grove (Stable priority) |
|---|---|---|
| **Horizon beacon** | Pale amber pillar / smoke column visible from far away | Green-gold pillar when `era === stable`; dim dormant mesh otherwise |
| **Ground trail** | Cracked ochre path + desiccated ring markers leading inward | Moss/lichen trail + pooled water glint in Stable Era |
| **Sky glance** | Subtle compass tick on HUD edge pointing to pit when hydration &lt; 40% or forecast shows lethal heat | Same tick toward grove when Stable Era active and player has not drunk / found Final Log |
| **Proximity** | Ring torus pulses when player within ~25 m; stronger pulse on interaction ring | Pool shimmer + particle motes; banner already fires on Stable entry |
| **Audio** | Low wind through hollow pit (spatialized) | Insect/hum + water drip in Stable Era |

### UX rules

- Beacons **respect era**: grove path fully lit only in Stable Era; pit beacon **stronger** in Chaotic / dangerous phases.
- No quest arrow through walls — use **terrain-following** markers and horizon silhouettes.
- **Accessibility:** cues work together (color + motion + HUD tick); not color-only.

### Implementation sketch (Three.js)

- `LandmarkBeacons.ts` — pillar meshes, shader pulse, distance-based opacity.
- `TrailMarkers.ts` — instanced stones / rings along spline from spawn toward pit; grove branch gated by era.
- `HudCompass.ts` — optional edge indicator toward active objective (pit vs grove from `Game` state).
- Hook into existing `LandmarkHints`, `WaterSource`, `ShelterZones`.

---

## NPC chapter (drama-inspired problems)

**Intent:** Evoke the **kinds of problems** Trisolarian civilizations face in the source material and adaptations — predicting chaos, choosing mass dehydration, clinging to hope in a Stable Era — without importing **named characters, likenesses, or plot scenes** from the novels or TV drama.

All NPCs are **original fan-created** figures (e.g. “the pit registrar,” “the grove keeper,” “the broken predictor”). Dialogue is **text-only** (reuse log reader / dialogue panel), no voice acting in the web demo.

### Design pillars for NPCs

1. **Problems, not parody** — each NPC embodies one survival dilemma, not a cutscene recap.
2. **Gameplay-linked** — conversation choices or tasks change forecast confidence, unlock a trail, or gate a ritual at the pit.
3. **Era-aware** — some NPCs only “wake” in Stable Era (grove); others are desiccated silhouettes at the pit until Chaotic danger rises.
4. **Small cast** — 3 NPCs max for the next milestone; expand only after wayfinding ships.

### Cast (original characters)

| NPC | Location | Problem (drama *theme*, not IP) | Gameplay hook |
|---|---|---|---|
| **Registrar of the Pit** | Dehydration pit ring | When does a civilization choose mass stasis vs. running? | Teaches pit ring vs. tablet; optional “fold with the row” tutorial dehydration |
| **Last Predictor** | Ruined observatory | Can the sky be forecast when three suns lie? | Mini-game: align broken dials to **narrow forecast cone** (meta unlock persists) |
| **Grove Keeper** | Stable grove | Is hope rational when Stable Eras always end? | Stable-only: trade condensate hint for finding Final Log; journal entry |

### Conversation format

- **Interact:** `T` talk when near NPC (keep `F` for tablets).
- **UI:** Dialogue panel (speaker name + 2–4 lines + 2–3 choices); choices affect **run state** or **meta flags** in `localStorage`.
- **Fail-forward:** Wrong predictor guess still teaches; NPCs never soft-lock the demo.

### What we are not doing (legal / scope)

- No Wang Miao, Ye Wenjie, Shi Qiang, or other licensed names or likenesses.
- No recreated drama sets or verbatim dialogue.
- No full RPG quest tree — **3 problem vignettes** tied to existing landmarks.

---

## Celestial system (summary)

See [ORBITAL_SIM.md](./ORBITAL_SIM.md) for technical detail.

| State | Sky | Gameplay |
|---|---|---|
| Dormant suns | 0–1 visible, dim | Cold creep |
| Single sun | 1 dominant | Manageable exposure |
| Binary | 2 suns | Rapid temperature swings |
| Tri-solar | 3 suns | Extreme heat; go underground |
| Flying star | 1 sun fills ~30% of sky | Lethal without deep shelter |
| Eclipse relief | Occluded sun(s) | Brief safe window |

Orbital behavior uses an **authored phase state machine** with bounded randomness — chaotic feel, tunable for fun.

---

## Survival systems

| System | Behavior |
|---|---|
| **Hydration** | Drains faster in heat; condensers work weakly in Chaotic Eras |
| **Body temperature** | Driven by sun state + shelter + underground depth |
| **Dehydration** | Voluntary stasis; immune to heat/cold; vulnerable; cannot act |
| **Shelter** | Interior volumes reduce exposure; upgradeable with scavenged parts |
| **Forecast** | UI tool with uncertainty cone; improves via meta unlocks |

---

## Art direction

- **Style:** Stylized realism — readable at web performance budgets
- **Palette:** Ochre wasteland · blood-red flying stars · pale frozen nights · gold/green Stable Eras
- **Reference mood:** Dune × Outer Wilds × the novel's cyclical history
- **Suns:** Three visually distinct bodies (e.g. orange dwarf, pale giant, red companion)
- **UI:** Minimal HUD; diegetic forecast reader; log reader overlay for text discoveries

---

## Tech stack

| Layer | Choice |
|---|---|
| Rendering | Three.js (r160+) |
| Build | Vite + TypeScript |
| Physics | Custom terrain height + shelter volumes (no Rapier in current build) |
| Input | Pointer Lock API (first-person mouse look) |
| Audio | Web Audio API + howler.js (optional) |
| Storage | localStorage for meta-progression and journal |
| Deploy | Static hosting (GitHub Pages, Netlify, or Vercel) |

### Performance targets (web demo)

- 60 FPS on mid-range laptop integrated GPU
- 1 directional + 2 point/spot sun lights max; baked ambient elsewhere
- Low-poly terrain with shader-based detail
- Draw distance tuned for single region

---

## Scope: web demo MVP

### Shipped (M1–7 + flow polish)

- [x] First-person movement (WASD + pointer lock)
- [x] Procedural terrain chunk with underground area
- [x] Three suns with 4+ orbital phases
- [x] Temperature + hydration survival
- [x] Dehydration mechanic
- [x] Stable Era cycle (boosted until Final Log)
- [x] 8 discoverable text logs in ruins
- [x] HUD, log reader, journal, pause, checkpoints
- [x] Main menu + disclaimer
- [x] localStorage: discovered logs + checkpoint
- [x] GitHub Pages deploy — [play online](https://lawrence-via-mk1987.github.io/3body/)

### Next (M8–9)

- [x] **M8 Visual wayfinding** — pit/grove beacons, trails, HUD compass tick, proximity pulse *(shipped)*
- [x] **M9 NPC vignettes** — Registrar, Last Predictor (forecast calibration), Grove Keeper *(shipped)*

### Out of scope (later)

- Full crafting tree
- Multiple regions / planet scale
- Real N-body physics integration
- Multiplayer
- Mobile touch controls (desktop browser first)
- Licensed character appearances or voiced drama adaptation content

---

## Milestone order

1. **Scaffold** — Vite + Three.js + TS, pointer-lock FPS controller, basic terrain ✅
2. **Celestial** — `OrbitalDirector`, three sun meshes, dynamic sky, temperature field ✅
3. **Survival** — hydration, temperature, death states, dehydration ✅
4. **World** — landmarks, ruin props, era-dependent terrain shader ✅
5. **Narrative** — text log placements, journal UI, environmental storytelling pass ✅
6. **Stable Era** — era transition polish, green palette shift, Final Log discovery ✅
7. **Demo polish** — disclaimer screen, audio, deploy to static host ✅
8. **Visual wayfinding** — pit & grove beacons, trails, compass HUD, spatial audio cues *(recommended next build)*
9. **NPC chapter** — dialogue UI, 3 original NPCs, predictor / pit / grove problem vignettes

---

## Project structure (planned)

```
3body/
├── docs/
│   ├── GDD.md
│   └── ORBITAL_SIM.md
├── public/
│   └── assets/
├── src/
│   ├── core/           # Game loop, state machine
│   ├── orbital/        # OrbitalDirector, SunBody, EraState
│   ├── survival/       # Hydration, Temperature, Dehydration
│   ├── player/         # First-person controller, camera
│   ├── world/          # Terrain, landmarks, shaders
│   ├── narrative/      # Log definitions, journal
│   └── ui/             # HUD, log reader, disclaimer
├── index.html
├── package.json
└── README.md
```

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Orbital chaos feels unfair | Telegraph phases via sky color; dehydration escape valve |
| Web perf with 3 suns | Limit shadow casters; shader-based sun glow |
| First-person disorientation | Subtle vignette, clear horizon reference, underground beacons |
| Fan work legal sensitivity | Prominent disclaimer on menu and README; non-commercial demo |
| Scope creep | Lock demo to one region; M8 before M9; 3 NPCs max |
| Players cannot find pit/grove | M8 wayfinding beacons + HUD tick |
| NPCs dilute silent tone | Short vignettes at landmarks only; tablets remain primary lore |
