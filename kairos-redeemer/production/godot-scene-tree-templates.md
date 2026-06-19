# Kairos Redeemer - Godot Scene Tree Templates

## Purpose

This document defines the recommended Godot 4 scene tree structures for the solo-dev vertical slice of Kairos Redeemer.

The goal is to:

- keep scenes modular
- keep script ownership clear
- avoid giant all-in-one scene files
- support fast solo iteration

## Core Scene Philosophy

Each scene should have:

1. one clear purpose
2. one primary controlling script
3. children grouped by function
4. as little hidden magic as possible

Keep the first slice simple.

---

## 1. Root Game Flow Template

```text
MainMenu.tscn
World scenes
Battle scene
Shared UI scenes
```

Recommended root scene types:

- `res://scenes/world/...`
- `res://scenes/battle/...`
- `res://scenes/ui/...`
- `res://scenes/common/...`

---

## 2. Beth-Tikvah World Scene Template

Scene:
`res://game/scenes/world/beth_tikvah/beth_tikvah_main.tscn`

```text
BethTikvahMain (Node2D)
├── EnvironmentRoot (Node2D)
│   ├── Ground (ColorRect/Sprite2D/TileMap later)
│   ├── Props (Node2D)
│   └── Landmarks (Node2D)
├── NPCRoot (Node2D)
│   ├── ElderHadarah (Area2D or CharacterBody2D later)
│   ├── Junia
│   └── CommonNPCs
├── TriggerRoot (Node2D)
│   ├── OpeningBlessingTrigger (Area2D)
│   ├── FestivalTrigger (Area2D)
│   └── LampPavilionTrigger (Area2D)
├── PlayerSpawn (Marker2D)
├── Camera2D
├── StoryLayer (Node)
├── UILayer (CanvasLayer)
│   ├── ObjectiveHUD
│   └── DialogueBox
└── AudioAnchor (Node)
```

### Notes

- Use `Marker2D` nodes for future spawn points.
- Triggers should be explicit `Area2D` nodes with small scripts or exported event ids.
- Story events should call into autoload state rather than hardcoding everything in the scene.

---

## 3. Threshold of Testimony Scene Template

Scene:
`res://game/scenes/world/threshold/threshold_main.tscn`

```text
ThresholdMain (Node2D)
├── EnvironmentRoot
│   ├── ArrivalPlatform
│   ├── WitnessPool
│   ├── Cloister
│   └── GateDais
├── NPCRoot
│   ├── Keeper
│   └── Micah
├── TriggerRoot
│   ├── WakeTrigger
│   ├── KeeperTrigger
│   └── GardenGateTrigger
├── PlayerSpawn
├── Camera2D
├── StoryLayer
├── UILayer
│   ├── ObjectiveHUD
│   └── DialogueBox
└── AudioAnchor
```

### Notes

- This scene should feel sparse and sacred, so keep active nodes limited.
- The Threshold is a good place to prototype codex and journal popups.

---

## 4. Garden of First Light Scene Template

Scene:
`res://game/scenes/world/garden_of_first_light/garden_main.tscn`

```text
GardenMain (Node2D)
├── EnvironmentRoot
│   ├── GardenEdge
│   ├── WhisperingGrove
│   ├── ThornVerge
│   ├── TreeApproach
│   └── BossArena
├── EncounterRoot
│   ├── Encounter01
│   ├── Encounter02
│   ├── Encounter03
│   └── EncounterElite
├── NPCRoot
│   ├── FearfulPair
│   └── GardenWitnesses
├── TriggerRoot
│   ├── ArrivalTrigger
│   ├── VeiledGlimpseTrigger
│   ├── RootPrayerTrigger
│   └── BossTrigger
├── PlayerSpawn
├── Camera2D
├── StoryLayer
├── UILayer
│   ├── ObjectiveHUD
│   └── DialogueBox
└── AudioAnchor
```

### Notes

- Keep the Garden readable in graybox. Do not overbuild routes early.
- One optional side path is enough for the first implementation.

---

## 5. Shared Dialogue UI Scene Template

Scene:
`res://game/scenes/ui/dialogue_box.tscn`

```text
DialogueBox (CanvasLayer)
└── PanelContainer
    └── MarginContainer
        └── VBoxContainer
            ├── SpeakerName (Label)
            ├── DialogueText (RichTextLabel)
            └── ContinueHint (Label)
```

### Notes

- Keep this scene reusable in all world scenes.
- Portrait support can be added later.

---

## 6. Shared Objective HUD Template

Scene:
`res://game/scenes/ui/objective_hud.tscn`

```text
ObjectiveHUD (CanvasLayer)
└── MarginContainer
    └── VBoxContainer
        ├── ZoneLabel (Label)
        └── ObjectiveLabel (Label)
```

---

## 7. Battle Scene Template

Scene:
`res://game/scenes/battle/battle_scene.tscn`

```text
BattleScene (Node2D)
├── BackgroundRoot (Node2D)
├── EnemyRoot (Node2D)
├── PartyRoot (Node2D)
├── EffectRoot (Node2D)
├── BattleController (Node)
├── UILayer (CanvasLayer)
│   ├── BattleHUD
│   ├── CommandMenu
│   └── TutorialPopup
└── AudioAnchor (Node)
```

### Notes

- Keep combat actors separate from UI.
- `BattleController` should own turn flow and battle state.
- Enemy and party nodes should be easy to swap with placeholders.

---

## 8. Battle HUD Template

Suggested hierarchy:

```text
BattleHUD (Control)
├── BossPanel
│   ├── BossName
│   ├── BossHP
│   ├── BossPhase
│   ├── ActiveLie
│   └── LieBreakMeter
├── PartyPanel
│   ├── EliorStatus
│   ├── JuniaStatus
│   └── MicahStatus
├── AssurancePanel
└── CommandPanel
```

---

## 9. Boss Scene Template

Example:
`res://game/scenes/battle/bosses/briar_bridegroom.tscn`

```text
BriarBridegroom (Node2D)
├── VisualRoot
├── Hurtbox
├── PylonLeftAnchor
├── PylonRightAnchor
└── BossLogicAnchor
```

### Notes

- For the first slice, the boss can stay visually simple.
- Keep phase logic in script, not spread through animation nodes.

---

## 10. Scene Ownership Rules

### World scene should own:
- map layout
- NPC placement
- triggers
- cutscene invocation

### UI scene should own:
- text display
- formatting
- navigation prompts

### Battle scene should own:
- combat flow
- battle actors
- battle-specific UI

### Autoloads should own:
- global progression
- active quest state
- codex unlock state
- scene routing

---

## 11. Solo Dev Guidance

For the first week, only build these scenes:

- `beth_tikvah_main.tscn`
- `threshold_main.tscn`
- `garden_main.tscn`
- `dialogue_box.tscn`
- `objective_hud.tscn`
- `battle_scene.tscn`

Do not build every future scene now.
