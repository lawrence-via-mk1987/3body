extends CanvasLayer

@onready var panel: PanelContainer = %NotificationPanel
@onready var title_label: Label = %NotificationTitle
@onready var body_label: RichTextLabel = %NotificationBody

var _is_showing: bool = false
var _queue: Array[Dictionary] = []

func _ready() -> void:
	panel.visible = false
	process_mode = Node.PROCESS_MODE_ALWAYS
	QuestState.objective_changed.connect(_on_objective_changed)
	CodexState.entry_unlocked.connect(_on_entry_unlocked)
	CodexState.truth_unlocked.connect(_on_truth_unlocked)
	CodexState.verse_unlocked.connect(_on_verse_unlocked)
	JournalState.journal_entry_unlocked.connect(_on_journal_unlocked)
	SaveState.save_completed.connect(_on_save_completed)

func _on_objective_changed(text: String) -> void:
	_enqueue_notice("Objective Updated", text)

func _on_entry_unlocked(entry_id: String) -> void:
	var entry := CodexData.get_entry(entry_id)
	_enqueue_notice("Codex Updated", entry.title)

func _on_truth_unlocked(truth_id: String) -> void:
	var truth := CodexData.get_truth(truth_id)
	_enqueue_notice("Truth Remembered", truth.title)

func _on_journal_unlocked(entry_id: String) -> void:
	var entry := JournalData.get_entry(entry_id)
	_enqueue_notice("Journal Updated", entry.title)

func _on_verse_unlocked(verse_id: String) -> void:
	var verse := CodexData.get_verse(verse_id)
	_enqueue_notice("Verse Fragment", verse.reference)

func _on_save_completed() -> void:
	_enqueue_notice("Progress Saved", "Your journey was saved.")

func _enqueue_notice(title: String, body: String) -> void:
	_queue.append({"title": title, "body": body})
	if not _is_showing:
		_show_next_notice()

func _show_next_notice() -> void:
	if _queue.is_empty():
		_is_showing = false
		panel.visible = false
		return

	_is_showing = true
	var notice: Dictionary = _queue.pop_front()
	title_label.text = notice.get("title", "")
	body_label.text = str(notice.get("body", ""))
	panel.visible = true
	panel.modulate.a = 0.0

	var tween := create_tween()
	tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	tween.tween_property(panel, "modulate:a", 1.0, 0.12)
	tween.tween_interval(1.6)
	tween.tween_property(panel, "modulate:a", 0.0, 0.2)
	tween.tween_callback(_show_next_notice)
