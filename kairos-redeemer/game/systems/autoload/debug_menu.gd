extends Node

const BETH_TIKVAH := "res://scenes/world/beth_tikvah/beth_tikvah_main.tscn"
const THRESHOLD := "res://scenes/world/threshold/threshold_main.tscn"
const GARDEN := "res://scenes/world/garden_of_first_light/garden_main.tscn"
const MAIN_MENU := "res://scenes/ui/main_menu.tscn"

var _layer: CanvasLayer
var _panel: PanelContainer
var _state_label: RichTextLabel
var _visible: bool = false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build_ui()

func _unhandled_input(event: InputEvent) -> void:
	if not OS.is_debug_build():
		return
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_F3:
			toggle()
			get_viewport().set_input_as_handled()

func toggle() -> void:
	_visible = not _visible
	_layer.visible = _visible
	if _visible:
		_refresh_state()

func _build_ui() -> void:
	_layer = CanvasLayer.new()
	_layer.layer = 120
	_layer.visible = false
	_layer.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(_layer)

	_panel = PanelContainer.new()
	_panel.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	_panel.offset_left = -360.0
	_panel.offset_top = 12.0
	_panel.offset_right = -12.0
	_panel.offset_bottom = 640.0
	_layer.add_child(_panel)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 12)
	margin.add_theme_constant_override("margin_top", 12)
	margin.add_theme_constant_override("margin_right", 12)
	margin.add_theme_constant_override("margin_bottom", 12)
	_panel.add_child(margin)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 6)
	margin.add_child(vbox)

	var title := Label.new()
	title.text = "Debug Menu (F3)"
	title.add_theme_font_size_override("font_size", 18)
	vbox.add_child(title)

	_state_label = RichTextLabel.new()
	_state_label.bbcode_enabled = true
	_state_label.fit_content = true
	_state_label.custom_minimum_size = Vector2(0, 150)
	vbox.add_child(_state_label)

	_add_section(vbox, "Warp")
	_add_button(vbox, "Beth-Tikvah", func(): _warp(BETH_TIKVAH))
	_add_button(vbox, "Threshold", func(): _warp(THRESHOLD))
	_add_button(vbox, "Garden", func(): _warp(GARDEN))
	_add_button(vbox, "Main Menu", func(): _goto_main_menu())

	_add_section(vbox, "Story Skips")
	_add_button(vbox, "Skip to Threshold (post-fracture)", _skip_to_threshold)
	_add_button(vbox, "Skip to Garden (post-briefing)", _skip_to_garden)
	_add_button(vbox, "Clear first battle", _skip_first_battle)
	_add_button(vbox, "Defeat Briar + restore love", _skip_briar)
	_add_button(vbox, "Unlock Elior wound arc", _skip_to_elior_arc)
	_add_button(vbox, "Complete prologue", _complete_prologue)

	_add_section(vbox, "Utility")
	_add_button(vbox, "Unlock all campfires", _unlock_campfires)
	_add_button(vbox, "Delete save file", func(): SaveState.delete_save_file(); _refresh_state())
	_add_button(vbox, "Reset all state", _reset_state)
	_add_button(vbox, "Print state to Output", _print_state)

func _add_section(parent: Node, text: String) -> void:
	var label := Label.new()
	label.text = text
	label.add_theme_color_override("font_color", Color(0.72, 0.82, 1.0))
	parent.add_child(label)

func _add_button(parent: Node, text: String, action: Callable) -> void:
	var button := Button.new()
	button.text = text
	button.pressed.connect(action)
	parent.add_child(button)

func _refresh_state() -> void:
	if _state_label == null:
		return
	var flags: Array[String] = []
	for flag_id in GameState.progression_flags.keys():
		if GameState.progression_flags[flag_id]:
			flags.append(flag_id)
	flags.sort()

	var quests: Array[String] = []
	for quest_id in QuestState.active_quests.keys():
		quests.append("%s: %s" % [quest_id, QuestState.active_quests[quest_id]])
	quests.sort()

	_state_label.text = "[b]Map:[/b] %s\n[b]Chapter:[/b] %s\n[b]Objective:[/b] %s\n[b]Active quests:[/b] %s\n[b]Flags:[/b] %s" % [
		GameState.current_map_id,
		GameState.current_chapter,
		QuestState.current_objective_text,
		"none" if quests.is_empty() else ", ".join(quests),
		"none" if flags.is_empty() else ", ".join(flags)
	]

