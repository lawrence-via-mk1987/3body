# Japanese locale and music — plan

**Status:** **in progress** (Oct 2026).  
**Shipped on branch `cursor/japanese-procedural-music-3d2d`:** locale `ja`, menu **日本語**, TTS scoring, full `ja` narrative tables (logs, NPCs, cutscenes), procedural **menu / chaos / stable** music beds + menu toggle (`3body_music_enabled`), duck under voice UI.  
**M1.5 (procedural polish):** phase-aware chaos filter (heat vs cold), richer menu/stable harmonics, `playPhaseEnterSting` on sky phase change.  
**Still optional later:** sampled OGG loops (M3), README locale line, grep CI for stray ternaries.  
**Related:** `docs/MUSIC_AND_VOICE_SOURCING.md` (fan demo licensing and sourcing).  
**Goal:** add **日本語** as a third language alongside English and 简体中文, and add **music** that makes Chaotic Eras, Stable Eras, and key story moments feel different — without breaking GitHub Pages, mobile Safari, or the fan-work disclaimer.

This remains unofficial fan work inspired by Liu Cixin’s ideas. Japanese copy and any music should be **original to this demo**, not lifted from the novel, drama, or licensed soundtracks.

---

## What we have now

| Area | Today |
|---|---|
| Locales | `Locale = 'en' \| 'zh'`. Menu toggles two buttons. `localStorage` key `3body_locale`. |
| Copy pattern | Mixed: some `Record<Locale, …>` tables (`introContent`, `storyContent`, `civilizationStages`, `questContent`, …), many `locale === 'zh' ? … : …` branches in UI and `Game.ts`. |
| NPC dialogue | Full trees in English and 中文 (`*_DIALOGUE`, `*_DIALOGUE_ZH`). Moral nodes built per locale in `npcDialogue.ts`. |
| Logs | English in `logs.ts`; 中文 in `i18n/logContent.ts`. |
| Voice | `NarrationDirector` + `voiceSelection.ts` picks **en** or **zh** TTS voices. Per-role prosody in `voiceProfiles.ts`. |
| Cutscenes | Witness lines in `cinematic/sceneContent.ts` (en + zh). |
| Static HTML | Most HUD strings live in `index.html` in English only; runtime code overwrites many labels when locale is 中文 via `main.ts` / `LocaleMenu`. |
| Audio | `AudioDirector` only: procedural wind, solar drone, stable pad, one-shot chime and log blip. **No music loops, no sampled files.** Master volume slider; unlock banner for iOS gesture. |

---

## Part A — Japanese (日本語)

### What “Japanese version” means here

Same game, same map, same rules. All **player-facing** text and **spoken narration** available in Japanese when the player selects 日本語 on the menu:

- World intro, disclaimer, menu, mobile HUD, interaction prompts
- Quest journal, story letters, sky omens, toasts
- All eight observation logs
- All three NPC dialogue trees (including calibration labels)
- Witness opening, death, and epilogue cutscene subtitles + TTS
- Epilogue and civilization stage names

We do **not** need to translate developer comments or README in the first pass unless you ask.

### Approach

**1. Extend the locale type**

- `Locale = 'en' | 'zh' | 'ja'`
- `loadLocale()` / `saveLocale()` accept `'ja'`
- Menu: third button **日本語** (`#locale-ja`), same toggle pattern as today

**2. Stop growing ternary chains**

Add a tiny helper so new languages do not require touching fifty files:

```typescript
// i18n/strings.ts (sketch)
export function pick<T>(locale: Locale, table: Record<Locale, T>, fallback: T): T {
  return table[locale] ?? table.en ?? fallback;
}
```

Then migrate hot paths:

- `main.ts` mobile chrome (Run, Journal, …)
- `Journal.ts`, `InteractionPrompt.ts`, `StoryOverlay.ts`, death/epilogue meta in `Game.ts`
- Prefer expanding existing `Record<Locale, …>` blobs over inline ternaries

**3. Translation inventory (must be complete for “done”)**

