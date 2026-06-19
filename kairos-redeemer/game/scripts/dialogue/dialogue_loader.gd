class_name DialogueLoader
extends RefCounted

static func load_scene_lines(path: String) -> Array[Dictionary]:
	if not FileAccess.file_exists(path):
		push_warning("Dialogue file not found: %s" % path)
		return []

	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_warning("Failed to open dialogue file: %s" % path)
		return []

	var content := file.get_as_text()
	var json := JSON.new()
	var error := json.parse(content)
	if error != OK:
		push_warning("Failed to parse dialogue JSON: %s" % path)
		return []

	var data: Dictionary = json.data
	return data.get("lines", [])
