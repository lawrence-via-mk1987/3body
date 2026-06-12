# 3body — Trisolarian Survival (Web Demo)

A first-person browser survival demo set on a Trisolarian world: three chaotically orbiting suns, brutal Chaotic Eras, and brief hopeful Stable Eras. Explore ruins, discover text logs from prior civilizations, and try to endure.

**Stack (planned):** Three.js · Vite · TypeScript · Rapier3D

## Disclaimer

**This is a fan-inspired game inspired by the original *Three Body Problem* by Liu Cixin.**

This project is an unofficial, non-commercial fan work. It is not affiliated with, endorsed by, or connected to Liu Cixin, the *Remembrance of Earth's Past* series, or any rights holders. All original characters, settings, and story elements from the novels remain the property of their respective owners.

## Documentation

- [Game Design Document](./docs/GDD.md)
- [Orbital System Specification](./docs/ORBITAL_SIM.md)

## Development

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal. Click **Enter the wasteland** to start first-person exploration.

```bash
npm run build   # production build to dist/
npm run preview # preview production build
```

## Status

**Milestone 3 complete** — survival loop with hydration, heat/cold damage, dehydration at the pit, shelter zones, and death/restart.

- Milestone 1: FPS scaffold, terrain, disclaimer overlay
- Milestone 2: three suns, orbital phases, temperature + forecast
- Milestone 3: `SurvivalSystem`, shelters, dehydration (E at pit), vitals HUD

Game now starts in **Thaw** with a visible rising sun. Seek the underground shelter (east of spawn) or dehydration pit (northwest) when phases turn lethal.

Next: Milestone 4 — ruins, era-dependent terrain, environmental storytelling.
