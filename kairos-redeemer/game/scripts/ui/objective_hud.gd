extends CanvasLayer

@onready var zone_label: Label = %ZoneLabel
@onready var objective_label: Label = %ObjectiveLabel

func set_zone(zone_name: String) -> void:
	zone_label.text = "Zone: %s" % zone_name

func refresh_objective() -> void:
	objective_label.text = "Objective: %s" % QuestState.current_objective_text
