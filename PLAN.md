# Trisolaris — A 3D Three-Body Survival Game

A 3D, browser-playable game world inspired by the Trisolaran civilization from Liu Cixin's
*The Three-Body Problem*. The planet orbits **three suns** whose gravitational interaction is
**chaotic and unpredictable**. The player's goal is simple to state and hard to achieve:
**survive** the alternating Stable and Chaotic Eras.

---

## 1. Concept & Fantasy

In the trisolar system the motion of the planet is governed by the (unsolvable in closed form)
three-body problem. The result is a world of two recurring conditions:

- **Stable Era** — a temporary, semi-predictable period of livable temperatures. Civilization
  flourishes, rebuilds, and stockpiles.
- **Chaotic Era** — suns swing wildly close (scorching) or far (freezing). Survival requires
  hiding, insulating, and — true to the books — **dehydrating** the population to ride out the
  extremes, then **rehydrating** when conditions improve.

Rare, dramatic events punctuate play:

- **Tri-Solar Day** — all three suns dominate the sky simultaneously; extreme heat.
- **Flying Star** — a sun so distant it appears as a single star; deep cold.
- **The Great Rip / Syzygy** — alignment events that can capture or eject the planet (loss/near-loss).

The core emotional loop is **forecasting under uncertainty**: read the sky, gamble on whether the
next era is survivable, and pay the price when the chaos wins.

---

## 2. Design Pillars

1. **Real physics, real chaos.** The eras are *emergent* from an actual N-body simulation, not
   scripted. No two playthroughs are identical.
2. **Survival through preparation.** You cannot fight the suns; you can only read them, hide, and
   ration.
3. **Legible chaos.** The simulation is unpredictable, but the *current* state is always readable
   through clear UI (temperature, sun distances, forecasts with confidence intervals).
4. **Browser-first.** No install. Runs in a modern browser, shareable via a URL.

---

## 3. Tech Stack

| Concern            | Choice                                   | Why |
|--------------------|------------------------------------------|-----|
| Rendering          | **Three.js** (WebGL2)                    | Mature 3D in the browser, huge ecosystem |
| Language           | **TypeScript**                           | Type safety for math/sim-heavy code |
| Build/dev          | **Vite**                                 | Fast HMR, simple config |
| State management   | Lightweight custom store / **Zustand**   | Decouple sim ↔ UI |
| UI (HUD/menus)     | DOM + CSS overlay (optionally React)     | HUD is 2D; keep it cheap |
| Physics            | **Custom N-body integrator** (in-house)  | We need control + determinism, not a rigid-body engine |
| Audio              | Web Audio API / Howler.js                | Ambient + event stingers |
| Testing            | **Vitest**                               | Unit-test the integrator & survival math |

> Alternative considered: a full engine (Unity/Godot). Rejected for v1 because the core is a custom
> physics sim + data-driven survival loop, and browser distribution is a strong design goal. Godot
> remains a viable port target if we later want native builds.

---

## 4. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Game Loop                          │
│  fixed-step simulation  +  variable-step render/interp     │
└───────────────┬───────────────────────────┬───────────────┘
                │                           │
        ┌───────▼────────┐         ┌────────▼────────┐
        │  Simulation     │         │   Presentation   │
        │  (deterministic)│         │   (Three.js)     │
        ├─────────────────┤         ├──────────────────┤
        │ N-body physics  │         │ Scene graph      │
        │ Climate model   │  state  │ Sun shaders      │
        │ Era classifier  ├────────►│ Sky/lighting     │
        │ Survival systems│         │ Camera rig       │
        │ Event scheduler │         │ VFX / particles  │
        └─────────────────┘         └──────────────────┘
                │                           ▲
        ┌───────▼────────┐         ┌────────┴────────┐
        │   Game State    │◄────────┤      Input/UI    │
        │  (single store) │ actions │  HUD, forecast,  │
        └─────────────────┘         │  build, dehydrate│
                                    └──────────────────┘
