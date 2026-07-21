extends Node

signal quest_started(quest_id: String)
signal quest_advanced(quest_id: String, stage_id: String)
signal quest_completed(quest_id: String)
signal objective_changed(text: String)

var active_quests: Dictionary = {}
var completed_quests: Dictionary = {}
var current_objective_text: String = "Speak with Elder Hadarah."

func start_quest(quest_id: String) -> void:
	active_quests[quest_id] = "started"
	quest_started.emit(quest_id)

func advance_quest(quest_id: String, stage_id: String) -> void:
	active_quests[quest_id] = stage_id
	quest_advanced.emit(quest_id, stage_id)

func complete_quest(quest_id: String) -> void:
	completed_quests[quest_id] = true
	active_quests.erase(quest_id)
	quest_completed.emit(quest_id)

func is_quest_active(quest_id: String) -> bool:
	return active_quests.has(quest_id)

func set_objective_text(text: String) -> void:
	current_objective_text = text
	objective_changed.emit(text)
