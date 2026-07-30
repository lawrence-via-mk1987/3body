extends Node

signal entry_unlocked(entry_id: String)
signal truth_unlocked(truth_id: String)

var unlocked_entries: Dictionary = {
	"beth_tikvah": true,
	"lamp_of_ages": true
}
var unlocked_truths: Dictionary = {}

func unlock_entry(entry_id: String) -> void:
	if unlocked_entries.get(entry_id, false):
		return
	unlocked_entries[entry_id] = true
	entry_unlocked.emit(entry_id)

func has_entry(entry_id: String) -> bool:
	return unlocked_entries.get(entry_id, false)

func unlock_truth(truth_id: String) -> void:
	if unlocked_truths.get(truth_id, false):
		return
	unlocked_truths[truth_id] = true
	truth_unlocked.emit(truth_id)

func has_truth(truth_id: String) -> bool:
	return unlocked_truths.get(truth_id, false)

func get_unlocked_entry_ids() -> Array[String]:
	var ids: Array[String] = []
	for entry_id in unlocked_entries.keys():
		if unlocked_entries[entry_id]:
			ids.append(entry_id)
	return ids

func get_unlocked_truth_ids() -> Array[String]:
	var ids: Array[String] = []
	for truth_id in unlocked_truths.keys():
		if unlocked_truths[truth_id]:
			ids.append(truth_id)
	ids.sort()
	return ids
