extends Node2D

const PLAYER_SCENE := preload("res://scenes/characters/player.tscn")
const DIALOGUE_BOX_SCENE := preload("res://scenes/ui/dialogue_box.tscn")
const OBJECTIVE_HUD_SCENE := preload("res://scenes/ui/objective_hud.tscn")
const PAUSE_MENU_SCENE := preload("res://scenes/ui/pause_menu.tscn")
const NOTIFICATION_HUD_SCENE := preload("res://scenes/ui/notification_hud.tscn")
const PROLOGUE_COMPLETE_SCENE := preload("res://scenes/ui/prologue_complete_screen.tscn")
const DIALOGUE_LOADER := preload("res://scripts/dialogue/dialogue_loader.gd")

var _dialogue_box: CanvasLayer
var _objective_hud: CanvasLayer
var _pause_menu: CanvasLayer
var _notification_hud: CanvasLayer
var _prologue_screen: CanvasLayer
var _pending_action: Callable

func _ready() -> void:
	GameState.set_current_map("threshold_main")
	_spawn_player()
	_spawn_ui()
	_objective_hud.call("set_zone", "Threshold of Testimony")
	CodexState.unlock_entry("threshold_of_testimony")
	var return_ctx := SceneRouter.consume_world_return_context()
	_refresh_objective_from_state(return_ctx)
	_objective_hud.call("refresh_objective")
	_maybe_start_elior_wound_quest()
	_refresh_world_state()

	if return_ctx.get("from_garden_restoration", false) and GameState.has_flag("fruit_love_restored") and not DialogueState.has_seen_scene("meridian_teaser"):
		call_deferred("_play_meridian_teaser")
	elif not DialogueState.has_seen_scene("threshold_wakeup"):
		call_deferred("_play_intro")
	elif GameState.has_flag("fruit_love_restored") and not DialogueState.has_seen_scene("meridian_teaser"):
		call_deferred("_play_meridian_teaser")

	if GameState.has_flag("prologue_complete") and not GameState.has_flag("prologue_complete_screen_seen"):
		call_deferred("_show_prologue_complete_screen")

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

func _refresh_objective_from_state(return_ctx: Dictionary = {}) -> void:
	if GameState.has_flag("prologue_complete"):
		QuestState.set_objective_text("Prologue complete. Explore the Threshold or review the Journal.")
	elif QuestState.is_quest_active("elior_beloved_wound"):
		var stage: String = str(QuestState.active_quests.get("elior_beloved_wound", "started"))
		var quest := JournalData.get_quest("elior_beloved_wound")
		QuestState.set_objective_text(quest.stages.get(stage, stage))
	elif GameState.has_flag("fruit_love_restored"):
		if not DialogueState.has_seen_scene("meridian_teaser"):
			QuestState.set_objective_text("Receive the Meridian teaser.")
		elif return_ctx.get("from_garden_restoration", false):
			QuestState.set_objective_text("Receive the Meridian teaser.")
		else:
			QuestState.set_objective_text("Receive the Meridian teaser.")
	elif not DialogueState.has_seen_scene("threshold_wakeup"):
		QuestState.set_objective_text("Listen to the Keeper's briefing.")
	else:
		QuestState.set_objective_text("Enter the Garden of First Light.")

func _play_intro() -> void:
	_play_dialogue("res://dialogue/main/threshold_wakeup.json", Callable())

func _play_meridian_teaser() -> void:
	_play_dialogue("res://dialogue/main/meridian_teaser.json", Callable(self, "_on_meridian_teaser_finished"))

func _on_meridian_teaser_finished() -> void:
	_maybe_start_elior_wound_quest()
	_refresh_objective_from_state()
	_objective_hud.call("refresh_objective")
	_refresh_world_state()

func _maybe_start_elior_wound_quest() -> void:
	if not GameState.has_flag("fruit_love_restored"):
		return
	if not DialogueState.has_seen_scene("meridian_teaser"):
		return
	if GameState.has_flag("elior_wound_confessed"):
		return
	if QuestState.is_quest_active("elior_beloved_wound") or QuestState.completed_quests.has("elior_beloved_wound"):
		return
	QuestState.start_quest("elior_beloved_wound")

