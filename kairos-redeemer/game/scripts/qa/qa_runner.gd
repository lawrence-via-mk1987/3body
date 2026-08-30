extends Node

const DIALOGUE_ROOT := "res://dialogue"
const SELF_SCRIPT_PATH := "res://scripts/qa/qa_runner.gd"

const SCENE_PATHS := [
	"res://scenes/ui/main_menu.tscn",
	"res://scenes/world/beth_tikvah/beth_tikvah_main.tscn",
	"res://scenes/world/threshold/threshold_main.tscn",
	"res://scenes/world/garden_of_first_light/garden_main.tscn",
	"res://scenes/world/tests/player_movement_test.tscn",
	"res://scenes/battle/battle_scene.tscn",
]

const AUDIO_PATHS := [
	"res://audio/ambient/threshold_starlit.ogg",
	"res://audio/ambient/garden_first_light.ogg",
]

func _ready() -> void:
	var failures: Array[String] = []
	failures.append_array(_validate_scripts_compile())
	failures.append_array(_validate_dialogue_files())
	failures.append_array(_validate_scene_scripts())
	failures.append_array(_validate_campfire_config())
	failures.append_array(_validate_audio_assets())
	failures.append_array(_validate_slice_flow_flags())

	if failures.is_empty():
		print("QA: ALL CHECKS PASSED (%d dialogue files, %d scenes)" % [_dialogue_file_count(), SCENE_PATHS.size()])
		get_tree().quit(0)
	else:
		print("QA: %d FAILURE(S)" % failures.size())
		for failure in failures:
			print("  - %s" % failure)
		get_tree().quit(1)

func _validate_scripts_compile() -> Array[String]:
	var failures: Array[String] = []
	for script_path in _collect_scripts("res://"):
		if script_path == SELF_SCRIPT_PATH:
			continue
		var script: GDScript = load(script_path)
		if script == null:
			failures.append("Script failed to parse: %s" % script_path)
		elif not script.can_instantiate():
			failures.append("Script failed to compile: %s" % script_path)
	return failures

func _collect_scripts(path: String) -> Array[String]:
	var scripts: Array[String] = []
	var dir := DirAccess.open(path)
	if dir == null:
		return scripts
	var base := path if path.ends_with("/") else "%s/" % path
	for file_name in dir.get_files():
		if file_name.ends_with(".gd"):
			scripts.append("%s%s" % [base, file_name])
	for sub_name in dir.get_directories():
		if sub_name.begins_with("."):
			continue
		scripts.append_array(_collect_scripts("%s%s/" % [base, sub_name]))
	return scripts

func _validate_scene_scripts() -> Array[String]:
	var failures: Array[String] = []
	for scene_path in SCENE_PATHS:
		if not ResourceLoader.exists(scene_path):
			failures.append("Scene resource missing: %s" % scene_path)
			continue
		var packed: PackedScene = load(scene_path)
		if packed == null:
			failures.append("Failed to load scene: %s" % scene_path)
			continue
		var instance := packed.instantiate()
		if instance == null:
			failures.append("Failed to instantiate scene: %s" % scene_path)
			continue
		failures.append_array(_check_scene_state(packed, instance, scene_path))
		instance.free()
	return failures

func _check_scene_state(packed: PackedScene, instance: Node, scene_path: String) -> Array[String]:
	var failures: Array[String] = []
	var state := packed.get_state()
	for i in state.get_node_count():
		var declares_script := false
		for prop_index in state.get_node_property_count(i):
			if state.get_node_property_name(i, prop_index) == "script":
				declares_script = true
				break
		if not declares_script:
			continue
		var node_path := state.get_node_path(i)
		var node := instance if node_path.is_empty() or str(node_path) == "." else instance.get_node_or_null(node_path)
		if node == null:
			continue
		if node.get_script() == null:
			failures.append("Script failed to attach in %s at node %s" % [scene_path, node_path])
	return failures

func _dialogue_file_count() -> int:
	var dir := DirAccess.open(DIALOGUE_ROOT)
	if dir == null:
		return 0
	return _count_dialogue_files(dir, DIALOGUE_ROOT)