```

- **Deterministic core, dumb renderer.** The simulation owns truth; the renderer interpolates and
  displays. This keeps physics reproducible (seedable) and testable in isolation.
- **Fixed-step physics** (e.g. 60 Hz sim) decoupled from render frame rate, with interpolation for
  smooth visuals.

---

## 5. The Simulation (the heart of the game)

### 5.1 N-body gravitational physics

Bodies: 3 suns (with masses/luminosities) + 1 planet (negligible mass → can be treated as a test
particle initially, then promoted to full body for richer behavior).

- **Integrator:** **Velocity Verlet** for v1 (symplectic, good energy behavior, cheap). Upgrade
  path to **RK4** or adaptive **Runge–Kutta–Fehlberg** if close encounters cause blow-ups.
- **Softening factor** on gravity to avoid singularities during near-collisions.
- **Seeded initial conditions** so a "world seed" reproduces the same chaotic trajectory — important
  for sharing worlds and for testing.
- **Time scaling:** in-world days/years compressed to playable minutes; player-controllable
  time multiplier (pause / 1x / fast-forward).

```ts
// sketch — not final
for (const b of bodies) b.acc = gravitationalAccel(b, bodies, G, softening);
for (const b of bodies) b.pos.addScaledVel(b.vel, dt).addScaledAcc(b.acc, 0.5 * dt * dt);
for (const b of bodies) b.newAcc = gravitationalAccel(b, bodies, G, softening);
for (const b of bodies) b.vel.addScaled(b.acc.add(b.newAcc), 0.5 * dt);
```

### 5.2 Climate model

Surface temperature derived from incident radiation:

```
flux(t) = Σ_suns  luminosity_i / (4π · distance_i(t)²)
T_surface ≈ f(flux, atmosphere, planet thermal inertia, day/night, latitude)
```

- Thermal **inertia/lag** so temperature doesn't snap instantly (gives players reaction time).
- Optional day/night cycle from planet rotation; multiple suns can mean no true night.

### 5.3 Era classification

A rolling classifier labels the current climate and emits forecasts:

- **Stable** vs **Chaotic** based on temperature staying within a habitable band and the variance
  of recent flux.
- **Forecast** = short-horizon integration of the *known* trajectory, surfaced to the player as a
  prediction **with a confidence interval that decays with horizon** (you can guess a little, never
  far — faithful to the book's premise).
- Named events (Tri-Solar Day, Flying Star, Great Rip) are detected from geometry (sun proximity,
  alignment, ejection trajectory).

### 5.4 Determinism & save/load

- World = `{ seed, initialConditions, simTime }`. Reproducible.
- Save = serialize game state + sim state; load resumes exactly.

---

## 6. Gameplay Systems

### 6.1 The survival loop

1. **Observe** the sky and HUD; read the forecast.
2. **Prepare** during Stable Eras: gather resources, expand colony, research.
3. **Decide** when a Chaotic Era is coming: keep working (risky) or **dehydrate** the population and
   seal shelters.
4. **Endure** the extremes; structures/people can be lost if you mistime it.
5. **Rehydrate & rebuild** when stability returns. Score = civilization progress survived.

### 6.2 Player verbs (v1)

- **Forecast** — spend a resource / time to sharpen the short-term prediction.
- **Build** — shelters, solar collectors, heat sinks, water reserves (placed on the planet surface).
- **Dehydrate / Rehydrate** — convert living population to a stored, weather-proof state and back.
- **Ration / Allocate** — distribute energy, water, food across the colony.
- **Time control** — pause / speed up to skip uneventful stretches; ramps tension during events.

### 6.3 Resources & progression

- Resources: **energy, water, food, materials, population**.
- A light **tech tree**: better forecasting, hardier shelters, faster rehydration, deeper bunkers.
- **Failure** is survivable-but-costly (lose population/buildings), with a hard fail on full
  extinction or planetary ejection.

### 6.4 Difficulty

- Driven by the **world seed**: some systems are kinder (longer Stable Eras) than others.
- Tunables: habitable temperature band width, forecast accuracy, resource scarcity.

---

## 7. World, Rendering & Art Direction

- **Camera modes:** orbital "system view" (see the three suns + planet dance) and a
  closer **planet/colony view**. The contrast between the two is a key feel: cosmic scale vs.
  intimate survival.
- **Suns:** emissive sphere shaders with color tied to temperature class (blue-white hot → deep red
  cool), bloom, lens-style glare, and dynamic point lights driving real scene lighting.
- **Sky:** color/intensity reacts to live sun positions — searing white-out during Tri-Solar Days,
  near-black with a single bright "flying star" during deep cold.
- **Planet:** terrain with material/temperature feedback (cracked-dry, scorched, frozen, temperate).
- **VFX:** heat shimmer, frost accumulation, particle storms during transitions.
- **Audio:** adaptive ambience keyed to era; stingers for named events.

Art scope for v1 stays **stylized/low-poly + strong shaders/post** to keep it achievable and
performant in-browser.

---

## 8. UI / UX

- **HUD:** current temperature + habitable band, era label, three sun-distance gauges, resource
  readouts, time controls.
- **Forecast panel:** temperature timeline with a widening uncertainty cone.
- **Build/colony panel:** placement and management.
- **Event banners:** clear, dramatic callouts for Tri-Solar Day / Flying Star / Great Rip.
- **Onboarding:** a short guided first Stable→Chaotic cycle that teaches read → prepare →
  dehydrate → endure → rebuild.

---

## 9. Milestones

> Phases are ordered by dependency, not calendar time. Each ends in something runnable.

### Phase 0 — Project skeleton
- Vite + TypeScript + Three.js scaffold; CI lint/test; render a single lit sphere.
- **Exit:** `npm run dev` shows a 3D scene; `npm test` runs.

### Phase 1 — The physics sandbox (core risk first)
- Velocity Verlet N-body with 3 suns + planet, seeded ICs, softening, time scaling.
- System-view camera; visualize trajectories/orbital trails.
- Unit tests: energy/momentum sanity, determinism from seed.
- **Exit:** you can watch a real, chaotic three-body dance and trust it's stable & reproducible.

### Phase 2 — Climate & eras
- Flux → temperature model with thermal lag; era classifier; forecast with decaying confidence.
- HUD with temperature band, sun gauges, era label.
- **Exit:** Stable/Chaotic Eras emerge naturally and are readable on screen.

### Phase 3 — Survival gameplay
- Resources, build/shelter system, dehydrate/rehydrate, ration, win/lose conditions.
- Planet/colony camera view.
- **Exit:** a full survival loop is playable end-to-end with a score.

### Phase 4 — Events, art & audio pass
- Named events (Tri-Solar Day, Flying Star, Great Rip) with VFX + audio.
- Shader/lighting/post polish; adaptive ambience.
- **Exit:** the world *feels* like Trisolaris.

### Phase 5 — Meta & polish
- Save/load, seed sharing, onboarding tutorial, difficulty tuning, settings, performance pass.
- **Exit:** shippable v1.

---

## 10. Proposed Repository Structure

```
3body/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── PLAN.md
├── public/                 # static assets (textures, audio)
└── src/
    ├── main.ts             # bootstrap + game loop
    ├── core/
    │   ├── loop.ts         # fixed/variable timestep loop
    │   ├── store.ts        # central game state
    │   └── rng.ts          # seedable RNG
    ├── sim/
    │   ├── nbody.ts        # integrator + gravity
    │   ├── bodies.ts       # sun/planet definitions
    │   ├── climate.ts      # flux → temperature
    │   ├── eras.ts         # classifier + forecast
    │   └── events.ts       # named event detection
    ├── game/
    │   ├── resources.ts
    │   ├── colony.ts       # buildings/shelters
    │   ├── population.ts   # dehydrate/rehydrate
    │   └── rules.ts        # win/lose
    ├── render/
    │   ├── scene.ts
    │   ├── suns.ts         # emissive shaders + lights
    │   ├── planet.ts
    │   ├── sky.ts
    │   ├── camera.ts       # system & colony rigs
    │   └── vfx.ts
    ├── ui/
    │   ├── hud.ts
    │   ├── forecast.ts
    │   └── panels.ts
    └── audio/
        └── audio.ts
