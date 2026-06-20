extends Node2D

const PLAYER_SCENE := preload("res://scenes/characters/player.tscn")
const DIALOGUE_BOX_SCENE := preload("res://scenes/ui/dialogue_box.tscn")
const OBJECTIVE_HUD_SCENE := preload("res://scenes/ui/objective_hud.tscn")
const PAUSE_MENU_SCENE := preload("res://scenes/ui/pause_menu.tscn")
const DIALOGUE_LOADER := preload("res://scripts/dialogue/dialogue_loader.gd")

var _dialogue_box: CanvasLayer
var _objective_hud: CanvasLayer
var _pause_menu: CanvasLayer
var _pending_action: Callable

func _ready() -> void:
	GameState.set_current_map("beth_tikvah_main")
	_spawn_player()
	_spawn_ui()
	_objective_hud.call("set_zone", "Beth-Tikvah")
	_objective_hud.call("refresh_objective")
	CodexState.unlock_entry("beth_tikvah")

func _spawn_player() -> void:
	var player = PLAYER_SCENE.instantiate()
	player.position = $PlayerSpawn.position
	add_child(player)

func _spawn_ui() -> void:
	_dialogue_box = DIALOGUE_BOX_SCENE.instantiate()
	_dialogue_box.dialogue_finished.connect(_on_dialogue_finished)
	add_child(_dialogue_box)

	_objective_hud = OBJECTIVE_HUD_SCENE.instantiate()
	add_child(_objective_hud)

	_pause_menu = PAUSE_MENU_SCENE.instantiate()
	add_child(_pause_menu)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause") and _pause_menu != null:
		_pause_menu.toggle_menu()

func handle_trigger(trigger_id: String) -> void:
	match trigger_id:
		"opening_blessing":
			if DialogueState.has_seen_scene("opening_blessing"):
				return
			_play_dialogue("res://dialogue/main/opening_blessing.json", Callable())
		"festival_intro":
			if DialogueState.has_seen_scene("junia_festival_intro"):
				return
			_play_dialogue("res://dialogue/main/junia_festival_intro.json", Callable())
		"lamp_pavilion":
			if DialogueState.has_seen_scene("lamp_fracture"):
				return
			_play_dialogue("res://dialogue/main/lamp_fracture.json", Callable(self, "_go_to_threshold"))

func _play_dialogue(path: String, on_finish: Callable) -> void:
	_pending_action = on_finish
	var lines = DIALOGUE_LOADER.load_scene_lines(path)
	_dialogue_box.start_dialogue(lines)
	DialogueState.mark_scene_seen(path.get_file().get_basename())

func _on_dialogue_finished() -> void:
	if _pending_action.is_valid():
		var action := _pending_action
		_pending_action = Callable()
		action.call()

func _go_to_threshold() -> void:
	GameState.set_flag("lamp_fracture_seen", true)
	CodexState.unlock_entry("threshold_of_testimony")
	QuestState.set_objective_text("Awaken in the Threshold of Testimony.")
	SceneRouter.goto_world_scene("res://scenes/world/threshold/threshold_main.tscn")
