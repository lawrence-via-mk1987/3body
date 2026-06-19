extends Node

var current_battle_id: String = ""
var assurance_points: int = 200
var assurance_max_points: int = 500
var active_lie_id: String = ""
var lie_break_progress: int = 0
var lie_break_threshold: int = 0

func reset_battle_state() -> void:
	current_battle_id = ""
	assurance_points = 200
	active_lie_id = ""
	lie_break_progress = 0
	lie_break_threshold = 0

func set_active_lie(lie_id: String, break_threshold: int) -> void:
	active_lie_id = lie_id
	lie_break_progress = 0
	lie_break_threshold = break_threshold

func add_lie_break_progress(amount: int) -> void:
	lie_break_progress = min(lie_break_progress + amount, lie_break_threshold)

func add_assurance(amount: int) -> void:
	assurance_points = clamp(assurance_points + amount, 0, assurance_max_points)

func reduce_assurance(amount: int) -> void:
	assurance_points = clamp(assurance_points - amount, 0, assurance_max_points)
