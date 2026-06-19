extends Area2D

@export var trigger_id: String = ""
@export var one_shot: bool = true

var _activated: bool = false

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node) -> void:
	if _activated and one_shot:
		return
	if not body.name == "Player":
		return
	_activated = true
	var parent = get_parent()
	if parent and parent.has_method("handle_trigger"):
		parent.handle_trigger(trigger_id)
