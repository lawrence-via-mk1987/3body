extends Area2D

@export var campfire_id: String = ""

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
	if body.name != "Player":
		return
	var handler := _find_handler("handle_campfire")
	if handler != null:
		handler.call("handle_campfire", campfire_id)

func _find_handler(method_name: String) -> Node:
	var node: Node = get_parent()
	while node != null:
		if node.has_method(method_name):
			return node
		node = node.get_parent()
	return null
