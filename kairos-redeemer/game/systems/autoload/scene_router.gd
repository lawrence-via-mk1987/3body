extends Node

var previous_world_scene_path: String = ""
var current_scene_path: String = ""
var battle_context: Dictionary = {}

func goto_world_scene(scene_path: String) -> void:
	previous_world_scene_path = current_scene_path
	current_scene_path = scene_path
	get_tree().change_scene_to_file(scene_path)

func goto_battle_scene(scene_path: String, context: Dictionary = {}) -> void:
	previous_world_scene_path = get_tree().current_scene.scene_file_path
	current_scene_path = scene_path
	battle_context = context
	get_tree().change_scene_to_file(scene_path)

func return_to_previous_world_scene() -> void:
	if previous_world_scene_path.is_empty():
		return
	current_scene_path = previous_world_scene_path
	get_tree().change_scene_to_file(previous_world_scene_path)
