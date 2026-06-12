# Trisolaris: A Three-Body Survival Game — Design & Build Plan

A browser-based 3D game inspired by the Trisolaran world from Liu Cixin's
*The Three-Body Problem*. The player inhabits a planet caught in the
gravitational pull of **three suns whose orbits are chaotic and
unpredictable**. The single objective: **survive** the alternating Stable
Eras and Chaotic Eras for as long as possible.

---

## 1. Core Concept

In the novel, Trisolaris orbits a three-star system. Because the three-body
problem has no general closed-form solution, the climate swings wildly:

- **Stable Eras** — the planet settles into a temporary, semi-regular orbit
  around one sun. Survivable. Time to grow your civilization.
- **Chaotic Eras** — gravitational tug-of-war flings the planet around.
  This produces catastrophes the player must read the sky to anticipate:
  - **Tri-solar day** (all three suns close/visible): scorching heat, fire.
  - **Flying star → deep freeze** (all suns far away): the world freezes.
  - **Twin/triple suns rising**: rapid, violent temperature spikes.
  - **Long night / wandering**: prolonged darkness and cold.

The signature survival verb, taken straight from the book, is
**Dehydrate / Rehydrate**: when a Chaotic Era is coming, the civilization
"dehydrates" into a dormant, damage-resistant state and stores itself.
When a Stable Era returns, it "rehydrates" and resumes progress. Mis-timing
this — staying active into a catastrophe, or hibernating through a perfectly
good Stable Era — costs you.

**Win condition:** there is no "win," only a score = total civilization
progress accumulated and eras survived. The game is about how long and how
well you last.

---

## 2. What Makes It Fun (Design Pillars)

1. **Read the sky, predict the chaos.** The 3-sun motion is a *real* physics
   simulation, so the danger is emergent and never scripted. Skill = learning
   to forecast.
2. **Risk/reward of activity vs. dormancy.** Staying "rehydrated" longer earns
   more progress but risks annihilation.
3. **Authentic source-material flavor.** Eras, dehydration, "the sun(s) will
   rise" calendar guesses, civilization restarts.
4. **A genuinely beautiful sky.** Three colored suns, eclipses, long shadows,
   aurora-like extremes. The spectacle *is* the threat.

---

## 3. Technology Stack

| Concern              | Choice                                   | Why |
|----------------------|------------------------------------------|-----|
| Rendering            | **Three.js** (WebGL)                     | Mature 3D in the browser, large ecosystem |
| Language             | **TypeScript**                           | Type safety for physics/state code |
| Build/dev server     | **Vite**                                 | Fast HMR, simple config |
| State management     | Lightweight custom store (or **Zustand** if React UI) | Game loop owns truth; UI subscribes |
| UI / HUD             | DOM + CSS overlay (optionally React)     | Crisp text, easy layout over the canvas |
| Physics              | Custom **N-body integrator** (RK4 / Velocity-Verlet) | The three-body problem is the game |
| Audio                | Web Audio API / Howler.js                | Ambience + warning cues |
| Testing              | **Vitest**                               | Unit-test the physics & era logic |
| Lint/format          | ESLint + Prettier                        | Consistency |

No backend required for v1 (single-player, local). High scores can live in
`localStorage`.

---

## 4. Simulation Model

### 4.1 N-Body Physics
- Bodies: 3 suns (varying masses) + 1 planet. Optionally treat the planet as a
  massless test particle for stability, or fully interacting for realism.
- Integrator: **Velocity Verlet** (cheap, energy-stable) for the suns;
  consider **RK4** if we want higher accuracy. Fixed timestep with an
  accumulator, decoupled from render framerate.
- Gravity: `F = G * m1 * m2 / r^2`, softened (`r^2 + ε^2`) to avoid singular
  blowups on close passes.
- Initial conditions: seed from known interesting three-body configurations
  (e.g. figure-eight choreography perturbed, or random-but-bounded) so each
  game seed feels different. Support a `seed` for reproducibility.

### 4.2 Derived Climate (the survival layer)
From the simulation, compute per-tick planetary climate:
- **Insolation** = Σ over suns of `luminosity / distance^2`, modulated by which
  suns are above the planet's horizon (day/night via planet rotation).
