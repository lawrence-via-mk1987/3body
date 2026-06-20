extends CanvasLayer

@onready var panel: PanelContainer = %TutorialPanel
@onready var body_text: RichTextLabel = %TutorialBody

func _ready() -> void:
	hide_popup()

func show_popup(text: String) -> void:
	panel.visible = true
	body_text.text = text

func hide_popup() -> void:
	panel.visible = false
