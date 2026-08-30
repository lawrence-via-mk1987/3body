# Kairos Redeemer - Local Testing Guide

## Purpose

This guide explains how to test the Kairos Redeemer Godot slice locally on your own machine.

The current playable work lives in:

- `kairos-redeemer/game/`

---

## 1. Install Godot

Use:

- **Godot 4.4+ stable** (4.7 also works)

Download it from:

- https://godotengine.org/download

You want the **standard editor build**, not just export templates.

## Cloud workspace note

For this repository's cloud workspace, a project-local Godot editor binary is installed at:

```text
/workspace/tools/godot/Godot_v4.4.1-stable_linux.x86_64
```

That binary successfully validates the project headlessly with:

```bash
/workspace/tools/godot/Godot_v4.4.1-stable_linux.x86_64 --headless --path /workspace/kairos-redeemer/game --quit
```

### Recommended choices

#### Windows
- download the Windows editor zip
- unzip it anywhere convenient

#### macOS
- download the macOS editor build
- drag to Applications or a tools folder

#### Linux
- download the Linux x86_64 editor zip
- unzip
- make executable if needed:

```bash
chmod +x Godot_v4.4.1-stable_linux.x86_64
```

---

## 2. Open the Project

In Godot:

1. click **Import**
2. choose:

```text
kairos-redeemer/game/project.godot
```

3. import the project
4. let Godot re-scan and import resources

---

## 3. Automated QA (headless)

Before a manual playtest, run the QA harness from the `kairos-redeemer` folder:

```bash
./qa.sh
```

On macOS, if Godot is not on your PATH, pass the binary explicitly:

```bash
./qa.sh /Applications/Godot.app/Contents/MacOS/Godot
```

Expected output:

```text
--- 1/2 Script + scene load check ---
PASS: project loads with no script errors

--- 2/2 Script compile + content validation ---
QA: ALL CHECKS PASSED (28 dialogue files, 6 scenes)

== QA PASSED ==
```

The harness checks:

- project boots with no script/parse/compile errors
- **every `.gd` script compiles** (catches errors in scenes you have not visited yet, such as battle)
- scripts actually attach to their scene nodes
- all dialogue JSON parses and has lines
- main menu, world maps, movement test, and battle scene load/instantiate
- campfire dialogue paths and journal hooks
- Threshold/Garden ambient audio files exist
- core quest/map definitions exist

Exit code `0` means pass; non-zero prints each failure.

Run this after every code change — a script that fails to compile will crash the
game the moment you enter the scene that uses it.

---

## 4. First Recommended Test Scenes

### A. Movement smoke test
Open and run:

```text
res://scenes/world/tests/player_movement_test.tscn
```

Expected:
- player can move with WASD
- camera follows

### B. Main slice entry
Run the project normally.

Current main scene:

```text
res://scenes/ui/main_menu.tscn
```

Expected:
- **New Game** starts in Beth-Tikvah
- **Continue** loads autosave when `user://kairos_redeemer_save.json` exists
- pause menu works with Escape (Journal, Codex, Save, Main Menu)
- walking into triggers starts dialogue (body_enter triggers; `E` is mapped but not required)
- Lamp Pavilion sequence transitions to Threshold
- Threshold transitions into Garden
- Briar battle → love restoration → Meridian teaser → Elior wound arc → prologue complete screen

### C. Battle validation
In Garden:
- trigger first battle zone (Garden Edge)
- confirm battle scene opens
- manual buttons work:
  - Attack
  - Tech
  - Defend
  - Pray
  - Synergy

### D. Threshold / Garden mood pass
In Threshold and Garden:
- starlit sky band + vignette on Threshold; warm sky wash on Garden
- ambient loop plays (`threshold_starlit.ogg` / `garden_first_light.ogg`)
- zone colors shift as quests progress (gate glow, witness pool, grove light, restored tree)

---

## 5. Current Controls

### Exploration
- Move: `WASD`
- Interact: `E` (mapped; most triggers fire on walk-in)
- Advance dialogue: `Space`
- Pause menu: `Esc`

### Battle
- mouse click buttons in current prototype

---

## 6. What Is Implemented Right Now

### Working
- Godot 4 project opens cleanly
- autoload states registered (including save/load)
- main menu (New Game / Continue / Quit)
- autosave on world transitions and key milestones
- Beth-Tikvah world scene
- Threshold scene (ambient + starlit mood layers)
- Garden scene (ambient + first-light mood layers)
- dialogue JSON loading
- pause menu with Journal and Codex tabs
- campfires: Junia (Threshold), Micah (Garden), Elior (Threshold)
- Whisper of the Grove sidequest
- battle scene shell with manual command buttons
- first encounter and Briar boss return flow
- prologue complete overlay after Elior campfire

### Still Placeholder / Early
- battle target selection is simplified
- animations are placeholder
- environment art is graybox (mood-polished, not final art)
- codex is basic
- no inventory/equipment UI yet
- ambient audio is procedural placeholder loops (not final score)

---

## 7. Fast Local Sanity Checklist

When you first test locally, confirm:

- [x] project imports without parse errors (headless `--quit`)
- [x] automated QA script passes (28 dialogue files, 6 scenes)
- [ ] player movement works
- [ ] opening dialogue appears (Hadarah blessing)
- [ ] pause menu opens and closes
- [ ] Threshold scene loads with ambient audio
- [ ] Garden loads with ambient audio
- [ ] first battle starts
- [ ] battle buttons work
- [ ] winning returns you to Garden
- [ ] save/load and Continue from main menu
- [ ] prologue complete screen after Elior campfire

Items marked `[x]` were verified headlessly in the cloud workspace (Aug 2026 QA pass). Manual items still need an interactive editor run.

---

## 8. Suggested Local Testing Order

1. run automated QA script
2. movement test scene
3. main menu → New Game → Beth-Tikvah opening
4. Threshold flow (Keeper briefing, Junia campfire, gate)
5. Garden arrival and first battle
6. Micah campfire, Whisper of the Grove sidequest
7. Briar shell flow and love restoration
8. return to Threshold → Meridian teaser → Elior wound arc
9. pause menu / codex / journal checks
10. Continue from main menu after autosave

That keeps debugging simple and layered.

---

## 9. If Godot Reports Errors

The fastest way to continue is:

1. copy the exact Godot error text
2. note which scene you were running
3. note what you clicked or triggered
4. send that back into the agent

Then the next pass can fix the actual project issues quickly.