func _warp(scene_path: String) -> void:
	SceneRouter.goto_world_scene(scene_path)
	await get_tree().create_timer(0.4).timeout
	_refresh_state()

func _goto_main_menu() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file(MAIN_MENU)
	_refresh_state()

func _skip_to_threshold() -> void:
	DialogueState.mark_scene_seen("opening_blessing")
	DialogueState.mark_scene_seen("junia_festival_intro")
	DialogueState.mark_scene_seen("lamp_fracture")
	GameState.set_flag("lamp_fracture_seen", true)
	QuestState.complete_quest("firstfruits_morning")
	QuestState.start_quest("through_the_rupture")
	_warp(THRESHOLD)

func _skip_to_garden() -> void:
	_skip_to_threshold_flags()
	DialogueState.mark_scene_seen("threshold_wakeup")
	DialogueState.mark_scene_seen("keeper_briefing")
	GameState.set_flag("garden_gate_opened", true)
	QuestState.complete_quest("through_the_rupture")
	QuestState.start_quest("the_first_wound")
	_warp(GARDEN)

func _skip_to_threshold_flags() -> void:
	DialogueState.mark_scene_seen("opening_blessing")
	DialogueState.mark_scene_seen("junia_festival_intro")
	DialogueState.mark_scene_seen("lamp_fracture")
	GameState.set_flag("lamp_fracture_seen", true)

func _skip_first_battle() -> void:
	GameState.set_flag("garden_first_battle_complete", true)
	DialogueState.mark_scene_seen("garden_arrival")
	_refresh_state()
	_reload_current_world()

func _skip_briar() -> void:
	_skip_to_threshold_flags()
	DialogueState.mark_scene_seen("threshold_wakeup")
	DialogueState.mark_scene_seen("keeper_briefing")
	DialogueState.mark_scene_seen("garden_arrival")
	DialogueState.mark_scene_seen("briar_intro")
	DialogueState.mark_scene_seen("love_restoration")
	GameState.set_flag("garden_first_battle_complete", true)
	GameState.set_flag("briar_bridegroom_defeated", true)
	GameState.set_flag("fruit_love_restored", true)
	QuestState.complete_quest("the_first_wound")
	_warp(THRESHOLD)

func _skip_to_elior_arc() -> void:
	_skip_briar()
	DialogueState.mark_scene_seen("meridian_teaser")
	if not QuestState.completed_quests.has("elior_beloved_wound"):
		QuestState.start_quest("elior_beloved_wound")
	_refresh_state()

func _complete_prologue() -> void:
	_skip_to_elior_arc()
	GameState.set_flag("elior_wound_confessed", true)
	GameState.set_flag("prologue_complete", true)
	GameState.set_current_chapter("prologue_clear")
	QuestState.complete_quest("elior_beloved_wound")
	_refresh_state()

func _unlock_campfires() -> void:
	DialogueState.mark_scene_seen("keeper_briefing")
	GameState.set_flag("garden_first_battle_complete", true)
	_refresh_state()
	_reload_current_world()

func _reset_state() -> void:
	SaveState.reset_all_states()
	SaveState.delete_save_file()
	_goto_main_menu()

func _print_state() -> void:
	print("=== DEBUG STATE ===")
	print("map: ", GameState.current_map_id)
	print("chapter: ", GameState.current_chapter)
	print("flags: ", GameState.progression_flags)
	print("active quests: ", QuestState.active_quests)
	print("completed quests: ", QuestState.completed_quests)
	print("seen scenes: ", DialogueState.seen_scenes)
	print("campfires seen: ", JournalState.seen_campfires)
	print("===================")

func _reload_current_world() -> void:
	var current := get_tree().current_scene
	if current == null:
		return
	var path := current.scene_file_path
	if path.is_empty() or path == MAIN_MENU:
		return
	_warp(path)