func _count_dialogue_files(dir: DirAccess, path: String) -> int:
	var count := 0
	for file_name in dir.get_files():
		if file_name.ends_with(".json"):
			count += 1
	for sub_name in dir.get_directories():
		var sub := DirAccess.open("%s/%s" % [path, sub_name])
		if sub != null:
			count += _count_dialogue_files(sub, "%s/%s" % [path, sub_name])
	return count

func _validate_dialogue_files() -> Array[String]:
	var failures: Array[String] = []
	var dir := DirAccess.open(DIALOGUE_ROOT)
	if dir == null:
		failures.append("Cannot open dialogue root: %s" % DIALOGUE_ROOT)
		return failures
	_walk_dialogue(dir, DIALOGUE_ROOT, failures)
	return failures

func _walk_dialogue(dir: DirAccess, path: String, failures: Array[String]) -> void:
	for file_name in dir.get_files():
		if file_name.ends_with(".json"):
			failures.append_array(_validate_dialogue_json("%s/%s" % [path, file_name]))
	for sub_name in dir.get_directories():
		var sub := DirAccess.open("%s/%s" % [path, sub_name])
		if sub != null:
			_walk_dialogue(sub, "%s/%s" % [path, sub_name], failures)

func _validate_dialogue_json(resource_path: String) -> Array[String]:
	var failures: Array[String] = []
	if not FileAccess.file_exists(resource_path):
		failures.append("Missing dialogue file: %s" % resource_path)
		return failures

	var file := FileAccess.open(resource_path, FileAccess.READ)
	if file == null:
		failures.append("Cannot read dialogue: %s" % resource_path)
		return failures

	var json := JSON.new()
	if json.parse(file.get_as_text()) != OK:
		failures.append("Invalid JSON in %s" % resource_path)
		return failures

	var data: Variant = json.data
	if not data is Dictionary:
		failures.append("Dialogue root must be object: %s" % resource_path)
		return failures

	var lines: Variant = data.get("lines", [])
	if not lines is Array:
		failures.append("Dialogue missing lines array: %s" % resource_path)
		return failures

	if lines.is_empty():
		failures.append("Dialogue has no lines: %s" % resource_path)

	for line in lines:
		if not line is Dictionary:
			failures.append("Non-dictionary line in %s" % resource_path)
			continue
		if str(line.get("speaker", "")).is_empty() and str(line.get("text", "")).is_empty():
			failures.append("Empty dialogue line in %s" % resource_path)

	return failures

func _validate_campfire_config() -> Array[String]:
	var failures: Array[String] = []
	for campfire_id in JournalData.CAMPFIRES.keys():
		var campfire: Dictionary = JournalData.get_campfire(campfire_id)
		var dialogue_path: String = campfire.get("dialogue_path", "")
		if dialogue_path.is_empty():
			failures.append("Campfire %s missing dialogue_path" % campfire_id)
			continue
		if not FileAccess.file_exists(dialogue_path):
			failures.append("Campfire dialogue missing: %s -> %s" % [campfire_id, dialogue_path])
		var journal_id: String = campfire.get("journal_unlock", "")
		if not journal_id.is_empty() and not JournalData.ENTRIES.has(journal_id):
			failures.append("Campfire %s journal_unlock not in ENTRIES: %s" % [campfire_id, journal_id])
	return failures

func _validate_audio_assets() -> Array[String]:
	var failures: Array[String] = []
	for audio_path in AUDIO_PATHS:
		if not FileAccess.file_exists(audio_path):
			failures.append("Missing ambient audio: %s" % audio_path)
	return failures

func _validate_slice_flow_flags() -> Array[String]:
	var failures: Array[String] = []
	for quest_id in ["firstfruits_morning", "through_the_rupture", "the_first_wound", "whisper_of_the_grove", "elior_beloved_wound"]:
		if not JournalData.QUESTS.has(quest_id):
			failures.append("Quest definition missing: %s" % quest_id)

	for map_id in ["beth_tikvah_main", "threshold_main", "garden_main"]:
		if not JournalData.MAPS.has(map_id):
			failures.append("Map label missing in JournalData: %s" % map_id)

	if not ResourceLoader.exists(SaveState.MAIN_MENU_SCENE):
		failures.append("SaveState main menu scene invalid")

	return failures
