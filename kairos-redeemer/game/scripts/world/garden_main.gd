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
	_maybe_start_grove_sidequest()
	_refresh_objective_from_state()
	_objective_hud.call("refresh_objective")
	CodexState.unlock_entry("garden_of_first_light")
	_refresh_world_state()

	var return_ctx := SceneRouter.consume_world_return_context()
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

func _maybe_start_grove_sidequest() -> void:
	if not GameState.has_flag("garden_first_battle_complete"):
		return
	if QuestState.is_quest_active("whisper_of_the_grove") or QuestState.completed_quests.has("whisper_of_the_grove"):
		return
	QuestState.start_quest("whisper_of_the_grove")

func _refresh_objective_from_state() -> void:
	if GameState.has_flag("briar_bridegroom_defeated"):
		QuestState.set_objective_text("Return to the Threshold of Testimony.")
	elif QuestState.is_quest_active("whisper_of_the_grove"):
		_apply_grove_objective()
	elif GameState.has_flag("garden_first_battle_complete"):
		QuestState.set_objective_text("Speak with the fearful pair and continue toward the Tree.")
	else:
		QuestState.set_objective_text("Reach the Tree of First Light.")

func _apply_grove_objective() -> void:
	var stage: String = str(QuestState.active_quests.get("whisper_of_the_grove", "started"))
	var quest := JournalData.get_quest("whisper_of_the_grove")
	var stage_text: String = quest.stages.get(stage, stage)
	QuestState.set_objective_text(stage_text)

func _play_arrival() -> void:
	_play_dialogue("res://dialogue/main/garden_arrival.json", Callable())

func _play_restoration() -> void:
	_play_dialogue("res://dialogue/boss/love_restoration.json", Callable(self, "_on_restoration_finished"))

func _on_restoration_finished() -> void:
	GameState.set_flag("fruit_love_restored", true)
	CodexState.unlock_verse("first_john_3_beloved")
	QuestState.complete_quest("the_first_wound")
	QuestState.set_objective_text("Return to the Threshold of Testimony.")
	_objective_hud.call("refresh_objective")
	_refresh_world_state()
	_return_to_threshold()

func handle_trigger(trigger_id: String) -> void:
	match trigger_id:
		"fearful_pair":
			_handle_fearful_pair()
		"root_keeper":
			_play_dialogue("res://dialogue/npc/root_keeper.json", Callable(self, "_refresh_world_state"))
		"hidden_child":
			_handle_hidden_child()
		"garden_prayer_root":
			_handle_prayer_root()
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

func handle_campfire(campfire_id: String) -> void:
	match campfire_id:
		"micah_veiled_watch":
			if JournalState.has_seen_campfire(campfire_id):
				return
			if not JournalState.is_campfire_available(campfire_id):
				QuestState.set_objective_text("Micah may speak after the first Garden skirmish.")
				_objective_hud.call("refresh_objective")
				return
			var campfire := JournalData.get_campfire(campfire_id)
			_play_dialogue(campfire.get("dialogue_path", ""), Callable(self, "_on_campfire_finished").bind(campfire_id))

func _handle_fearful_pair() -> void:
	if not DialogueState.has_seen_scene("fearful_pair"):
		_play_dialogue("res://dialogue/npc/fearful_pair.json", Callable(self, "_on_fearful_pair_intro"))
		return
	if QuestState.is_quest_active("whisper_of_the_grove"):
		var stage: String = str(QuestState.active_quests.get("whisper_of_the_grove", ""))
		if stage == "started":
			_play_dialogue("res://dialogue/npc/fearful_pair_grove_hint.json", Callable(self, "_on_grove_rumor_heard"))
			return
	_play_dialogue("res://dialogue/npc/fearful_pair.json", Callable(self, "_refresh_world_state"))

func _on_fearful_pair_intro() -> void:
	_maybe_start_grove_sidequest()
	_refresh_objective_from_state()
	_objective_hud.call("refresh_objective")
	_refresh_world_state()

func _on_grove_rumor_heard() -> void:
	QuestState.advance_quest("whisper_of_the_grove", "hear_rumor")
	_apply_grove_objective()
	_objective_hud.call("refresh_objective")
	_refresh_world_state()

func _handle_hidden_child() -> void:
	if QuestState.is_quest_active("whisper_of_the_grove"):
		var stage: String = str(QuestState.active_quests.get("whisper_of_the_grove", ""))
		if stage == "root_witnessed":
			_play_dialogue("res://dialogue/npc/hidden_child_resolution.json", Callable(self, "_on_grove_quest_complete"))
			return
		if stage in ["started", "hear_rumor"]:
			if not DialogueState.has_seen_scene("hidden_child"):
				_play_dialogue("res://dialogue/npc/hidden_child.json", Callable(self, "_on_hidden_child_found"))
				return
		if stage == "find_child":
			_apply_grove_objective()
			_objective_hud.call("refresh_objective")
			return
	if not DialogueState.has_seen_scene("hidden_child"):
		_play_dialogue("res://dialogue/npc/hidden_child.json", Callable(self, "_refresh_world_state"))

func _on_hidden_child_found() -> void:
	if QuestState.is_quest_active("whisper_of_the_grove"):
		QuestState.advance_quest("whisper_of_the_grove", "find_child")
		_apply_grove_objective()
		_objective_hud.call("refresh_objective")
	_refresh_world_state()

func _handle_prayer_root() -> void:
	if GameState.has_flag("garden_prayer_root_seen"):
		_play_dialogue("res://dialogue/npc/garden_prayer_root_repeat.json", Callable())
		return
	GameState.set_flag("garden_prayer_root_seen", true)
	CodexState.unlock_truth("gift_is_received_not_seized")
	CodexState.unlock_verse("philippians_4_guard")
	_play_dialogue("res://dialogue/npc/garden_prayer_root.json", Callable(self, "_on_prayer_root_finished"))