func handle_trigger(trigger_id: String) -> void:
	match trigger_id:
		"keeper_briefing":
			if DialogueState.has_seen_scene("keeper_briefing"):
				return
			_play_dialogue("res://dialogue/main/keeper_briefing.json", Callable())
		"witness_pool":
			_handle_witness_pool()
		"micah_watch":
			_play_dialogue("res://dialogue/npc/micah_watch.json", Callable())
		"threshold_inscription":
			_play_dialogue("res://dialogue/npc/threshold_inscription.json", Callable())
		"garden_gate":
			if not DialogueState.has_seen_scene("keeper_briefing"):
				QuestState.set_objective_text("Listen to the Keeper before approaching the gate.")
				_objective_hud.call("refresh_objective")
				return
			_play_dialogue("res://dialogue/main/garden_gate_open.json", Callable(self, "_go_to_garden"))

func _handle_witness_pool() -> void:
	if QuestState.is_quest_active("elior_beloved_wound") and str(QuestState.active_quests.get("elior_beloved_wound", "")) == "started":
		_play_dialogue("res://dialogue/npc/elior_wound_memory.json", Callable(self, "_on_elior_memory_spoken"))
		return
	_play_dialogue("res://dialogue/npc/witness_pool.json", Callable())

func _on_elior_memory_spoken() -> void:
	QuestState.advance_quest("elior_beloved_wound", "memory_spoken")
	_refresh_objective_from_state()
	_objective_hud.call("refresh_objective")
	_refresh_world_state()

func handle_campfire(campfire_id: String) -> void:
	if JournalState.has_seen_campfire(campfire_id):
		return
	if not JournalState.is_campfire_available(campfire_id):
		var hint := _campfire_locked_hint(campfire_id)
		QuestState.set_objective_text(hint)
		_objective_hud.call("refresh_objective")
		return
	var campfire := JournalData.get_campfire(campfire_id)
	_play_dialogue(campfire.get("dialogue_path", ""), Callable(self, "_on_campfire_finished").bind(campfire_id))

func _campfire_locked_hint(campfire_id: String) -> String:
	match campfire_id:
		"junia_first_watch":
			return "Junia may speak after the Keeper's briefing."
		"elior_beloved_wound":
			return "Elior must first remember at the Witness Pool."
		_:
			return "This campfire is not ready yet."

func _on_campfire_finished(campfire_id: String) -> void:
	JournalState.complete_campfire(campfire_id)
	DialogueState.mark_scene_seen(campfire_id)
	if campfire_id == "elior_beloved_wound":
		CodexState.unlock_truth("beloved_before_you_grasp")
		CodexState.unlock_verse("zephaniah_3_quiet_love")
		GameState.set_flag("elior_wound_confessed", true)
		GameState.set_flag("prologue_complete", true)
		GameState.set_current_chapter("prologue_clear")
		QuestState.complete_quest("elior_beloved_wound")
		_refresh_objective_from_state()
		_objective_hud.call("refresh_objective")
		SaveState.autosave("prologue_complete")
		if not GameState.has_flag("prologue_complete_screen_seen"):
			call_deferred("_show_prologue_complete_screen")
	_refresh_world_state()

func _show_prologue_complete_screen() -> void:
	if _prologue_screen != null:
		return
	_prologue_screen = PROLOGUE_COMPLETE_SCENE.instantiate()
	_prologue_screen.dismissed.connect(_on_prologue_complete_dismissed)
	add_child(_prologue_screen)
	get_tree().paused = true

func _on_prologue_complete_dismissed() -> void:
	GameState.set_flag("prologue_complete_screen_seen", true)
	get_tree().paused = false
	if _prologue_screen != null:
		_prologue_screen.queue_free()
		_prologue_screen = null
	SaveState.autosave("prologue_screen_seen")

func _play_dialogue(path: String, on_finish: Callable) -> void:
	_pending_action = on_finish
	var lines = DIALOGUE_LOADER.load_scene_lines(path)
	_dialogue_box.start_dialogue(lines)
	DialogueState.mark_scene_seen(path.get_file().get_basename())

	if path.ends_with("keeper_briefing.json"):
		QuestState.set_objective_text("Step through the first gate into the Garden.")
		_objective_hud.call("refresh_objective")
		CodexState.unlock_entry("keeper_of_hours")
		CodexState.unlock_verse("romans_8_beloved")
		_refresh_world_state()

func _on_dialogue_finished() -> void:
	if _pending_action.is_valid():
		var action := _pending_action
		_pending_action = Callable()
		action.call()

func _go_to_garden() -> void:
	GameState.set_flag("garden_gate_opened", true)
	QuestState.complete_quest("through_the_rupture")
	QuestState.start_quest("the_first_wound")
	SceneRouter.goto_world_scene("res://scenes/world/garden_of_first_light/garden_main.tscn")

