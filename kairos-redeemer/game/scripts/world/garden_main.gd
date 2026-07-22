extends Node2D

const PLAYER_SCENE := preload("res://scenes/characters/player.tscn")
const DIALOGUE_BOX_SCENE := preload("res://scenes/ui/dialogue_box.tscn")
const OBJECTIVE_HUD_SCENE := preload("res://scenes/ui/objective_hud.tscn")
const PAUSE_MENU_SCENE := preload("res://scenes/ui/pause_menu.tscn")
const NOTIFICATION_HUD_SCENE := preload("res://scenes/ui/notification_hud.tscn")
const DIALOGUE_LOADER := preload("res://scripts/dialogue/dialogue_loader.gd")

var _dialogue_box: CanvasLayer
var _objective_hud: CanvasLayer
var _pause_menu: CanvasLayer
var _notification_hud: CanvasLayer
var _pending_action: Callable

func _ready() -> void:
	GameState.set_current_map("garden_main")
	_spawn_player()
	_spawn_ui()
	_objective_hud.call("set_zone", "Garden of First Light")
	var return_ctx := SceneRouter.consume_world_return_context()
	if GameState.has_flag("briar_bridegroom_defeated"):
		QuestState.set_objective_text("Return to the Threshold of Testimony.")
	elif GameState.has_flag("garden_first_battle_complete"):
		QuestState.set_objective_text("Speak with the fearful pair and continue toward the Tree.")
	else:
		QuestState.set_objective_text("Reach the Tree of First Light.")
	_objective_hud.call("refresh_objective")
	CodexState.unlock_entry("garden_of_first_light")
	_refresh_world_state()

	if return_ctx.get("trigger_restoration", false) or (GameState.has_flag("briar_bridegroom_defeated") and not DialogueState.has_seen_scene("love_restoration")):
		call_deferred("_play_restoration")
	elif not DialogueState.has_seen_scene("garden_arrival"):
		call_deferred("_play_arrival")

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

	_notification_hud = NOTIFICATION_HUD_SCENE.instantiate()
	add_child(_notification_hud)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause") and _pause_menu != null:
		_pause_menu.toggle_menu()

func _play_arrival() -> void:
	_play_dialogue("res://dialogue/main/garden_arrival.json", Callable())

func _play_restoration() -> void:
	_play_dialogue("res://dialogue/boss/love_restoration.json", Callable(self, "_on_restoration_finished"))

func _on_restoration_finished() -> void:
	GameState.set_flag("fruit_love_restored", true)
	QuestState.complete_quest("the_first_wound")
	QuestState.set_objective_text("Return to the Threshold of Testimony.")
	_objective_hud.call("refresh_objective")
	_refresh_world_state()
	_return_to_threshold()

func handle_trigger(trigger_id: String) -> void:
	match trigger_id:
		"fearful_pair":
			if DialogueState.has_seen_scene("fearful_pair"):
				return
			_play_dialogue("res://dialogue/npc/fearful_pair.json", Callable(self, "_refresh_world_state"))
		"root_keeper":
			_play_dialogue("res://dialogue/npc/root_keeper.json", Callable(self, "_refresh_world_state"))
		"hidden_child":
			_play_dialogue("res://dialogue/npc/hidden_child.json", Callable(self, "_refresh_world_state"))
		"garden_prayer_root":
			if GameState.has_flag("garden_prayer_root_seen"):
				_play_dialogue("res://dialogue/npc/garden_prayer_root_repeat.json", Callable())
				return
			GameState.set_flag("garden_prayer_root_seen", true)
			CodexState.unlock_truth("gift_is_received_not_seized")
			_play_dialogue("res://dialogue/npc/garden_prayer_root.json", Callable(self, "_refresh_world_state"))
		"veiled_glimpse":
			if DialogueState.has_seen_scene("veiled_glimpse"):
				return
			_play_dialogue("res://dialogue/main/veiled_glimpse.json", Callable())
		"first_battle":
			if GameState.has_flag("garden_first_battle_complete"):
				return
			SceneRouter.goto_battle_scene("res://scenes/battle/battle_scene.tscn", {"battle_id": "garden_encounter_01"})
		"briar_intro":
			if DialogueState.has_seen_scene("briar_intro"):
				_start_briar_battle()
				return
			_play_dialogue("res://dialogue/boss/briar_intro.json", Callable(self, "_start_briar_battle"))
		"restoration":
			if DialogueState.has_seen_scene("love_restoration"):
				if GameState.has_flag("fruit_love_restored"):
					_return_to_threshold()
				return
			_play_dialogue("res://dialogue/boss/love_restoration.json", Callable(self, "_on_restoration_finished"))
		"threshold_return":
			if GameState.has_flag("fruit_love_restored"):
				_return_to_threshold()

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

func _start_briar_battle() -> void:
	SceneRouter.goto_battle_scene("res://scenes/battle/battle_scene.tscn", {"battle_id": "briar_bridegroom"})

func _return_to_threshold() -> void:
	SceneRouter.goto_world_scene("res://scenes/world/threshold/threshold_main.tscn", {"from_garden_restoration": true})

func _refresh_world_state() -> void:
	var first_battle_complete := GameState.has_flag("garden_first_battle_complete")
	var prayer_root_seen := GameState.has_flag("garden_prayer_root_seen")
	var briar_defeated := GameState.has_flag("briar_bridegroom_defeated")
	var love_restored := GameState.has_flag("fruit_love_restored")
	var pair_seen := DialogueState.has_seen_scene("fearful_pair")
	var root_seen := DialogueState.has_seen_scene("root_keeper")
	var child_seen := DialogueState.has_seen_scene("hidden_child")

	$EnvironmentRoot/MainRootPath.color = Color(0.62, 0.75, 0.45, 1.0) if first_battle_complete else Color(0.55, 0.67, 0.4, 1.0)
	$EnvironmentRoot/PrayerRootLabel.modulate = Color(1.0, 0.95, 0.7, 1.0) if prayer_root_seen else Color(1, 1, 1, 0.8)
	$EnvironmentRoot/BossArena.color = Color(0.88, 0.82, 0.62, 1.0) if love_restored else (Color(0.72, 0.78, 0.58, 1.0) if briar_defeated else Color(0.63, 0.55, 0.48, 1.0))
	$EnvironmentRoot/TreeLabel.text = "Fruit of Love Restored" if love_restored else "Tree of First Light"
	$EnvironmentRoot/TreeLabel.modulate = Color(1.0, 0.92, 0.68, 1.0) if briar_defeated else Color(1, 1, 1, 0.85)

	$NPCRoot/FearfulPairMarker.modulate = Color(0.85, 1.0, 0.85, 1.0) if pair_seen else Color(1, 1, 1, 1)
	$NPCRoot/RootKeeperMarker.modulate = Color(0.85, 1.0, 0.85, 1.0) if root_seen else Color(1, 1, 1, 1)
	$NPCRoot/HiddenChildMarker.modulate = Color(0.85, 1.0, 0.85, 1.0) if child_seen else Color(1, 1, 1, 1)

	$TriggerRoot/BriarIntroTrigger.monitoring = not briar_defeated
	$TriggerRoot/RestorationTrigger.monitoring = briar_defeated and not love_restored