func _on_prayer_root_finished() -> void:
	if QuestState.is_quest_active("whisper_of_the_grove"):
		var stage: String = str(QuestState.active_quests.get("whisper_of_the_grove", ""))
		if stage == "find_child":
			QuestState.advance_quest("whisper_of_the_grove", "root_witnessed")
			_apply_grove_objective()
			_objective_hud.call("refresh_objective")
	_refresh_world_state()

func _on_grove_quest_complete() -> void:
	CodexState.unlock_verse("isaiah_43_fear_not")
	QuestState.complete_quest("whisper_of_the_grove")
	if not GameState.has_flag("briar_bridegroom_defeated"):
		QuestState.set_objective_text("Continue toward the Tree of First Light.")
	else:
		QuestState.set_objective_text("Return to the Threshold of Testimony.")
	_objective_hud.call("refresh_objective")
	_refresh_world_state()

func _on_campfire_finished(campfire_id: String) -> void:
	JournalState.complete_campfire(campfire_id)
	DialogueState.mark_scene_seen(campfire_id)
	_refresh_world_state()

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
	var grove_active := QuestState.is_quest_active("whisper_of_the_grove")
	var grove_stage: String = str(QuestState.active_quests.get("whisper_of_the_grove", ""))

	$EnvironmentRoot/MainRootPath.color = Color(0.62, 0.75, 0.45, 1.0) if first_battle_complete else Color(0.48, 0.62, 0.36, 1.0)
	$EnvironmentRoot/Backdrop.color = Color(0.28, 0.5, 0.34, 1.0) if love_restored else Color(0.22, 0.42, 0.28, 1.0)
	$EnvironmentRoot/WhisperingGrove.color = Color(0.42, 0.68, 0.44, 1.0) if first_battle_complete else Color(0.34, 0.58, 0.38, 1.0)
	$EnvironmentRoot/GroveLightWash.color = Color(0.92, 0.98, 0.72, 0.34) if love_restored else (Color(0.85, 0.95, 0.68, 0.28) if grove_active else Color(0.78, 0.92, 0.62, 0.22))
	$EnvironmentRoot/ThornVerge.color = Color(0.38, 0.46, 0.28, 1.0) if grove_stage in ["hear_rumor", "find_child", "root_witnessed"] else Color(0.32, 0.38, 0.24, 1.0)
	$EnvironmentRoot/PrayerRootLabel.modulate = Color(1.0, 0.95, 0.7, 1.0) if prayer_root_seen else Color(1, 1, 1, 0.8)
	$EnvironmentRoot/BossArena.color = Color(0.88, 0.82, 0.62, 1.0) if love_restored else (Color(0.72, 0.78, 0.58, 1.0) if briar_defeated else Color(0.63, 0.55, 0.48, 1.0))
	$EnvironmentRoot/TreeLabel.text = "Fruit of Love Restored" if love_restored else "Tree of First Light"
	$EnvironmentRoot/TreeLabel.modulate = Color(1.0, 0.92, 0.68, 1.0) if briar_defeated else Color(1, 1, 1, 0.85)
	$EnvironmentRoot/GroveLabel.modulate = Color(1.0, 0.95, 0.75, 1.0) if grove_active else Color(1, 1, 1, 1)
	$EnvironmentRoot/ThornVergeLabel.modulate = Color(1.0, 0.92, 0.7, 1.0) if grove_stage in ["hear_rumor", "find_child", "root_witnessed"] else Color(1, 1, 1, 1)

	$NPCRoot/FearfulPairMarker.modulate = Color(0.85, 1.0, 0.85, 1.0) if pair_seen else Color(1, 1, 1, 1)
	$NPCRoot/RootKeeperMarker.modulate = Color(0.85, 1.0, 0.85, 1.0) if root_seen else Color(1, 1, 1, 1)
	$NPCRoot/HiddenChildMarker.modulate = Color(1.0, 0.95, 0.7, 1.0) if grove_stage in ["find_child", "root_witnessed"] else (Color(0.85, 1.0, 0.85, 1.0) if child_seen else Color(1, 1, 1, 1))

	$TriggerRoot/BriarIntroTrigger.monitoring = not briar_defeated
	$TriggerRoot/RestorationTrigger.monitoring = briar_defeated and not love_restored

	var micah_campfire_available := JournalState.is_campfire_available("micah_veiled_watch")
	var micah_campfire_seen := JournalState.has_seen_campfire("micah_veiled_watch")
	$EnvironmentRoot/CampfireRing.color = Color(0.55, 0.65, 0.95, 1.0) if micah_campfire_available else Color(0.42, 0.38, 0.32, 1.0)
	$EnvironmentRoot/CampfireLabel.modulate = Color(0.85, 0.92, 1.0, 1.0) if micah_campfire_available else Color(1, 1, 1, 0.7)
	$EnvironmentRoot/CampfireLabel.text = "Micah's Watch" if not micah_campfire_seen else "Quiet Campfire"
	$TriggerRoot/CampfireTrigger.monitoring = micah_campfire_available
	$NPCRoot/MicahMarker.modulate = Color(0.9, 0.95, 1.15, 1.0) if micah_campfire_available else Color(1, 1, 1, 0.7)

	if has_node("MoodRoot/ZoneAtmosphere"):
		$MoodRoot/ZoneAtmosphere.call("apply_mood", first_battle_complete, love_restored, grove_active)
