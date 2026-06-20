extends Node2D

const PLAYER_SCENE := preload("res://scenes/characters/player.tscn")
const DIALOGUE_BOX_SCENE := preload("res://scenes/ui/dialogue_box.tscn")
const OBJECTIVE_HUD_SCENE := preload("res://scenes/ui/objective_hud.tscn")
const DIALOGUE_LOADER := preload("res://scripts/dialogue/dialogue_loader.gd")

var _dialogue_box: CanvasLayer
var _objective_hud: CanvasLayer
var _pending_action: Callable

func _ready() -> void:
	GameState.set_current_map("threshold_main")
	_spawn_player()
	_spawn_ui()
	_objective_hud.call("set_zone", "Threshold of Testimony")
	if GameState.has_flag("fruit_love_restored"):
		QuestState.set_objective_text("Receive the Meridian teaser.")
	elif not DialogueState.has_seen_scene("threshold_wakeup"):
		QuestState.set_objective_text("Listen to the Keeper's briefing.")
	else:
		QuestState.set_objective_text("Enter the Garden of First Light.")
	_objective_hud.call("refresh_objective")

	if not DialogueState.has_seen_scene("threshold_wakeup"):
		call_deferred("_play_intro")
	elif GameState.has_flag("fruit_love_restored") and not DialogueState.has_seen_scene("meridian_teaser"):
		call_deferred("_play_meridian_teaser")

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

func _play_intro() -> void:
	_play_dialogue("res://dialogue/main/threshold_wakeup.json", Callable())

func _play_meridian_teaser() -> void:
	_play_dialogue("res://dialogue/main/meridian_teaser.json", Callable())

func handle_trigger(trigger_id: String) -> void:
	match trigger_id:
		"keeper_briefing":
			if DialogueState.has_seen_scene("keeper_briefing"):
				return
			_play_dialogue("res://dialogue/main/keeper_briefing.json", Callable())
		"garden_gate":
			_play_dialogue("res://dialogue/main/garden_gate_open.json", Callable(self, "_go_to_garden"))

func _play_dialogue(path: String, on_finish: Callable) -> void:
	_pending_action = on_finish
	var lines = DIALOGUE_LOADER.load_scene_lines(path)
	_dialogue_box.start_dialogue(lines)
	DialogueState.mark_scene_seen(path.get_file().get_basename())

	if path.ends_with("keeper_briefing.json"):
		QuestState.set_objective_text("Step through the first gate into the Garden.")
		_objective_hud.call("refresh_objective")

func _on_dialogue_finished() -> void:
	if _pending_action.is_valid():
		var action := _pending_action
		_pending_action = Callable()
		action.call()

func _go_to_garden() -> void:
	GameState.set_flag("garden_gate_opened", true)
	SceneRouter.goto_world_scene("res://scenes/world/garden_of_first_light/garden_main.tscn")
