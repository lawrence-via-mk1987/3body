extends SceneTree

const DIALOGUE_ROOT := "res://dialogue"
const JournalDataLib := preload("res://systems/autoload/journal_data.gd")
const MAIN_MENU_SCENE := "res://scenes/ui/main_menu.tscn"
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

func _init() -> void:
	var failures: Array[String] = []
	failures.append_array(_validate_dialogue_files())
	failures.append_array(_validate_scene_loads())
	failures.append_array(_validate_campfire_config())
	failures.append_array(_validate_audio_assets())
	failures.append_array(_validate_slice_flow_flags())

	if failures.is_empty():
		print("QA: ALL CHECKS PASSED (%d dialogue files, %d scenes)" % [_dialogue_file_count(), SCENE_PATHS.size()])
		quit(0)
	else:
		print("QA: %d FAILURE(S)" % failures.size())
		for failure in failures:
			print("  - %s" % failure)
		quit(1)

func _dialogue_file_count() -> int:
	var count := 0
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
	var error := json.parse(file.get_as_text())
	if error != OK:
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

func _validate_scene_loads() -> Array[String]:
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
		else:
			instance.free()
	return failures

func _validate_campfire_config() -> Array[String]:
	var failures: Array[String] = []
	var journal_data := JournalDataLib.new()
	for campfire_id in JournalDataLib.CAMPFIRES.keys():
		var campfire: Dictionary = journal_data.get_campfire(campfire_id)
		var dialogue_path: String = campfire.get("dialogue_path", "")
		if dialogue_path.is_empty():
			failures.append("Campfire %s missing dialogue_path" % campfire_id)
			continue
		if not FileAccess.file_exists(dialogue_path):
			failures.append("Campfire dialogue missing: %s -> %s" % [campfire_id, dialogue_path])
		var journal_id: String = campfire.get("journal_unlock", "")
		if not journal_id.is_empty() and not JournalDataLib.ENTRIES.has(journal_id):
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
		if not JournalDataLib.QUESTS.has(quest_id):
			failures.append("Quest definition missing: %s" % quest_id)

	var required_maps := ["beth_tikvah_main", "threshold_main", "garden_main"]
	for map_id in required_maps:
		if not JournalDataLib.MAPS.has(map_id):
			failures.append("Map label missing in JournalData: %s" % map_id)

	if MAIN_MENU_SCENE.is_empty() or not ResourceLoader.exists(MAIN_MENU_SCENE):
		failures.append("Main menu scene invalid")

	return failures
