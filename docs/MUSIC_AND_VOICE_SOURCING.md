# Music and voice sourcing — fan demo

**Status:** reference for this non-monetized fan project.  
**Context:** Trisolarian Survival on GitHub Pages is a **public fan demo**, not monetized. That still counts as **distribution**, so track licenses must allow use inside a game.

---

## Music

### Recommended now: procedural + free libraries

| Approach | Cost | Sign up? | Notes |
|---|---|---|---|
| **Procedural beds (Web Audio)** | Free | No | Implemented in `AudioDirector` — menu / chaos / stable crossfades. No files, no license file required. |
| **[Pixabay Music](https://pixabay.com/music/)** | Free | Free account recommended | [Content License](https://pixabay.com/service/license-summary/) — use inside a creative work, not as standalone downloads. Optional credit in `public/audio/CREDITS.md`. |
| **[OpenGameArt](https://opengameart.org)** | Free | Yes to download | Check **per-track** license (CC0, CC-BY, …). |
| **[Freesound](https://freesound.org)** | Free | Yes | Per-sound license; good for one-shots and ambience. |
| **[Incompetech](https://incompetech.com)** | Free | No | Attribution required in credits. |

When adding file loops later: keep total size modest (~2 MB), use OGG, list everything in `public/audio/CREDITS.md`.

### Not recommended for this demo

| Approach | Why |
|---|---|
| **Suno free tier** | Personal / non-commercial; poor fit for a public game. |
| **Suno API (any tier)** | No self-serve game API; runtime generation is costly and fragile on Pages. |
| **Suno paid (optional later)** | OK to **manually download** a few loops while subscribed, then ship OGG in the repo — not live API. |
| **TV / drama OST** | Do not rip or mimic licensed scores. |

See also `docs/JAPANESE_AND_MUSIC_PLAN.md` for phased music design (M1–M3).

---

## Voice

### Today

- **Browser TTS** via `NarrationDirector` — free, works offline, quality varies by device.
- Per-role prosody in `voiceProfiles.ts`.

### MiniMax (platform.minimax.io)

- **Free** = signup + possible **trial credits**; ongoing TTS is **pay-as-you-go** (not viable for full game dialogue at scale).
- **Do not** put API keys in the GitHub Pages client.
- **Do not** clone drama or actor voices.
- **Possible later:** generate **short `.ogg` clips offline** with trial/paid credits (Witness pilot, key lines only), commit to repo if terms allow redistribution.

### Suno

- Not used for voice. See music section above.

---

## Implementation priority (agreed)

1. **日本語** locale — see `docs/JAPANESE_AND_MUSIC_PLAN.md` Part A.  
2. **Procedural music loops** — M1 in `docs/JAPANESE_AND_MUSIC_PLAN.md` Part B / B1.  
3. Optional: Pixabay OGG loops + `CREDITS.md`.  
4. Optional: MiniMax baked clips for selected lines.