| Bucket | Where it lives today | JA work |
|---|---|---|
| Menu + intro | `introContent.ts`, `disclaimer.ts`, `index.html` hints | New `ja` entries; optional static HTML defaults |
| HUD / mobile | `main.ts`, `MobileHudSheet.ts`, `InteractionPrompt.ts` | `ja` strings |
| Narrative | `storyContent.ts`, `questContent.ts`, `skyOmens.ts`, `deathObjective.ts` | `ja` entries |
| Meta | `civilizationStages.ts`, `epilogueContent.ts`, `CivilizationCounter.ts` | `ja` entries |
| Logs | `logContent.ts` | Eight `ja` titles + bodies |
| NPCs | New `*_DIALOGUE_JA` or shared export pattern | Mirror EN tree structure |
| Cutscenes | `sceneContent.ts` | `ja` beats for opening, death, victory |
| Phase labels (calibration) | `predictorDialogue.ts` | `PHASE_LABELS_JA` |

**4. Voice (TTS)**

- Extend `voiceSelection.ts`: prefer `ja-JP` voices (e.g. Kyoko, Otoya, Google 日本語, Microsoft Nanami/Ichiro patterns — same scoring idea as EN/ZH).
- Extend `narrationProsody` for `ja` (slightly slower rate, neutral pitch).
- `voiceProfiles.ts` unchanged in roles; Witness still `witness`.

Browser TTS quality varies on iOS; subtitles remain mandatory.

**5. Typography and layout**

- Japanese body text: keep line-height ≥ 1.65; allow `word-break: normal` (no forced break-all).
- Check long quest lines on 390px width; shrink font or shorten copy if needed.
- Stable Era banner already mixes 恒纪元 with English; for `ja` use **恒紀元** + Japanese subtitle only.

**6. QA checklist**

- Switch to 日本語 on menu → intro, disclaimer, and controls update without reload.
- New game: Witness opening speaks Japanese if narration is on.
- Talk to each NPC; read each log; die once (heat); clear cycle once (debug Final Log if needed).
- Replay opening intro from menu in `ja`.
- Narration off → all text still correct.

**Done when:** a player can complete one full cycle in Japanese with no English fallback in UI, dialogue, logs, or cutscene subtitles (except proper nouns you choose to keep, e.g. “Trisolaris”).

### Suggested order (Japanese)

1. **Locale plumbing** — type, menu, `pick()` helper, migrate `main.ts` + `LocaleMenu`.
2. **Tables** — add `ja` to every existing `Record<Locale, …>` file.
3. **Logs + NPC trees + cutscenes** — largest writing effort.
4. **TTS** — voice scoring + one device smoke test.
5. **Polish** — mobile layout, README line “English / 中文 / 日本語”.

### Risks (Japanese)

| Risk | Response |
|---|---|
| Incomplete translation (ternaries forgotten) | Grep for `locale === 'zh'` and `'en'` assumptions; CI grep check optional |
| Huge diff | One PR per bucket (UI tables → NPCs → logs) |
| TTS reads English log with Japanese voice | Block Phase 3 until `ja` log copy exists (same rule as 中文) |
| HTML still English before first paint | Accept brief flash or generate menu labels from JS only |

---

## Part B — Music

### What “add music” means here

**Music** = sustained listening experience under gameplay: a **menu theme**, a **Chaotic Era** bed, a **Stable Era** bed, and short **stings** for death, Final Log, and maybe Stable Era entry — mixed with the existing wind/solar layers, not replacing them.

Two viable strategies:

| Strategy | Pros | Cons |
|---|---|---|
| **B1 — Procedural music (Web Audio)** | No download size; fits current `AudioDirector`; Pages-friendly | Sounds “synthetic”; harder to feel “cinematic” |
| **B2 — Short loop assets (OGG/MP3)** | Real mood; memorable Stable / chaos contrast | File size, licensing, load time, codec support |

**Recommendation:** ship **B1 first** (extend what you already have), then **B2** only if you have licensed or original loops ready (see Phase M3).

### Design targets (either strategy)

