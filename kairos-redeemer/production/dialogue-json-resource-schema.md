# Kairos Redeemer - Dialogue JSON / Resource Schema

## Purpose

This document defines a simple, solo-friendly dialogue data format for the vertical slice.

The goal is:

- easy to write
- easy to load in Godot
- easy to expand later

Use JSON first unless you strongly prefer custom `Resource` assets from the start.

---

## 1. Recommended Early Format

Use one JSON file per dialogue scene.

Folder suggestion:

```text
res://game/dialogue/main/
res://game/dialogue/npc/
res://game/dialogue/boss/
res://game/dialogue/campfire/
```

---

## 2. Minimal Scene JSON Structure

```json
{
  "scene_id": "opening_blessing",
  "title": "Opening Blessing",
  "lines": [
    {
      "line_id": "opening_blessing_001",
      "speaker": "Hadarah",
      "emotion": "warm",
      "portrait": "hadarah_soft",
      "text": "Beloved one, remember whose you are.",
      "next_line": "opening_blessing_002"
    }
  ]
}
```

---

## 3. Supported Line Fields

| Field | Required | Description |
| --- | --- | --- |
| `line_id` | yes | unique line id |
| `speaker` | yes | speaker display name |
| `emotion` | no | portrait/emotion tag |
| `portrait` | no | portrait id |
| `text` | yes | spoken line |
| `next_line` | no | next line id |
| `event` | no | event to fire on this line |
| `choice_block` | no | branching choice id |
| `sfx` | no | sfx cue id |
| `music` | no | music cue switch |
| `pause_after` | no | delay in seconds |

---

## 4. Optional Choice Block Structure

```json
{
  "line_id": "keeper_choice_001",
  "speaker": "Keeper",
  "emotion": "grave",
  "text": "Are you ready to enter the Garden?",
  "choice_block": {
    "choices": [
      {
        "label": "Yes. Open the way.",
        "next_line": "keeper_yes_001"
      },
      {
        "label": "Remind me what waits there.",
        "next_line": "keeper_explain_001"
      }
    ]
  }
}
```

For the first slice, branching should be minimal.

---

## 5. Optional Event Hooks

Use an `event` field to trigger gameplay or state changes from dialogue.

Example:

```json
{
  "line_id": "keeper_gate_open_001",
  "speaker": "Keeper",
  "text": "Then go. The first wound waits in the Garden.",
  "event": "open_garden_gate",
  "next_line": null
}
```

Example event ids:

- `start_quest_first_wound`
- `open_garden_gate`
- `unlock_codex_threshold`
- `set_flag_threshold_intro_seen`
- `play_stinger_meridian_tease`

---

## 6. Optional Metadata Block

```json
{
  "scene_id": "opening_blessing",
  "title": "Opening Blessing",
  "category": "main_story",
  "location": "beth_tikvah",
  "trigger_flag": "opening_blessing_available",
  "auto_start": true,
  "lines": []
}
```

Useful later, but not mandatory for first implementation.

---

## 7. Suggested Emotion Tags

Use a small controlled set first:

- neutral
- warm
- gentle
- tense
- wary
- grief
- angry
- awe
- prayerful
- resolved

---

## 8. Example Vertical Slice Scene Files

Create these first:

- `opening_blessing.json`
- `junia_festival_intro.json`
- `lamp_fracture.json`
- `threshold_wakeup.json`
- `keeper_briefing.json`
- `garden_arrival.json`
- `fearful_pair.json`
- `briar_intro.json`
- `love_restoration.json`
- `meridian_teaser.json`

---

## 9. Later Upgrade Path

Once the slice works, you can move from JSON-only into:

- custom `DialogueSceneData` resources
- localization-friendly string tables
- timeline-based dialogue events
- richer portrait animations

Do not build those first.

Get the slice talking first.
