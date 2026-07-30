extends CanvasLayer

@onready var root_panel: PanelContainer = %RootPanel
@onready var journal_content: RichTextLabel = %JournalContent
@onready var codex_content: RichTextLabel = %CodexContent
@onready var summary_content: RichTextLabel = %SummaryContent
@onready var footer_hint: Label = %FooterHint
@onready var summary_button: Button = %SummaryButton
@onready var journal_button: Button = %JournalButton
@onready var codex_button: Button = %CodexButton

var _active_tab: String = "summary"

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false
	QuestState.objective_changed.connect(_on_live_refresh)
	QuestState.quest_started.connect(func(_id): _on_live_refresh(""))
	QuestState.quest_advanced.connect(func(_id, _stage): _on_live_refresh(""))
	QuestState.quest_completed.connect(func(_id): _on_live_refresh(""))
	CodexState.entry_unlocked.connect(func(_id): _on_live_refresh(""))
	CodexState.truth_unlocked.connect(func(_id): _on_live_refresh(""))
	JournalState.journal_entry_unlocked.connect(func(_id): _on_live_refresh(""))
	_refresh_all()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause") and visible:
		close_menu()

func toggle_menu() -> void:
	visible = not visible
	get_tree().paused = visible
	if visible:
		_refresh_all()

func close_menu() -> void:
	visible = false
	get_tree().paused = false

func show_summary() -> void:
	_active_tab = "summary"
	_refresh_all()

func show_journal() -> void:
	_active_tab = "journal"
	_refresh_all()

func show_codex() -> void:
	_active_tab = "codex"
	_refresh_all()

func _on_live_refresh(_unused: String = "") -> void:
	if visible:
		_refresh_all()

func _refresh_all() -> void:
	summary_content.text = _build_summary_text()
	journal_content.text = _build_journal_text()
	codex_content.text = _build_codex_text()
	footer_hint.text = _build_footer_hint()

	summary_button.text = "Summary"
	journal_button.text = "Journal (%d)" % JournalState.get_unlocked_entry_ids().size()
	codex_button.text = "Codex (%d)" % _codex_unlock_count()

	%SummaryContent.visible = _active_tab == "summary"
	%JournalContent.visible = _active_tab == "journal"
	%CodexContent.visible = _active_tab == "codex"

	_refresh_tab_highlights()

func _refresh_tab_highlights() -> void:
	var buttons := {
		"summary": summary_button,
		"journal": journal_button,
		"codex": codex_button
	}
	for tab_id in buttons:
		var button: Button = buttons[tab_id]
		button.self_modulate = Color(1.0, 0.95, 0.55) if _active_tab == tab_id else Color.WHITE

func _build_summary_text() -> String:
	var sections: Array[String] = []
	sections.append("[b]Chapter[/b]\n%s" % JournalData.get_chapter_name(GameState.current_chapter))
	sections.append("[b]Location[/b]\n%s" % JournalData.get_map_name(GameState.current_map_id))
	sections.append("[b]Active Party[/b]\n%s" % ", ".join(GameState.active_party))
	sections.append("[b]Current Objective[/b]\n%s" % QuestState.current_objective_text)

	var milestones: Array[String] = []
	if GameState.has_flag("lamp_fracture_seen"):
		milestones.append("Lamp fracture witnessed")
	if GameState.has_flag("garden_gate_opened"):
		milestones.append("Garden gate opened")
	if GameState.has_flag("briar_bridegroom_defeated"):
		milestones.append("Briar Bridegroom defeated")
	if GameState.has_flag("fruit_love_restored"):
		milestones.append("Fruit of Love restored")

	if milestones.is_empty():
		sections.append("[b]Story Milestones[/b]\n- None yet -")
	else:
		sections.append("[b]Story Milestones[/b]\n" + "\n".join(milestones.map(func(m): return "- %s" % m)))

	return "\n\n".join(sections)

func _build_journal_text() -> String:
	var sections: Array[String] = []
	sections.append("[b]Current Objective[/b]\n%s" % QuestState.current_objective_text)

	sections.append("[b]Active Quests[/b]")
	if QuestState.active_quests.is_empty():
		sections.append("- None -")
	else:
		for quest_id in QuestState.active_quests.keys():
			var quest := JournalData.get_quest(quest_id)
			var stage_id: String = str(QuestState.active_quests[quest_id])
			var stage_text: String = quest.stages.get(stage_id, stage_id)
			sections.append("[b]%s[/b]\n%s" % [quest.title, stage_text])

	if not QuestState.completed_quests.is_empty():
		sections.append("[b]Completed Quests[/b]")
		for quest_id in QuestState.completed_quests.keys():
			var quest := JournalData.get_quest(quest_id)
			sections.append("- %s" % quest.title)

	sections.append("[b]Journal Entries[/b]")
	var journal_ids := JournalState.get_unlocked_entry_ids()
	if journal_ids.is_empty():
		sections.append("- None yet -")
	else:
		for entry_id in journal_ids:
			var entry := JournalData.get_entry(entry_id)
			sections.append("[b]%s[/b]\n%s" % [entry.title, entry.body])

	sections.append("[b]Companions[/b]")
	for companion_id in ["junia", "micah"]:
		var level := DialogueState.get_relationship_flag("%s_trust" % companion_id, 0)
		var rel: Dictionary = JournalData.RELATIONSHIPS.get(companion_id, {})
		var name: String = rel.get("name", companion_id.capitalize())
		var note := JournalData.get_relationship_note(companion_id, level)
		sections.append("[b]%s[/b]\n%s" % [name, note])

	return "\n\n".join(sections)

func _build_codex_text() -> String:
	var sections: Array[String] = []

	for category in CodexData.CODEX_CATEGORIES:
		var category_ids: Array[String] = []
		for entry_id in CodexState.get_unlocked_entry_ids():
			var entry := CodexData.get_entry(entry_id)
			if entry.get("category", "") == category:
				category_ids.append(entry_id)

		if category_ids.is_empty():
			continue

		sections.append("[b]%s[/b]" % category.capitalize())
		for entry_id in category_ids:
			var entry := CodexData.get_entry(entry_id)
			sections.append("[b]%s[/b]\n%s" % [entry.title, entry.body])

	if sections.is_empty():
		sections.append("[b]Codex[/b]\n- No entries unlocked yet -")

	sections.append("[b]Truths Remembered[/b]")
	var truth_ids := CodexState.get_unlocked_truth_ids()
	if truth_ids.is_empty():
		sections.append("- None yet -")
	else:
		for truth_id in truth_ids:
			var truth := CodexData.get_truth(truth_id)
			sections.append("[i]%s[/i]\n%s" % [truth.title, truth.body])

	return "\n\n".join(sections)

func _build_footer_hint() -> String:
	if _active_tab == "journal":
		return "Journal updates as quests advance and companions share campfire scenes."
	if _active_tab == "codex":
		return "Codex entries unlock from exploration, battles, and truth-breaking."
	return "Press Escape to close."

func _codex_unlock_count() -> int:
	return CodexState.get_unlocked_entry_ids().size() + CodexState.get_unlocked_truth_ids().size()