- **Temperature** integrates toward a target driven by insolation, with thermal
  inertia (it doesn't snap instantly — gives the player reaction time).
- **Era classifier**: rolling window over temperature/insolation variance →
  label current era *Stable* or *Chaotic*, plus a forecast confidence.

### 4.3 Forecasting (player tools)
- A short-horizon predictor runs the integrator ahead N steps to render a
  faint "sky forecast" the player can buy/upgrade. Higher civilization tech =
  longer/clearer forecast. This is the core upgrade path.

---

## 5. Game Systems

- **Resources:** Population (civilization size), Stored Biomass/Water,
  Knowledge/Tech, Heat & Cold damage meters.
- **Actions:**
  - `Rehydrate` (go active) → accrue Knowledge & Population, consume reserves.
  - `Dehydrate` (hibernate) → safe, but no progress; small upkeep.
  - `Build/Research` → spend Knowledge on better forecasting, hardier storage,
    faster rehydration, larger population caps.
- **Catastrophe damage:** if active during extreme heat/cold, lose population
  and reserves. Severe events can trigger a **Civilization Collapse** (soft
  reset that keeps a fraction of Knowledge — "Civilization #N begins").
- **Scoring:** highest civilization level reached × eras survived; tracked in
  `localStorage` leaderboard.

---

## 6. Rendering & Visuals

- **Suns:** emissive sphere shaders, distinct colors/sizes by mass, bloom
  post-processing, lens-flare-ish glow. Real-time point lights (3 colored
  lights) so shadows shift dramatically.
- **Planet:** terrain (sphere or local heightmap), surface tint that responds
  to temperature (lush → scorched → frozen). Day/night terminator.
- **Atmosphere/sky:** color graded by which suns are up; eclipses; a starfield.
- **HUD:** temperature gauge, era indicator, forecast strip, resource bars,
  Dehydrate/Rehydrate button, era/score counters.
- **Camera:** orbit/free-look around the planet, plus a "system view" to watch
  the three-body dance from outside.
- **Post-processing:** bloom, tone mapping (ACES), subtle vignette.

---

## 7. Architecture & File Layout

```
3body/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/                 # static assets (textures, audio)
└── src/
    ├── main.ts             # bootstrap: renderer, loop, wiring
    ├── core/
    │   ├── GameLoop.ts     # fixed-step accumulator loop
    │   ├── GameState.ts    # authoritative state + events
    │   └── rng.ts          # seedable PRNG
    ├── sim/
    │   ├── NBody.ts        # bodies, integrator (Verlet/RK4)
    │   ├── Climate.ts      # insolation → temperature → era
    │   └── Forecast.ts     # look-ahead predictor
    ├── game/
    │   ├── Civilization.ts # resources, dehydrate/rehydrate, collapse
    │   ├── Events.ts       # catastrophe detection & effects
    │   └── Score.ts        # scoring + localStorage leaderboard
    ├── render/
    │   ├── Scene.ts        # three.js scene graph
    │   ├── Suns.ts         # sun meshes + lights + shaders
    │   ├── Planet.ts       # planet mesh + temperature shading
    │   ├── SkyEffects.ts   # bloom, starfield, eclipses
    │   └── Camera.ts       # orbit + system views
    └── ui/
        ├── HUD.ts          # gauges, bars, era/forecast strip
        └── Controls.ts     # buttons, keybindings
```

Key principle: **the simulation is headless and pure** (testable without
WebGL); the render and UI layers only *read* `GameState`.

---

## 8. Milestones (incremental, each is playable/demoable)

**M0 — Project scaffold**
- Vite + TS + Three.js + ESLint/Prettier + Vitest. Spinning sphere on screen.

**M1 — N-body sandbox**
- 3 suns + planet integrating under gravity. System-view camera. Trails.
- Unit tests: energy/momentum roughly conserved over time; no NaN blowups.

**M2 — Climate layer**
- Insolation, temperature with inertia, day/night, Stable/Chaotic classifier.
- On-screen temperature & era readout.

**M3 — Survival core loop**
- Resources + Dehydrate/Rehydrate + catastrophe damage + collapse/restart.
- This is the first *actually-a-game* build.

**M4 — Forecasting & tech tree**
- Look-ahead sky forecast; spend Knowledge to upgrade forecast/storage/etc.

**M5 — Visual polish**
- Sun/planet shaders, bloom, eclipses, temperature-driven terrain tinting,
  shadows, audio cues for incoming catastrophes.

**M6 — Meta & UX**
- HUD finalize, tutorial/onboarding, scoring + local leaderboard, seed sharing,
  pause/settings, performance pass (target 60fps mid-range laptop).

**Stretch ideas**
- Multiple difficulty seeds / daily challenge seed.
- "Sophon"-style end-game threats; named historical eras; photo/share mode.
- Save/resume; accessibility (colorblind-safe gauges, reduced-motion).

---

## 9. Risks & Mitigations

- **Chaotic sim → unwinnable or boring runs.** Mitigate by selecting seeds that
  guarantee a survivable opening Stable Era and tuning event frequency; cap how
  hard/fast catastrophes ramp early.
- **Numerical instability on close encounters.** Gravitational softening +
  fixed small timestep + substepping during close passes.
- **Performance (post-processing + lights).** Budget draw calls, use
  instancing for stars/particles, make effects quality-tiered.
- **Scope creep.** M3 is the minimum lovable game; everything after is polish.

---

## 10. Definition of Done (v1)

- Loads in a modern browser, 60fps on a typical laptop.
- A full loop is playable: read sky → time dehydration → survive eras → score.
- Physics is a real interacting three-body system (not scripted).
- Core sim + era logic covered by unit tests; lint/format clean.
- README explains controls, the survival mechanic, and how to run/build.
