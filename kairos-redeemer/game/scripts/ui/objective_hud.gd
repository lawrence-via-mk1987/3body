extends CanvasLayer

@onready var zone_label: Label = %ZoneLabel
@onready var objective_label: Label = %ObjectiveLabel

func set_zone(zone_name: String) -> void:
	zone_label.text = "Zone: %s" % zone_name

func refresh_objective() -> void:
	objective_label.text = "Objective: %s" % QuestState.current_objective_text

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	refresh_objective()
	QuestState.objective_changed.connect(_on_objective_changed)

func _on_objective_changed(_text: String) -> void:
	refresh_objective()
