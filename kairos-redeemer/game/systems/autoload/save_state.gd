extends Node

signal save_completed
signal load_completed

const SAVE_PATH := "user://kairos_redeemer_save.json"
const SAVE_VERSION := 1

const MAIN_MENU_SCENE := "res://scenes/ui/main_menu.tscn"
const DEFAULT_WORLD_SCENE := "res://scenes/world/beth_tikvah/beth_tikvah_main.tscn"
const BATTLE_SCENE := "res://scenes/battle/battle_scene.tscn"

var _loading: bool = false

func has_save_file() -> bool:
	return FileAccess.file_exists(SAVE_PATH)

func is_loading() -> bool:
	return _loading

func start_new_game() -> void:
	reset_all_states()
	_loading = false
	delete_save_file()
	SceneRouter.current_scene_path = DEFAULT_WORLD_SCENE
	SceneRouter.previous_world_scene_path = ""
	get_tree().change_scene_to_file(DEFAULT_WORLD_SCENE)

func continue_game() -> bool:
	var data := _read_save_file()
	if data.is_empty():
		return false
	_loading = true
	apply_save_data(data)
	var scene_path: String = data.get("scene_path", DEFAULT_WORLD_SCENE)
	if scene_path == BATTLE_SCENE:
		scene_path = data.get("previous_world_scene_path", DEFAULT_WORLD_SCENE)
	if scene_path.is_empty():
		scene_path = DEFAULT_WORLD_SCENE
	SceneRouter.current_scene_path = scene_path
	SceneRouter.previous_world_scene_path = data.get("previous_world_scene_path", "")
	get_tree().change_scene_to_file(scene_path)
	_loading = false
	load_completed.emit()
	return true

func autosave(reason: String = "") -> bool:
	if _loading:
		return false
	var scene_path := _current_scene_path()
	if scene_path.is_empty():
		return false
	return save_game(scene_path, reason)

func save_game(scene_path: String, reason: String = "") -> bool:
	var data := build_save_data(scene_path)
	data["game_state"]["current_map_id"] = _map_id_from_scene(scene_path)
	data["save_reason"] = reason
	var json_text := JSON.stringify(data, "\t")
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_warning("Failed to write save file.")
		return false
	file.store_string(json_text)
	save_completed.emit()
	return true

func delete_save_file() -> void:
	if has_save_file():
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_PATH))

func build_save_data(scene_path: String) -> Dictionary:
	return {
		"version": SAVE_VERSION,
		"saved_at": Time.get_datetime_string_from_system(),
		"scene_path": scene_path,
		"previous_world_scene_path": SceneRouter.previous_world_scene_path,
		"game_state": _serialize_game_state(),
		"quest_state": _serialize_quest_state(),
		"dialogue_state": _serialize_dialogue_state(),
		"codex_state": _serialize_codex_state(),
		"journal_state": _serialize_journal_state(),
	}

func apply_save_data(data: Dictionary) -> void:
	_apply_game_state(data.get("game_state", {}))
	_apply_quest_state(data.get("quest_state", {}))
	_apply_dialogue_state(data.get("dialogue_state", {}))
	_apply_codex_state(data.get("codex_state", {}))
	_apply_journal_state(data.get("journal_state", {}))

func reset_all_states() -> void:
	GameState.current_chapter = "prologue"
	GameState.current_map_id = "beth_tikvah_main"
	GameState.active_party = ["elior", "junia", "micah"]
	GameState.progression_flags.clear()

	QuestState.active_quests.clear()
	QuestState.completed_quests.clear()
	QuestState.current_objective_text = "Speak with Elder Hadarah."

	DialogueState.seen_scenes.clear()
	DialogueState.relationship_flags.clear()

	CodexState.unlocked_entries = {"beth_tikvah": true, "lamp_of_ages": true}
	CodexState.unlocked_truths.clear()
	CodexState.unlocked_verses.clear()

	JournalState.unlocked_entries.clear()
	JournalState.seen_campfires.clear()

	SceneRouter.previous_world_scene_path = ""
	SceneRouter.current_scene_path = ""
	SceneRouter.world_return_context.clear()
	SceneRouter.battle_context.clear()

