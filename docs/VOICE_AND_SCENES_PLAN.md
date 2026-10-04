# Voice and performed scenes — plan

**Status:** draft. Nothing here is built until a phase is explicitly started.  
**Goal:** stop handing the player a paragraph when someone speaks, when a log opens, when the world is introduced, and when a civilization ends. Those moments are heard, and the two big ones are watched.

This is a fan-inspired sketch of Liu Cixin’s ideas. The speaker, the robe, and the lines are original. Do not copy a character, costume, voice, or shot from the novel or the TV drama.

---

## What we have now

| Moment | Today |
|---|---|
| Opening | Three text cards (`IntroCinematic`). Optional browser voice reads the card if the narration box is checked. |
| NPC talk | Silent panel. Registrar, Last Predictor, and Grove Keeper each have a small tree in English and 中文. |
| Observation logs | Eight English tablets. Opening one shows title and body. No voice. No Chinese text. |
| Story beats | A text card. If narration is on, the browser reads it. |
| You die | A panel: “Another cycle falls” plus one sentence for heat, cold, or thirst. |
| You finish a cycle | A panel: the Final Log epilogue as a paragraph, including which age ended and which age is next. |
| Voice engine | `NarrationDirector` — `speechSynthesis`, English or 中文 voice picked from the device, cancel-and-queue already works. Used by the intro, story beats, and one Stable Era line. |

The words already exist. The performance does not.

---

## What “don’t just read words” means here

Subtitles stay. Sound can fail, a bus is loud, and both languages have to be readable. The change is that the line is **spoken while something on screen is doing the thing the line is about**.

- An NPC line plays as that NPC’s voice while their panel is open. Closing the panel or picking a reply cuts the voice.
- A log plays as a found voice while the tablet is open.
- The opening is a short scene: a robed witness, three suns, then the invitation to walk out. Not three cards.
- A civilization ending is a short scene of the **cause** — the suns, the freeze, the empty water, or the age closing because the log was carried — then one button to continue. Not a death paragraph.

Out of scope: a new combat system, recorded actors in this pass, licensed audio, and a full-screen scene every time a Stable Era ends. Chaos returning mid-run stays a banner and the one spoken line that already exists. A scene on every phase change would stop play constantly.

---

## Approach

One voice path, one scene player, original lines.

**Voice.** Keep `NarrationDirector`. It already handles the narration toggle, English / 中文, and the rule that speech must start from a tap (Talk, Read, Continue, Enable sound). Give each speaker a pitch and rate so the registrar, the predictor, the keeper, and the witness are not the same cadence, even when the laptop only has one English voice.

The player’s reply buttons are not spoken. Those are the player’s choices. The NPC’s body text is spoken.

**Scenes.** A `CutscenePlayer` borrows the existing renderer and shows a small stage: ground disc, the current sky and suns, one figure from `buildHumanoidNpc`. A scene is a list of beats — duration, camera, sky phase, pose (`upright`, `skyward`, `tending`, `fallen`), and one spoken line with a subtitle. Skip is always available after the first moment, same as the intro is today (Esc, Skip). Phone quality uses the same stage with the phone light tier: one figure, no heat haze, no breath.

No video files. No downloaded character. If a beat’s line has no voice (toggle off, or the browser has no matching voice), the subtitle still advances on the beat timer.

**Line ids.** Every spoken sentence gets an id (`npc.registrar.flying_star`, `log.observatory`, `end.heat`, …). The browser voice reads the string for that id. Later, a recorded clip can replace that id without rewriting the scene.

---

## The witness

The opening and the endings are spoken by one original figure: **the Witness** (中文: 见证者). A survivor of a cycle that already fell. Ash-grey robe, no glowing sash, hood opened the way the other settlers’ hoods open. They are not the registrar, the predictor, or the keeper, and they are not anyone from the book.

They look up when the sky is the subject, and they face the camera when they speak to you.

---

## Phase 1 — Voice on talk and logs

- When a dialogue node opens, speak `speaker` is silent and `body` is spoken in the current language. Next node or close cancels the previous line.
- When a log opens, in the world or from the journal, speak title then body. Next/previous log cancels and speaks the new one.
- Write 中文 bodies for the eight logs. Chinese mode must not read the English tablet with a Mandarin voice.
- Per-speaker prosody on the existing utterance (registrar lower and slower, predictor a little higher, keeper warmer, logs a notch quieter, as if read off stone).
- Narration stays on by default for a new profile. The existing checkbox still turns it off.
- Subtitles remain the panel text. Do not hide the words.

**Done when:** talking to each of the three NPCs, in English and 中文, produces a voice that stops when the panel closes; opening each log does the same; a phone with narration off still shows the text.

## Phase 2 — Opening scene

Replace the three-card cinematic. The menu item “Replay opening intro” plays this scene and does not start a run. Skip still enters the wasteland.

Beats, about half a minute:

