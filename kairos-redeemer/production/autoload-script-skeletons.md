# Kairos Redeemer - Autoload Script Skeletons

## Purpose

These are the recommended Godot autoload singletons for the Kairos Redeemer vertical slice.

They are intentionally small and practical for a solo project.

---

## 1. GameState.gd

Responsibilities:

- current chapter
- current map id
- party unlocks
- world progression flags
- active party ids

Suggested fields:

```gdscript
extends Node

var current_chapter: String = "prologue"
var current_map_id: String = "beth_tikvah_main"
var active_party: Array[String] = ["elior", "junia", "micah"]
var progression_flags: Dictionary = {}
```

Suggested methods:

```gdscript
func set_flag(flag_id: String, value: bool = true) -> void
func has_flag(flag_id: String) -> bool
func set_current_map(map_id: String) -> void
func set_current_chapter(chapter_id: String) -> void
```

---

## 2. QuestState.gd

Responsibilities:

- active quests
- quest stages
- completed quests
- current objective text

Suggested fields:

```gdscript
extends Node

var active_quests: Dictionary = {}
var completed_quests: Dictionary = {}
var current_objective_text: String = ""
```

Suggested methods:

```gdscript
func start_quest(quest_id: String) -> void
func advance_quest(quest_id: String, stage_id: String) -> void
func complete_quest(quest_id: String) -> void
func is_quest_active(quest_id: String) -> bool
func set_objective_text(text: String) -> void
```

---

## 3. DialogueState.gd

Responsibilities:

- seen cutscenes
- seen dialogue scenes
- heart event unlocks
- campfire scene availability

Suggested fields:

```gdscript
extends Node

var seen_scenes: Dictionary = {}
var relationship_flags: Dictionary = {}
```

Suggested methods:

```gdscript
func mark_scene_seen(scene_id: String) -> void
func has_seen_scene(scene_id: String) -> bool
func set_relationship_flag(flag_id: String, value: int) -> void
func get_relationship_flag(flag_id: String, default_value: int = 0) -> int
```

---

## 4. CodexState.gd

Responsibilities:

- codex unlocks
- truth unlocks
- verse unlocks

Suggested fields:

```gdscript
extends Node

var unlocked_entries: Dictionary = {}
var unlocked_truths: Dictionary = {}
```

Suggested methods:

```gdscript
func unlock_entry(entry_id: String) -> void
func has_entry(entry_id: String) -> bool
func unlock_truth(truth_id: String) -> void
func has_truth(truth_id: String) -> bool
```

---

## 5. CombatState.gd

Responsibilities:

- active battle id
- Assurance value
- current Lie state
- tutorial combat toggles

Suggested fields:

```gdscript
extends Node

var current_battle_id: String = ""
var assurance_points: int = 0
var active_lie_id: String = ""
var lie_break_progress: int = 0
```

Suggested methods:

```gdscript
func reset_battle_state() -> void
func set_active_lie(lie_id: String, break_threshold: int) -> void
func add_lie_break_progress(amount: int) -> void
func add_assurance(amount: int) -> void
func reduce_assurance(amount: int) -> void
```

---

## 6. SceneRouter.gd

Responsibilities:

- world scene loading
- battle scene loading
- return from battle
- fade transitions later

Suggested fields:

```gdscript
extends Node

var previous_world_scene_path: String = ""
var current_scene_path: String = ""
```

Suggested methods:

```gdscript
func goto_world_scene(scene_path: String) -> void
func goto_battle_scene(scene_path: String, battle_context: Dictionary = {}) -> void
func return_to_previous_world_scene() -> void
```

---

## 7. AudioManager.gd

Responsibilities:

- music playback
- ambience switching
- one-shot stingers

Suggested fields:

```gdscript
extends Node

var current_music_id: String = ""
var current_ambience_id: String = ""
```

Suggested methods:

```gdscript
func play_music(track_id: String) -> void
func stop_music() -> void
func play_stinger(stinger_id: String) -> void
func set_ambience(ambience_id: String) -> void
```

---

## 8. SaveManager.gd

Responsibilities:

- serialize and save current slice state
- load save file
- return save data to singletons

Suggested methods:

```gdscript
extends Node

func build_save_data() -> Dictionary
func apply_save_data(data: Dictionary) -> void
func save_to_slot(slot_id: int = 0) -> void
func load_from_slot(slot_id: int = 0) -> void
```

---

## 9. Solo Dev Recommendation

For the first implementation pass, autoload only:

- `GameState`
- `QuestState`
- `DialogueState`
- `CombatState`
- `SceneRouter`

Add:

- `CodexState`
- `AudioManager`
- `SaveManager`

once the first playable loop is running.
