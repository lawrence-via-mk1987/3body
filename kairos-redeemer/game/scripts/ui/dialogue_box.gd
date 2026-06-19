extends CanvasLayer

signal dialogue_finished

@onready var speaker_name_label: Label = %SpeakerName
@onready var dialogue_text_label: RichTextLabel = %DialogueText
@onready var continue_hint_label: Label = %ContinueHint

var _lines: Array[Dictionary] = []
var _current_index: int = 0
var _active: bool = false

func _ready() -> void:
	hide_dialogue()

func start_dialogue(lines: Array[Dictionary]) -> void:
	if lines.is_empty():
		return
	_lines = lines
	_current_index = 0
	_active = true
	visible = true
	_show_current_line()

func _unhandled_input(event: InputEvent) -> void:
	if not _active:
		return
	if event.is_action_pressed("advance_dialogue"):
		_advance()

func _advance() -> void:
	_current_index += 1
	if _current_index >= _lines.size():
		hide_dialogue()
		return
	_show_current_line()

func _show_current_line() -> void:
	var line: Dictionary = _lines[_current_index]
	speaker_name_label.text = line.get("speaker", "")
	dialogue_text_label.text = line.get("text", "")
	continue_hint_label.text = "[Space] Continue"

func hide_dialogue() -> void:
	visible = false
	_active = false
	_lines.clear()
	_current_index = 0
	dialogue_finished.emit()
