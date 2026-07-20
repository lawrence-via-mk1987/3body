# Kairos Redeemer - Local Testing Guide

## Purpose

This guide explains how to test the Kairos Redeemer Godot slice locally on your own machine.

The current playable work lives in:

- `kairos-redeemer/game/`

---

## 1. Install Godot

Use:

- **Godot 4.7 stable**

Download it from:

- https://godotengine.org/download

You want the **standard editor build**, not just export templates.

## Cloud workspace note

For this repository's cloud workspace, a project-local Godot editor binary was installed at:

```text
/workspace/tools/godot/Godot_v4.7-stable_linux.x86_64
```

That binary successfully validates the project headlessly with:

```bash
/workspace/tools/godot/Godot_v4.7-stable_linux.x86_64 --headless --path /workspace/kairos-redeemer/game --quit
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
chmod +x Godot_v4.7-stable_linux.x86_64
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

## 3. First Recommended Test Scenes

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
res://scenes/world/beth_tikvah/beth_tikvah_main.tscn
```

Expected:
- player spawns in Beth-Tikvah
- pause menu works with Escape
- walking into triggers starts dialogue
- Lamp Pavilion sequence transitions to Threshold
- Threshold transitions into Garden

### C. Battle validation
In Garden:
- trigger first battle zone
- confirm battle scene opens
- manual buttons work:
  - Attack
  - Tech
  - Defend
  - Pray
  - Synergy

---

## 4. Current Controls

### Exploration
- Move: `WASD`
- Interact: `E`
- Advance dialogue: `Space`
- Pause menu: `Esc`

### Battle
- mouse click buttons in current prototype

---

## 5. What Is Implemented Right Now

### Working
- Godot 4 project opens cleanly
- autoload states registered
- Beth-Tikvah world scene
- Threshold scene
- Garden scene
- dialogue JSON loading
- pause menu
- journal tab
- codex tab
- battle scene shell
- manual command buttons
- first encounter return flow
- Briar boss shell

### Still Placeholder / Early
- battle target selection is simplified
- animations are placeholder
- environment art is graybox
- codex is basic
- no inventory/equipment UI yet
- no polished VFX/audio pass

---

## 6. Fast Local Sanity Checklist

When you first test locally, confirm:

- [ ] project imports without parse errors
- [ ] player movement works
- [ ] opening dialogue appears
- [ ] pause menu opens and closes
- [ ] Threshold scene loads
- [ ] Garden loads
- [ ] first battle starts
- [ ] battle buttons work
- [ ] winning returns you to Garden

---

## 7. If Godot Reports Errors

The fastest way to continue is:

1. copy the exact Godot error text
2. note which scene you were running
3. note what you clicked or triggered
4. send that back into the agent

Then the next pass can fix the actual project issues quickly.

---

## 8. Suggested Local Testing Order

1. movement test scene
2. Beth-Tikvah opening
3. Threshold flow
4. Garden arrival and first battle
5. Briar shell flow
6. pause menu / codex / journal checks

That keeps debugging simple and layered.