1. **No dawn.** Dark plain. One sun, then a second. The Witness is hooded, face in shadow, looking up.  
   *“Trisolaris has no gentle morning. Three suns pull, and the day does not keep its promise.”*
2. **Fire.** A third sun, low and large — the flying-star shape the game already has. Ground goes hot. The Witness turns slightly away.  
   *“In a Chaotic Era the sky kills. People fold into the pit and wait. Waiting is not the same as living.”*
3. **A held breath.** The suns ease. A little green on the ground. The Witness looks toward where the grove will be.  
   *“Sometimes the sky forgets to burn. That is a Stable Era. It ends. What you carry out of it is the whole point.”*
4. **To you.** The Witness faces the camera.  
   *“You are the next attempt. Walk. Read what they left. Look up — and look away when the horizon turns red.”*

Chinese lines are written with the English, not left for the browser to translate. Subtitles sit at the bottom. The old card copy can retire once these four lines are in.

**Done when:** a new game and “Replay opening intro” both play this scene with voice and moving suns; Skip still reaches the wasteland; the figure reads as a person, not a card.

## Phase 3 — When a civilization ends

Two endings. Both become scenes. Both are skippable. After the last beat, one button remains: **Begin again** on a death, **Walk into the next cycle** on a clear.

### Death — show the cause

The run already knows `heat`, `cold`, or `thirst`. The scene uses that, not a generic “you died.”

| Cause | What you see | What the Witness says |
|---|---|---|
| Heat | Suns swell. The figure staggers. The ground scorches. | The suns took this civilization. The numbers did not matter. The sky arrived first. |
| Cold | Suns drop. Frost climbs the robe. The figure folds. | Night came before the next dawn. The body froze while it was still counting on morning. |
| Thirst | A dry basin. The figure kneels. No green. | The water left before the sky did. A civilization can survive fire longer than it can survive an empty jar. |
| Anything else | The figure stands, then goes still under a dim sky. | This cycle stopped. The wasteland keeps the place for the next one. |

The objective line that tells you what to try next stays as a subtitle under the button. It is useful. It is not the scene.

### Cycle complete — show why this age closed

This is not a death. You read the Final Log. The scene is the grove in a Stable Era. The Witness sets a hand on a tablet.

The line names the age that just closed (`Clan wasteland`, `Dehydration age`, `Observation sect`, `Grove covenant`, `Unified cycle`) and the age the next cycle enters, using the stage text that `buildEpilogueBody` already chooses. Counsel changes one sentence:

- Hope: green can come back between catastrophes.
- Caution: store water and fold before the horizon glows.
- Neither: leave words at the markers for whoever unfolds next.

**Done when:** dying to heat, cold, and thirst each plays a different sky and a different sentence; finishing a cycle plays the grove scene and speaks the age change; Skip reaches the existing restart button; gameplay rules are unchanged.

## Phase 4 — Tighten

- Caption timing follows the spoken line when the browser reports `onend`. If it never fires, the beat timer still advances.
- If the device has two usable voices, give the Witness a different one from the NPCs. If it has one, prosody is enough.
- Confirm a phone can finish the opening and one death scene without a long stall. Drop shadow or sun count on that tier before dropping the figure.
- Leave a map of line ids in this doc’s appendix once they exist, so a later recorded take can drop in per id.

**Done when:** skipping, toggling narration, and switching language mid-menu do not leave a voice talking over the wasteland.

---

## What stays untouched

- Orbital phases, forecast, temperature, dehydration, shelter
- Where the NPCs stand, and what their choices do (calibrate, counsel, hints)
- Log positions and the Final Log trigger
- Civilization stage numbers and the props those stages spawn
- Mobile controls and the Sky sheet
- The narration checkbox and the sound-unlock tap

Story-beat cards stay cards in this plan. They already speak when narration is on. Turning them into scenes is a later choice, not part of finishing the three requests.

---

## Risks

| Risk | Response |
|---|---|
| Browser voices sound like a screen reader | The scene and the speaker carry the moment. Recorded clips can replace line ids later. Do not block the scenes on studio audio. |
| iOS will not speak without a tap | Talk, Read, Continue, and Skip are already taps. The opening starts after the menu button. Call `speak` from that gesture. |
| A death scene every failed run feels long | Skip is immediate. Beats stay short (a few seconds each). |
| Chinese logs do not exist yet | Phase 1 writes them before any log is spoken in 中文. |
| Two WebGL scenes | Do not open a second renderer. The cutscene borrows the one the game already has. |
| It starts to look like the show | One original robe. No reproduced faces, ranks, or title cards. |

---

## Suggested order

1. Agree this doc, especially that mid-run era changes stay small and that the Witness is an original speaker.
2. Phase 1, because talk and logs are the interactions you hit constantly.
3. Phase 2, the first time the player meets the world.
4. Phase 3, the two endings.
5. Phase 4 only after those three have been heard in both languages.
