extends Node

var seen_scenes: Dictionary = {}
var relationship_flags: Dictionary = {}

func mark_scene_seen(scene_id: String) -> void:
	seen_scenes[scene_id] = true

func has_seen_scene(scene_id: String) -> bool:
	return seen_scenes.get(scene_id, false)

func set_relationship_flag(flag_id: String, value: int) -> void:
	relationship_flags[flag_id] = value

func get_relationship_flag(flag_id: String, default_value: int = 0) -> int:
	return relationship_flags.get(flag_id, default_value)
