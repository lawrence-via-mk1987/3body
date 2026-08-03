extends CanvasLayer

signal dismissed

@onready var body_label: RichTextLabel = %BodyLabel

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_refresh_body()
	visible = true

func _refresh_body() -> void:
	var lines: Array[String] = [
		"[b]Prologue Complete — The First Wound[/b]",
		"",
		"You have walked the opening arc:",
		"- Lamp fracture and Threshold awakening",
		"- Garden of First Light and the Briar Bridegroom",
		"- Fruit of Love restored",
		"- Elior named the beloved wound",
		"",
		"[i]The Meridian waits beyond the Gate. The full journey continues in a future chapter.[/i]",
		"",
		"Journal, Codex, and Verse Fragments remain available from the pause menu."
	]
	body_label.text = "\n".join(lines)

func _on_continue_pressed() -> void:
	visible = false
	dismissed.emit()
