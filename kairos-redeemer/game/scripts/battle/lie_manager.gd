extends Node

func apply_lie(lie_id: String) -> void:
	match lie_id:
		"if_you_release_you_lose":
			CombatState.set_active_lie(lie_id, 5)
		_:
			CombatState.set_active_lie(lie_id, 3)

func apply_truth_counter(truth_tags: Array[String], base_value: int = 1) -> bool:
	if CombatState.active_lie_id.is_empty():
		return false

	var valid_tags := {
		"if_you_release_you_lose": ["beloved", "release", "truth", "worship"]
	}

	var break_gain := base_value
	for tag in truth_tags:
		if tag in valid_tags.get(CombatState.active_lie_id, []):
			break_gain += 1

	if CombatState.assurance_points >= 400:
		break_gain += 1

	CombatState.add_lie_break_progress(break_gain)
	return CombatState.lie_break_progress >= CombatState.lie_break_threshold
