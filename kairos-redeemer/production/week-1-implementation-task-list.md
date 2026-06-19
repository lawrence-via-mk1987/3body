# Kairos Redeemer - Week 1 Implementation Task List

## Purpose

This is the first practical work block for beginning Kairos Redeemer in Godot as a solo project.

The goal of week 1 is not to build the whole slice.
It is to create a stable foundation and the smallest possible playable flow.

---

## Week 1 Success Definition

At the end of this work block, you should have:

- a Godot project
- a working folder structure
- autoloads configured
- a player that can move in a test map
- a dialogue box that can show text
- a simple scene transition
- a Beth-Tikvah graybox start

If you achieve those, week 1 is a success.

---

## Day / Block 1 - Project Boot

- [ ] create Godot 4 project
- [ ] initialize version control if needed
- [ ] create top-level folder structure
- [ ] create placeholder main menu scene
- [ ] create placeholder world test scene

Deliverable:
- project opens cleanly
- folders are organized

---

## Day / Block 2 - Autoload Foundation

- [ ] create `GameState.gd`
- [ ] create `QuestState.gd`
- [ ] create `DialogueState.gd`
- [ ] create `CombatState.gd`
- [ ] create `SceneRouter.gd`
- [ ] register these as autoloads

Deliverable:
- project runs with autoloads loaded
- no startup errors

---

## Day / Block 3 - Player Movement Prototype

- [ ] create `player.tscn`
- [ ] create `player_controller.gd`
- [ ] movement input works
- [ ] camera follows player
- [ ] collision test works

Deliverable:
- player can move smoothly in a test map

---

## Day / Block 4 - Dialogue Box Prototype

- [ ] create `dialogue_box.tscn`
- [ ] create `dialogue_box.gd`
- [ ] show speaker name
- [ ] show text
- [ ] advance text with input

Deliverable:
- one simple conversation is playable

---

## Day / Block 5 - Scene Routing Prototype

- [ ] create two simple scenes
- [ ] use `SceneRouter` to move between them
- [ ] preserve one flag across transition

Deliverable:
- you can move between scenes without breaking state

---

## Day / Block 6 - Beth-Tikvah Graybox Start

- [ ] create `beth_tikvah_main.tscn`
- [ ] add environment placeholder blocks
- [ ] add player spawn
- [ ] add Elder Hadarah trigger
- [ ] add one optional NPC
- [ ] add objective HUD placeholder

Deliverable:
- opening space exists and is explorable

---

## Day / Block 7 - First Story Trigger

- [ ] implement opening blessing scene
- [ ] set one progression flag
- [ ] update objective text after scene

Deliverable:
- game begins with a real narrative moment

---

## Week 1 Hard Rules

### Do not do this yet
- no polished combat
- no final art
- no elaborate codex
- no advanced VFX
- no overbuilt architecture
- no full save system polish

### Focus on this
- movement
- dialogue
- state
- scene flow
- first emotional landing

---

## Week 1 End Review Questions

At the end of the week/block, ask:

1. Can I move around?
2. Can I trigger a conversation?
3. Can I change scenes?
4. Can I set and read a story flag?
5. Does the opening already feel like Kairos Redeemer?

If the answer to 1-4 is yes, you are on track.
If 5 is no, that is acceptable in week 1 as long as the structure is there.