| Context | Feel | When it plays |
|---|---|---|
| Main menu | Sparse, distant, three “suns” as harmonics | Menu visible, ducked under SFX |
| Chaotic Era | Low drone + irregular pulse; heat = brighter partials; cold = thinner, windy | `era !== 'stable'`, crossfade by `phase` |
| Stable Era | Consonant pad, slow pulse, space for the chime | `era === 'stable'`; duck when cutscene speaks |
| Tri-Solar / Flying Star | Short tension rise (filter sweep or layer swell) | On phase enter (once per transition) |
| Death cutscene | Drop to near-silence, one low note | During Witness death beat |
| Victory / Final Log | Same family as Stable, major resolution | Epilogue cutscene |
| UI | Keep existing log blip and Stable chime; optional soft “talk open” pad | Unchanged or +3 dB under music |

All music respects **master volume** and **mute** when `AudioDirector.stop()` (death overlay, quit).

### Approach B1 — Procedural (recommended Phase M1)

Extend `AudioDirector` (or a small `MusicDirector` owned by it):

- **`musicBus`** gain node between layers and `masterGain`.
- **Chaos bed:** slow arpeggio or two detuned sines + band-pass noise (reuse wind buffer at lower level).
- **Stable bed:** existing stable oscillators become the seed; add 0.05 Hz amplitude LFO and gentle high-pass on chaos when crossfading.
- **Menu bed:** activate when `!game.running && menu visible` (hook from `main.ts` / `Game.quitToMenu`).
- **Crossfade:** 2–4 s `setTargetAtTime` when `OrbitalDirector` era or phase changes; reuse `update(era, phase, temperature)`.
- **Phone tier:** optional `renderQuality.musicLayers: boolean` — on phone, stable pad only, no arpeggio.

**Done when:** toggling from Scorch to Stable Era is obviously different by ear; menu has a distinct idle bed; death cutscene ducks music to near zero.

### Approach B2 — Asset loops (Phase M2/M3)

If you add files:

- **Format:** OGG Vorbis primary, MP3 fallback for old Safari if needed.
- **Placement:** `public/audio/` (Vite copies to `dist/`); paths like `/3body/audio/chaos-loop.ogg` with Vite `base`.
- **Size budget:** aim **&lt; 2 MB total** for all loops (phone, GitHub Pages).
- **Loading:** decode on first `unlockFromGesture`; show “Loading audio…” only if decode &gt; 500 ms.
- **License:** document in `public/audio/CREDITS.md` (author, license, URL). **No** drama OST rips.

**Stems (optional M3):** separate 30–60 s loops for `chaos`, `stable`, `menu`; crossfade in Web Audio `AudioBufferSourceNode` loops.

### UI controls (both strategies)

- **Music** toggle separate from **Spoken narration** (default on).
- Persist `3body_music_enabled` in `localStorage`.
- Pause menu: “Music” on/off next to master volume (optional).

### Suggested order (music)

1. **M1 — Procedural beds** — menu + chaos/stable crossfade; duck under cutscenes and `setCinematicBed`.
2. **M2 — Controls** — music toggle, pause-menu hook, README note.
3. **M3 — Asset loops (optional)** — only after you supply or commission loops; swap procedural beds per era.

### Risks (music)

| Risk | Response |
|---|---|
| iOS silent until tap | No autoplay; same unlock banner as today |
| Music fights TTS | Duck `musicBus` −12 dB while `NarrationDirector` speaks; restore on end |
| Loop seam clicks | Procedural: long periods; assets: crossfade 500 ms at loop point |
| CPU on phone | Quality tier disables arpeggio / second loop |
| User hate “drone” | Toggle off; keep wind-only mode |

---

## What stays untouched

- Gameplay, map coordinates, orbital sim, save format (locale is client-only)
- GitHub Pages deploy path and Vite `base`
- Fan disclaimer and “not the TV drama” rule
- No licensed drama music or copied Japanese dub lines from adaptations

---

## Combined suggested roadmap

| Step | Deliverable |
|---|---|
| 1 | Japanese locale plumbing + menu + `Record<Locale>` tables for UI/narrative |
| 2 | Japanese logs, NPC trees, cutscenes, TTS |
| 3 | Music M1 procedural beds + ducking under voice |
| 4 | Music M2 player controls |
| 5 (optional) | Asset loops M3 + `CREDITS.md` |
| 6 (optional) | README screenshots with 日本語 HUD |

Agree on **B1 vs B2** for music before coding M1. Japanese can start independently in step 1.
