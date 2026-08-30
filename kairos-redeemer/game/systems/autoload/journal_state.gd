extends Node

signal journal_entry_unlocked(entry_id: String)

var unlocked_entries: Dictionary = {}
var seen_campfires: Dictionary = {}

func _ready() -> void:
	QuestState.quest_started.connect(_on_quest_started)
	QuestState.quest_advanced.connect(_on_quest_advanced)
	QuestState.quest_completed.connect(_on_quest_completed)

func unlock_entry(entry_id: String) -> void:
	if unlocked_entries.get(entry_id, false):
		return
	unlocked_entries[entry_id] = true
	journal_entry_unlocked.emit(entry_id)

func has_entry(entry_id: String) -> bool:
	return unlocked_entries.get(entry_id, false)

func get_unlocked_entry_ids() -> Array[String]:
	var ids: Array[String] = []
	for entry_id in unlocked_entries.keys():
		if unlocked_entries[entry_id]:
			ids.append(entry_id)
	ids.sort()
	return ids

func mark_campfire_seen(campfire_id: String) -> void:
	seen_campfires[campfire_id] = true

func has_seen_campfire(campfire_id: String) -> bool:
	return seen_campfires.get(campfire_id, false)

func is_campfire_available(campfire_id: String) -> bool:
	if has_seen_campfire(campfire_id):
		return false
	var campfire: Dictionary = JournalData.get_campfire(campfire_id)
	if campfire.is_empty():
		return false
	for scene_id in campfire.get("required_scenes", []):
		if not DialogueState.has_seen_scene(scene_id):
			return false
	for flag_id in campfire.get("required_flags", []):
		if not GameState.has_flag(flag_id):
			return false
	var quest_req: Dictionary = campfire.get("required_quest_stage", {})
	for quest_id in quest_req.keys():
		if not QuestState.is_quest_active(quest_id):
			return false
		if str(QuestState.active_quests.get(quest_id, "")) != str(quest_req[quest_id]):
			return false
	return true

func get_available_campfire_ids() -> Array[String]:
	var ids: Array[String] = []
	for campfire_id in JournalData.CAMPFIRES.keys():
		if is_campfire_available(campfire_id):
			ids.append(campfire_id)
	return ids

func complete_campfire(campfire_id: String) -> void:
	var campfire: Dictionary = JournalData.get_campfire(campfire_id)
	mark_campfire_seen(campfire_id)
	var journal_id: String = campfire.get("journal_unlock", "")
	if not journal_id.is_empty():
		unlock_entry(journal_id)
	var rel_flag: String = campfire.get("relationship_flag", "")
	if not rel_flag.is_empty():
		DialogueState.set_relationship_flag(rel_flag, campfire.get("relationship_value", 1))

func _on_quest_started(quest_id: String) -> void:
	_maybe_unlock_quest_journal(quest_id, "started")

func _on_quest_advanced(quest_id: String, stage_id: String) -> void:
	_maybe_unlock_quest_journal(quest_id, stage_id)

func _on_quest_completed(quest_id: String) -> void:
	if quest_id == "the_first_wound":
		unlock_entry("journal_love_restored")
	if quest_id == "whisper_of_the_grove":
		unlock_entry("journal_whisper_grove_complete")

func _maybe_unlock_quest_journal(quest_id: String, stage_id: String) -> void:
	var hooks: Dictionary = JournalData.QUEST_JOURNAL_HOOKS.get(quest_id, {})
	var entry_id: String = hooks.get(stage_id, "")
	if entry_id.is_empty():
		return
	unlock_entry(entry_id)