func _refresh_world_state() -> void:
	var keeper_seen := DialogueState.has_seen_scene("keeper_briefing")
	var love_restored := GameState.has_flag("fruit_love_restored")
	var elior_wound_active := QuestState.is_quest_active("elior_beloved_wound")
	var elior_wound_stage: String = str(QuestState.active_quests.get("elior_beloved_wound", ""))

	$EnvironmentRoot/Backdrop.color = Color(0.12, 0.18, 0.28, 1.0) if love_restored else Color(0.1, 0.14, 0.22, 1.0)
	$EnvironmentRoot/Starway.color = Color(0.42, 0.5, 0.62, 1.0) if keeper_seen else Color(0.32, 0.38, 0.48, 1.0)

	$EnvironmentRoot/GateDais.color = Color(0.96, 0.9, 0.58, 1.0) if keeper_seen else Color(0.72, 0.72, 0.62, 1.0)
	$EnvironmentRoot/GateLabel.text = "Meridian Reflection" if love_restored else "Gate of First Light"
	$EnvironmentRoot/GateLabel.modulate = Color(0.8, 0.94, 1.0, 1.0) if love_restored else Color(1, 1, 1, 1)
	$NPCRoot/KeeperMarker.modulate = Color(1.0, 1.0, 1.0, 0.75) if keeper_seen else Color(1, 1, 1, 1)

	_refresh_junia_campfire_state()
	_refresh_elior_campfire_state(elior_wound_active, elior_wound_stage)

	$EnvironmentRoot/WitnessPool.color = Color(0.42, 0.62, 0.82, 1.0) if elior_wound_active else Color(0.28, 0.48, 0.68, 1.0)
	$EnvironmentRoot/WitnessPoolGlow.color = Color(0.72, 0.88, 1.0, 0.5) if elior_wound_active else (Color(0.65, 0.82, 0.98, 0.38) if keeper_seen else Color(0.55, 0.78, 0.95, 0.35))
	$EnvironmentRoot/WitnessPoolLabel.modulate = Color(0.9, 0.95, 1.0, 1.0) if elior_wound_active else Color(1, 1, 1, 1)
	$NPCRoot/EliorMarker.modulate = Color(1.0, 0.95, 0.7, 1.0) if JournalState.is_campfire_available("elior_beloved_wound") else (Color(0.95, 0.9, 0.75, 1.0) if elior_wound_active else Color(1, 1, 1, 0.65))

	if has_node("MoodRoot/ZoneAtmosphere"):
		$MoodRoot/ZoneAtmosphere.call("apply_mood", keeper_seen, love_restored)

func _refresh_junia_campfire_state() -> void:
	var campfire_available := JournalState.is_campfire_available("junia_first_watch")
	var campfire_seen := JournalState.has_seen_campfire("junia_first_watch")
	$EnvironmentRoot/CampfireRing.color = Color(1.0, 0.72, 0.42, 1.0) if campfire_available else Color(0.55, 0.42, 0.32, 1.0)
	$EnvironmentRoot/CampfireLabel.modulate = Color(1.0, 0.9, 0.65, 1.0) if campfire_available else Color(1, 1, 1, 0.7)
	$EnvironmentRoot/CampfireLabel.text = "Junia's Watch" if not campfire_seen else "Quiet Campfire"
	$TriggerRoot/CampfireTrigger.monitoring = campfire_available
	$NPCRoot/JuniaMarker.modulate = Color(1.15, 1.0, 0.85, 1.0) if campfire_available else Color(1, 1, 1, 0.65)

func _refresh_elior_campfire_state(elior_wound_active: bool, elior_wound_stage: String) -> void:
	var elior_campfire_available := JournalState.is_campfire_available("elior_beloved_wound")
	var elior_campfire_seen := JournalState.has_seen_campfire("elior_beloved_wound")
	$EnvironmentRoot/EliorCampfireRing.color = Color(1.0, 0.88, 0.55, 1.0) if elior_campfire_available else Color(0.48, 0.52, 0.62, 1.0)
	$EnvironmentRoot/EliorCampfireLabel.modulate = Color(1.0, 0.92, 0.68, 1.0) if elior_campfire_available else Color(1, 1, 1, 0.7)
	$EnvironmentRoot/EliorCampfireLabel.text = "Elior's Reflection" if not elior_campfire_seen else "Still Water"
	$TriggerRoot/EliorCampfireTrigger.monitoring = elior_campfire_available
