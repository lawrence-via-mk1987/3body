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
- [Realism roadmap (Phases 5a–5d)](./docs/REALISM_NEXT_STEPS.md)
- [Performance tiers (iPhone-first)](./docs/PERF.md)

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
```

## Deploy to GitHub Pages

Pages uses **GitHub Actions** (`build_type: workflow`). Each push to `main` runs `.github/workflows/deploy.yml` and publishes to `https://lawrence-via-mk1987.github.io/3body/`.

## Status

**Shipped:** Milestones 1–7, voice/cutscene phases, Japanese locale, procedural music beds (menu / chaos / stable), realism phases **5a–5d** (triplanar terrain, pit glTF rim, mobile perf pass). [Live demo](https://lawrence-via-mk1987.github.io/3body/).

**Locales:** English · 简体中文 · 日本語 (menu + HUD + logs/NPCs where translated).

**Audio:** Master volume slider (boosted for small speakers) · **Music** toggle (persisted) · wind/solar layers · death cutscene ducks to a low bed.

**Next:** Optional humanoid glTF (5c follow-up), asset music loops (M3), [GDD Milestone 8](./docs/GDD.md#visual-wayfinding) wayfinding polish.

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
- **Menu:** locale picker (en / zh / ja) · world intro · **Music** + **Spoken narration** toggles · skippable Witness opening (replay from menu)
