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
**Narrative:** Silent environmental storytelling + discoverable text logs (no voiced dialogue)

### Elevator pitch

You are a Trisolarian during a Chaotic Era. Three suns move in unstable orbits above a harsh world. Days can scorch; nights can freeze. Read the sky, hoard water, seek shelter, and endure — or dehydrate and wait. When a rare Stable Era arrives, rebuild, explore ruins of past civilizations, and find hope that another cycle might last longer than the last.

### Design pillars

1. **Orbital chaos is the antagonist** — survival against the sky, not combat
2. **Hope-in-cycles** — suffering in Chaotic Eras makes Stable Eras feel earned and luminous
3. **First-person immersion** — look up at the suns; feel scale and dread in your own eyes
4. **Silent story** — ruins, dehydration pools, and text logs tell of civilizations that came before
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
| **No dialogue** | No NPC conversations; optional sage statues or murals that only show text when interacted with |
| **Player journal** | Auto-records era transitions and discoveries; player can leave notes for meta-progression |

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
| Physics | Rapier3D (player collision, shelter volumes) |
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

### In scope

- [ ] First-person movement (WASD + pointer lock)
- [ ] Procedural terrain chunk with underground area
- [ ] Three suns with 4+ orbital phases
- [ ] Temperature + hydration survival
- [ ] Dehydration mechanic
- [ ] One Stable Era cycle per session (scripted timing for demo)
- [ ] 5–8 discoverable text logs in ruins
- [ ] Minimal HUD + log reader UI
- [ ] Main menu with disclaimer screen
- [ ] localStorage meta: unlocked logs persist across runs

### Out of scope (post-demo)

- Full crafting tree
- Multiple regions / planet scale
- Real N-body physics integration
- Multiplayer
- Mobile touch controls (desktop browser first)

---

## Milestone order

1. **Scaffold** — Vite + Three.js + TS, pointer-lock FPS controller, basic terrain
2. **Celestial** — `OrbitalDirector`, three sun meshes, dynamic sky, temperature field
3. **Survival** — hydration, temperature, death states, dehydration
4. **World** — landmarks, ruin props, era-dependent terrain shader
5. **Narrative** — text log placements, journal UI, environmental storytelling pass
6. **Stable Era** — era transition polish, green palette shift, Final Log discovery
7. **Demo polish** — disclaimer screen, audio, deploy to static host

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
| Scope creep | Lock demo to one region, one Stable Era, 5–8 logs |
