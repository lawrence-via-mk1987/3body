extends ActorBase

@export var enemy_role: String = "striker"
var phase_hint: int = 1

func choose_action(_battle_context: Dictionary, combat_state: Node) -> Dictionary:
	match actor_id:
		"briar_bridegroom":
			if phase_hint >= 2 and combat_state.active_lie_id.is_empty():
				return {"type": "apply_lie", "lie_id": "if_you_release_you_lose"}
			if phase_hint >= 3:
				return {"type": "heavy_attack", "target_index": 0}
			return {"type": "attack", "target_index": 0}
		"false_blossom":
			if combat_state.active_lie_id.is_empty():
				return {"type": "attack", "target_index": 1}
			return {"type": "support_attack", "target_index": 1}
		_:
			return {"type": "attack", "target_index": 0}
