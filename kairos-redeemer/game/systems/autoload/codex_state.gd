extends Node

var unlocked_entries: Dictionary = {
	"beth_tikvah": true,
	"lamp_of_ages": true
}
var unlocked_truths: Dictionary = {}

func unlock_entry(entry_id: String) -> void:
	unlocked_entries[entry_id] = true

func has_entry(entry_id: String) -> bool:
	return unlocked_entries.get(entry_id, false)

func unlock_truth(truth_id: String) -> void:
	unlocked_truths[truth_id] = true

func has_truth(truth_id: String) -> bool:
	return unlocked_truths.get(truth_id, false)

func get_unlocked_entry_ids() -> Array[String]:
	return unlocked_entries.keys()
