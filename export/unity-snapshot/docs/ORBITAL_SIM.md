# Orbital System Specification

## Design goal

Simulate the *feel* of three chaotically orbiting suns over a Trisolarian world — without running a real-time N-body integrator. The system must be:

- **Predictable enough** to support a forecast UI with uncertainty
- **Chaotic enough** to create dread and surprise
- **Cheap enough** to run at 60 FPS in a browser (Three.js)

---

## Architecture

```
OrbitalDirector (singleton)
├── EraStateMachine     → Stable | Chaotic | Transition
├── SunPhaseController  → per-sun: position, scale, intensity
├── TemperatureField    → global + local modifiers
└── ForecastModel       → short-horizon prediction with noise
```

Each frame, `OrbitalDirector.update(dt)` advances phase timers and writes sun transforms to Three.js objects.

---

## Sun bodies

Three distinct suns (visual + gameplay identity):

| ID | Name (internal) | Color | Role |
|---|---|---|---|
| `sun_a` | Primary | Warm orange | Most common dominant sun |
| `sun_b` | Companion | Pale yellow-white | Binary / tri-solar partner |
| `sun_c` | Distant red | Deep red | Flying star candidate; largest apparent scale swings |

Each sun is a `SunBody`:

```typescript
interface SunBody {
  id: string;
  mesh: THREE.Mesh;       // billboard or sphere with emissive shader
  light: THREE.Light;     // only sun_a casts shadows in MVP
  phaseOffset: number;
  eccentricity: number;   // 0–1, drives apparent size swing
  active: boolean;        // below horizon or "dormant"
}
```

---

## Phase state machine

Global era drives allowed phase transitions:

### Chaotic Era phases

| Phase | Duration (tunable) | Sun layout | Temperature |
|---|---|---|---|
| `deep_cold` | 30–90 s | 0–1 sun, low intensity | −2 (scale: −3 to +3) |
| `thaw` | 20–40 s | 1 sun rising | 0 → +1 |
| `scorch` | 30–60 s | 1–2 suns high | +2 |
| `binary_chaos` | 20–50 s | 2 suns, rapid azimuth | oscillating ±2 |
| `tri_solar` | 10–25 s | 3 suns visible | +3 (lethal without shelter) |
| `flying_star` | 8–15 s | 1 sun at near horizon, scale ×3 | +3, lethal surface |
| `eclipse_relief` | 5–15 s | sun(s) occluded | −1 (brief respite) |

Transitions use weighted random selection with **cooldowns** so tri-solar and flying star cannot chain back-to-back.

### Stable Era

| Phase | Duration | Sun layout | Temperature |
|---|---|---|---|
| `stable_golden` | 120–300 s (demo: fixed 180 s) | 1 sun, gentle arc | +0.5 (comfort band) |

Entry: random roll when Chaotic phase ends (~8% chance per transition in demo).  
Exit: abrupt transition to `deep_cold` or `scorch` — no warning timer in MVP (hope-in-cycles: savor it while it lasts).

---

## Position model (not N-body)

Sun positions are computed on a **celestial sphere** around the player:

```typescript
// Pseudocode
azimuth = baseAzimuth + sin(t * freq + phaseOffset) * amplitude
elevation = baseElevation + cos(t * freq2) * eccentricity * 60°
apparentScale = baseScale * (1 + eccentricity * proximityFactor)
intensity = baseIntensity * apparentScale^2
```

- `proximityFactor` spikes during `flying_star` (sun appears to "fly" toward the planet)
- Suns below `elevation < 0` are dormant (no direct heat contribution)
- Player position does not affect sun math in MVP (infinite distant sky)

---

## Temperature field

Global surface temperature index `T` (−3 to +3):

```
T = sum(activeSunContribution) + eraModifier + shelterModifier + depthModifier
```

| Modifier | Value |
|---|---|
| Per active sun | `intensity * cos(elevation)` clamped |
| Chaotic Era | ±0.5 noise sweep |
| Stable Era | clamp T to [−0.5, +1] |
| Inside shelter | −1.5 |
| Underground (per meter) | −0.3 |

Player survival bands:

| T | Effect |
|---|---|
| ≤ −2 | Freezing damage |
| −1 to +1 | Safe (with hydration) |
| +2 | Heat damage |
| ≥ +3 | Rapid heat death |

---

## Forecast model

Short-horizon prediction for the diegetic instrument UI:

1. `OrbitalDirector` exposes `getForecast(secondsAhead): ForecastEntry[]`
2. Forecast returns **probable** phase, not exact — ±1 phase uncertainty beyond 30 s
3. Meta unlock (discovered logs) reduces uncertainty and extends horizon

```typescript
interface ForecastEntry {
  timeOffset: number;      // seconds from now
  phase: EraPhase;
  confidence: number;      // 0–1
  temperatureRange: [number, number];
}
```

---

## Rendering notes (Three.js)

- **Sky:** `SkyShader` or custom gradient dome; color lerps by dominant phase
- **Suns:** emissive spheres + optional lens flare sprite (performance: max 3)
- **Shadows:** only `sun_a` casts shadow map in MVP
- **Fog:** density tied to heat (+) and cold (−) for atmosphere
- **Post-processing:** subtle color grading shift per era (optional, desktop only)

---

## Demo tuning constants

Stored in `src/orbital/config.ts` for easy playtesting:

```typescript
export const ORBITAL_CONFIG = {
  chaoticPhaseMinSec: 20,
  chaoticPhaseMaxSec: 90,
  stableEraChance: 0.08,
  stableEraDurationSec: 180,
  triSolarLethalThreshold: 3,
  forecastHorizonSec: 45,
  forecastBaseConfidence: 0.6,
};
```

---

## Future extensions (post-demo)

- Multiple shadow-casting suns with blended shadow maps
- Sun trails / cultural "sky writing" in Stable Eras
- Seasonal variation across meta-progression runs
- Optional debug overlay showing true phase timeline (dev only)
