extends CanvasLayer

@onready var root_panel: PanelContainer = %RootPanel
@onready var journal_content: RichTextLabel = %JournalContent
@onready var codex_content: RichTextLabel = %CodexContent
@onready var summary_content: RichTextLabel = %SummaryContent

var _active_tab: String = "summary"

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false
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

func _refresh_all() -> void:
	var summary_text := "[b]Chapter:[/b] %s\n[b]Map:[/b] %s\n[b]Active Party:[/b] %s" % [
		GameState.current_chapter.capitalize(),
		GameState.current_map_id,
		", ".join(GameState.active_party)
	]
	summary_content.text = summary_text
	journal_content.text = "[b]Current Objective[/b]\n%s\n\n[b]Active Quests[/b]\n%s" % [
		QuestState.current_objective_text,
		_format_dict_keys(QuestState.active_quests)
	]
	codex_content.text = _build_codex_text()

	%SummaryContent.visible = _active_tab == "summary"
	%JournalContent.visible = _active_tab == "journal"
	%CodexContent.visible = _active_tab == "codex"

func _format_dict_keys(data: Dictionary) -> String:
	if data.is_empty():
		return "- None -"
	return _format_array(data.keys())

func _format_array(values: Array) -> String:
	if values.is_empty():
		return "- None -"
	var lines: Array[String] = []
	for value in values:
		lines.append("- %s" % str(value))
	return "\n".join(lines)

func _build_codex_text() -> String:
	var sections: Array[String] = ["[b]Unlocked Entries[/b]"]
	var entry_ids = CodexState.get_unlocked_entry_ids()
	if entry_ids.is_empty():
		sections.append("- None -")
	else:
		for entry_id in entry_ids:
			var entry = CodexData.get_entry(entry_id)
			sections.append("[b]%s[/b]\n%s" % [entry.title, entry.body])

	sections.append("\n[b]Unlocked Truths[/b]")
	if CodexState.unlocked_truths.is_empty():
		sections.append("- None -")
	else:
		for truth_id in CodexState.unlocked_truths.keys():
			var truth = CodexData.get_truth(truth_id)
			sections.append("[b]%s[/b]\n%s" % [truth.title, truth.body])

	return "\n\n".join(sections)
