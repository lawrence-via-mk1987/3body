extends ActorBase

@export var enemy_role: String = "striker"

func choose_action(_battle_context: Dictionary, combat_state: Node) -> Dictionary:
	if combat_state.active_lie_id.is_empty() and actor_id == "briar_bridegroom":
		return {"type": "apply_lie", "lie_id": "if_you_release_you_lose"}
	return {"type": "attack", "target_index": 0}