func get_save_summary() -> String:
	var data := _read_save_file()
	if data.is_empty():
		return ""
	var map_id: String = data.get("game_state", {}).get("current_map_id", "")
	var map_name := JournalData.get_map_name(map_id)
	var saved_at: String = data.get("saved_at", "")
	return "%s — %s" % [map_name, saved_at]

func _current_scene_path() -> String:
	var scene := get_tree().current_scene
	if scene == null:
		return SceneRouter.current_scene_path
	if scene.scene_file_path.is_empty():
		return SceneRouter.current_scene_path
	return scene.scene_file_path

func _read_save_file() -> Dictionary:
	if not has_save_file():
		return {}
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return {}
	var json := JSON.new()
	if json.parse(file.get_as_text()) != OK:
		return {}
	if json.data is Dictionary:
		return json.data
	return {}

func _serialize_game_state() -> Dictionary:
	return {
		"current_chapter": GameState.current_chapter,
		"current_map_id": GameState.current_map_id,
		"active_party": GameState.active_party.duplicate(),
		"progression_flags": GameState.progression_flags.duplicate(),
	}

func _serialize_quest_state() -> Dictionary:
	return {
		"active_quests": QuestState.active_quests.duplicate(),
		"completed_quests": QuestState.completed_quests.duplicate(),
		"current_objective_text": QuestState.current_objective_text,
	}

func _serialize_dialogue_state() -> Dictionary:
	return {
		"seen_scenes": DialogueState.seen_scenes.duplicate(),
		"relationship_flags": DialogueState.relationship_flags.duplicate(),
	}

func _serialize_codex_state() -> Dictionary:
	return {
		"unlocked_entries": CodexState.unlocked_entries.duplicate(),
		"unlocked_truths": CodexState.unlocked_truths.duplicate(),
		"unlocked_verses": CodexState.unlocked_verses.duplicate(),
	}

func _serialize_journal_state() -> Dictionary:
	return {
		"unlocked_entries": JournalState.unlocked_entries.duplicate(),
		"seen_campfires": JournalState.seen_campfires.duplicate(),
	}

func _apply_game_state(data: Dictionary) -> void:
	GameState.current_chapter = data.get("current_chapter", "prologue")
	GameState.current_map_id = data.get("current_map_id", "beth_tikvah_main")
	GameState.active_party = _to_string_array(data.get("active_party", ["elior", "junia", "micah"]))
	GameState.progression_flags = data.get("progression_flags", {}).duplicate()

func _apply_quest_state(data: Dictionary) -> void:
	QuestState.active_quests = data.get("active_quests", {}).duplicate()
	QuestState.completed_quests = data.get("completed_quests", {}).duplicate()
	QuestState.current_objective_text = data.get("current_objective_text", QuestState.current_objective_text)

func _apply_dialogue_state(data: Dictionary) -> void:
	DialogueState.seen_scenes = data.get("seen_scenes", {}).duplicate()
	DialogueState.relationship_flags = data.get("relationship_flags", {}).duplicate()

func _apply_codex_state(data: Dictionary) -> void:
	CodexState.unlocked_entries = data.get("unlocked_entries", {"beth_tikvah": true, "lamp_of_ages": true}).duplicate()
	CodexState.unlocked_truths = data.get("unlocked_truths", {}).duplicate()
	CodexState.unlocked_verses = data.get("unlocked_verses", {}).duplicate()

func _apply_journal_state(data: Dictionary) -> void:
	JournalState.unlocked_entries = data.get("unlocked_entries", {}).duplicate()
	JournalState.seen_campfires = data.get("seen_campfires", {}).duplicate()

func _to_string_array(value: Variant) -> Array[String]:
	var result: Array[String] = []
	if value is Array:
		for item in value:
			result.append(str(item))
	return result

func _map_id_from_scene(scene_path: String) -> String:
	match scene_path:
		"res://scenes/world/beth_tikvah/beth_tikvah_main.tscn":
			return "beth_tikvah_main"
		"res://scenes/world/threshold/threshold_main.tscn":
			return "threshold_main"
		"res://scenes/world/garden_of_first_light/garden_main.tscn":
			return "garden_main"
		_:
			return GameState.current_map_id
