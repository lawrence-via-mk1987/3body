extends Node

var previous_world_scene_path: String = ""
var current_scene_path: String = ""
var battle_context: Dictionary = {}
var _transition_layer: CanvasLayer
var _fade_rect: ColorRect

func _ready() -> void:
	_ensure_transition_nodes()

func goto_world_scene(scene_path: String) -> void:
	previous_world_scene_path = current_scene_path
	current_scene_path = scene_path
	_change_scene_with_fade(scene_path)

func goto_battle_scene(scene_path: String, context: Dictionary = {}) -> void:
	previous_world_scene_path = get_tree().current_scene.scene_file_path
	current_scene_path = scene_path
	battle_context = context
	_change_scene_with_fade(scene_path)

func return_to_previous_world_scene() -> void:
	if previous_world_scene_path.is_empty():
		return
	current_scene_path = previous_world_scene_path
	_change_scene_with_fade(previous_world_scene_path)

func _ensure_transition_nodes() -> void:
	if _transition_layer != null:
		return

	_transition_layer = CanvasLayer.new()
	_transition_layer.layer = 100
	_transition_layer.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(_transition_layer)

	_fade_rect = ColorRect.new()
	_fade_rect.color = Color(0, 0, 0, 0)
	_fade_rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_transition_layer.add_child(_fade_rect)

func _change_scene_with_fade(scene_path: String) -> void:
	_ensure_transition_nodes()
	var tween := create_tween()
	tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	tween.tween_property(_fade_rect, "color:a", 1.0, 0.12)
	tween.tween_callback(func(): get_tree().change_scene_to_file(scene_path))
	tween.tween_interval(0.02)
	tween.tween_property(_fade_rect, "color:a", 0.0, 0.12)
