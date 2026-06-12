# 3body — Trisolarian Survival (Web Demo)

A first-person browser survival demo set on a Trisolarian world: three chaotically orbiting suns, brutal Chaotic Eras, and brief hopeful Stable Eras. Explore ruins, discover text logs from prior civilizations, and try to endure.

**Stack:** Three.js · Vite · TypeScript · Web Audio API

**Play online:** [https://lawrence-via-mk1987.github.io/3body/](https://lawrence-via-mk1987.github.io/3body/) *(after GitHub Pages is enabled — see Deploy below)*

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
npm run build        # production build to dist/ (relative paths)
npm run build:pages  # build for GitHub Pages (/3body/ base)
npm run preview      # preview production build
```

## Deploy to GitHub Pages

1. In the repository **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Merge to `main`. The workflow in `.github/workflows/deploy.yml` builds and deploys automatically.
3. The demo will be available at `https://<username>.github.io/3body/`.

## Status

**Milestone 5 complete** — procedural ambience (wind, solar drone, stable pad), Stable Era banner/chime/particles/golden vignette, hydration recovery during Stable Eras, and GitHub Pages CI deploy.

| Milestone | Features |
|---|---|
| 1 | FPS scaffold, terrain, disclaimer |
| 2 | Three suns, orbital phases, temperature |
| 3 | Survival, shelters, dehydration |
| 4 | Ruins, text logs, era terrain |
| 5 | Audio, Stable Era polish, GitHub Pages deploy |

### Controls

- **WASD** — move · **Shift** — sprint · **Space** — jump
- **F** — read nearby log · **E** — dehydrate at pit · **Esc** — release mouse
