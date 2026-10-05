# 3body — Trisolarian Survival (Web Demo)

A first-person browser survival demo set on a Trisolarian world: three chaotically orbiting suns, brutal Chaotic Eras, and brief hopeful Stable Eras. Explore ruins, discover text logs from prior civilizations, and try to endure.

**Stack:** Three.js · Vite · TypeScript · Web Audio API

**Play online:** [https://lawrence-via-mk1987.github.io/3body/](https://lawrence-via-mk1987.github.io/3body/)

## Disclaimer

**This is a fan-inspired game inspired by the original *Three Body Problem* by Liu Cixin.**

This project is an unofficial, non-commercial fan work. It is not affiliated with, endorsed by, or connected to Liu Cixin, the *Remembrance of Earth's Past* series, or any rights holders. All original characters, settings, and story elements from the novels remain the property of their respective owners.

## Documentation

- [Game Design Document](./docs/GDD.md)
- [World intro (Three Body Problem context)](./docs/WORLD_INTRO.md)
- [Orbital System Specification](./docs/ORBITAL_SIM.md)
- [FF8-tier visuals & Unity fork plan](./docs/VISUAL_TARGET_FF8_UNITY_FORK.md)
- [Path B — Unity production plan](./docs/PATH_B_UNITY_PLAN.md)

## Development

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal. Choose **Continue from checkpoint** or **New cycle** to start first-person exploration.

```bash
npm run build        # production build to dist/ (relative paths)
npm run build:pages  # build for GitHub Pages (/3body/ base)
npm run preview      # preview production build
npm run export:unity # JSON snapshot for Unity fork → export/unity-snapshot/
```

### Unity fork (Path B)

1. Read [`docs/PATH_B_UNITY_PLAN.md`](./docs/PATH_B_UNITY_PLAN.md) and copy [`unity/MILESTONES.md`](./unity/MILESTONES.md) into your Unity repo.
2. Run `npm run export:unity` and copy `export/unity-snapshot/` into Unity `Assets/StreamingAssets/WebReference/` ([import guide](./unity/IMPORT_CONTENT_SNAPSHOT.md)).

## Deploy to GitHub Pages

Pages uses **GitHub Actions** (`build_type: workflow`). Each push to `main` runs `.github/workflows/deploy.yml` and publishes to `https://lawrence-via-mk1987.github.io/3body/`.

## Status

**Shipped:** Milestones 1–7 + flow polish (journal, checkpoints, [live demo](https://lawrence-via-mk1987.github.io/3body/)).  
**Next:** [GDD Milestone 8](./docs/GDD.md#visual-wayfinding) visual wayfinding (pit & grove), then Milestone 9 NPC vignettes.

| Milestone | Features |
|---|---|
| 1 | FPS scaffold, terrain, disclaimer |
| 2 | Three suns, orbital phases, temperature |
| 3 | Survival, shelters, dehydration |
| 4 | Ruins, text logs, era terrain |
| 5 | Audio, Stable Era polish, GitHub Pages deploy |
| Flow | Stable Era boost until Final Log, forecast strip, grove water, epilogue |

### Controls

- **WASD** — move · **Shift** — sprint · **Space** — jump
- **F** — read log · **T** — talk (Registrar / Last Predictor / Grove Keeper in Stable Era) · **J** — journal · **Tab** — compact HUD · **R** — drink at grove (Stable Era) · **E** — dehydrate at pit ring · **P / Esc** — pause
- **Beacons & HUD arrow:** amber → pit, cyan → observatory (until forecast calibrated), green → grove in Stable Era
- **Interaction chip** appears center-bottom when you can talk, read, drink, or dehydrate
- **Menu:** English / 简体中文 / 日本語 · **replay opening or meta cutscenes** (radio, distant sky, exodus, death) · procedural music toggle
