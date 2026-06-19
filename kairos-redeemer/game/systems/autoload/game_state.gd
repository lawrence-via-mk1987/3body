extends Node

var current_chapter: String = "prologue"
var current_map_id: String = "beth_tikvah_main"
var active_party: Array[String] = ["elior", "junia", "micah"]
var progression_flags: Dictionary = {}

func set_flag(flag_id: String, value: bool = true) -> void:
	progression_flags[flag_id] = value

func has_flag(flag_id: String) -> bool:
	return progression_flags.get(flag_id, false)

func set_current_map(map_id: String) -> void:
	current_map_id = map_id

func set_current_chapter(chapter_id: String) -> void:
	current_chapter = chapter_id