```

---

## 11. Key Technical Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Chaotic sim "blows up" on close encounters | Softening factor; cap/clamp; upgrade to adaptive RK4; reject bad seeds at generation |
| Floating-point divergence breaks determinism | Fixed timestep; single integration path; document FP assumptions; seed-based regression tests |
| Pure chaos feels *unfair* rather than *tense* | Seed selection that guarantees a survivable opening; readable forecasts; thermal lag for reaction time |
| Performance (shaders + sim) in-browser | Sim on fixed step / optional Web Worker; instanced rendering; LOD; cap particle counts |
| Scope creep | Strict phase gates; each phase independently runnable; defer stretch goals |

---

## 12. Stretch Goals (post-v1)

- **Web Worker** for the simulation to free the main thread.
- **Procedural seed gallery** ("famous" survivable/brutal worlds to share).
- **Multiple colonies** / migration as conditions shift across the planet.
- **Narrative layer** — log entries / civilization "epochs" echoing the novel.
- **Godot/native port** for desktop builds.
- **VR system-view** for the three-body dance.

---

## 13. Suggested First Step

Approve this plan, then implement **Phase 0 + Phase 1**: a Vite/TS/Three.js skeleton with a working,
seeded, deterministic three-body simulation rendered in a system-view camera with orbital trails.
That single deliverable de-risks the entire project, because the chaotic three-sun dance is both the
core technical challenge and the central fantasy.
