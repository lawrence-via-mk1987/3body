extends Node

const CHAPTERS := {
	"prologue": "Prologue — House of Hope"
}

const MAPS := {
	"beth_tikvah_main": "Beth-Tikvah",
	"threshold_main": "Threshold of Testimony",
	"garden_main": "Garden of First Light"
}

const QUESTS := {
	"firstfruits_morning": {
		"title": "Firstfruits Morning",
		"stages": {
			"started": "Receive Hadarah's blessing and join the feast.",
			"meet_junia": "Meet Junia at the Singer's Steps.",
			"approach_lamp": "Approach the Lamp Pavilion."
		}
	},
	"through_the_rupture": {
		"title": "Through the Rupture",
		"stages": {
			"started": "Awaken in the Threshold of Testimony."
		}
	},
	"the_first_wound": {
		"title": "The First Wound",
		"stages": {
			"started": "Enter the Garden and reach the Tree of First Light."
		}
	},
	"whisper_of_the_grove": {
		"title": "Whisper of the Grove",
		"stages": {
			"started": "A whisper speaks of a child hiding in the Thorn Verge.",
			"hear_rumor": "Search the Thorn Verge for the hidden child.",
			"find_child": "Visit the Hidden Prayer Root, then return to the child.",
			"root_witnessed": "Return to the hidden child in the Thorn Verge."
		}
	}
}

const ENTRIES := {
	"journal_beth_tikvah_feast": {
		"title": "Feast Morning",
		"body": "Beth-Tikvah remembers firstfruits with bread, song, and prayer. Hope is not naive here — it is practiced.",
		"category": "milestone"
	},
	"journal_lamp_fracture": {
		"title": "Lamp Fracture",
		"body": "The Lamp of Ages cracked. History did not break cleanly. Something pulled us into the Threshold.",
		"category": "milestone"
	},
	"journal_threshold_arrival": {
		"title": "Threshold Arrival",
		"body": "We stand outside ordinary time. The Keeper says wounded history can still be read in Christ's light.",
		"category": "milestone"
	},
	"journal_garden_edge": {
		"title": "Garden Edge",
		"body": "Beauty survives in the Garden, but fear taught gift to clutch and love to possess.",
		"category": "milestone"
	},
	"journal_love_restored": {
		"title": "Fruit of Love Restored",
		"body": "The Briar Bridegroom fell. Elior learned again that gift is received, not seized.",
		"category": "milestone"
	},
	"journal_junia_first_watch": {
		"title": "Junia — First Watch",
		"body": "Junia admitted she also struggles to receive rest. She watches because love refuses to clutch.",
		"category": "companions"
	},
	"journal_micah_veiled_watch": {
		"title": "Micah — Veiled Watch",
		"body": "Micah confessed that witness is not the same as clutching control. The Father sees in the dark.",
		"category": "companions"
	},
	"journal_whisper_grove_started": {
		"title": "Whisper in the Grove",
		"body": "After the first skirmish, whispers spread of a child who hides because love here once felt like possession.",
		"category": "sidequest"
	},
	"journal_whisper_grove_complete": {
		"title": "Room to Return",
		"body": "The hidden child chose to return freely — invited, not seized. The Grove remembers a gentler way.",
		"category": "sidequest"
	}
}

const RELATIONSHIPS := {
	"junia": {
		"name": "Junia",
		"notes": {
			0: "Bright at the feast. Still testing whether Elior will let anyone near his burdens.",
			1: "Shared the first watch at the Threshold. Beginning to speak honestly about fear and rest."
		}
	},
	"micah": {
		"name": "Micah",
		"notes": {
			0: "Quiet watchman. Sees more than he says at the Threshold gate.",
			1: "Shared the veiled watch in the Grove. Learning that witness is not clutching control."
		}
	}
}

const QUEST_JOURNAL_HOOKS := {
	"firstfruits_morning": {
		"started": "journal_beth_tikvah_feast"
	},
	"through_the_rupture": {
		"started": "journal_threshold_arrival"
	},
	"the_first_wound": {
		"started": "journal_garden_edge"
	},
	"whisper_of_the_grove": {
		"started": "journal_whisper_grove_started"
	}
}

const CAMPFIRES := {
	"junia_first_watch": {
		"title": "Junia — First Watch",
		"companion": "junia",
		"required_scenes": ["keeper_briefing"],
		"dialogue_path": "res://dialogue/campfire/junia_first_watch.json",
		"journal_unlock": "journal_junia_first_watch",
		"relationship_flag": "junia_trust",
		"relationship_value": 1
	},
	"micah_veiled_watch": {
		"title": "Micah — Veiled Watch",
		"companion": "micah",
		"required_scenes": ["keeper_briefing"],
		"required_flags": ["garden_first_battle_complete"],
		"dialogue_path": "res://dialogue/campfire/micah_veiled_watch.json",
		"journal_unlock": "journal_micah_veiled_watch",
		"relationship_flag": "micah_trust",
		"relationship_value": 1
	}
}

func get_quest(quest_id: String) -> Dictionary:
	return QUESTS.get(quest_id, {"title": quest_id, "stages": {}})

func get_entry(entry_id: String) -> Dictionary:
	return ENTRIES.get(entry_id, {"title": entry_id, "body": "No journal entry.", "category": "milestone"})

func get_map_name(map_id: String) -> String:
	return MAPS.get(map_id, map_id)

func get_chapter_name(chapter_id: String) -> String:
	return CHAPTERS.get(chapter_id, chapter_id.capitalize())

func get_campfire(campfire_id: String) -> Dictionary:
	return CAMPFIRES.get(campfire_id, {})

func get_relationship_note(companion_id: String, level: int) -> String:
	var rel: Dictionary = RELATIONSHIPS.get(companion_id, {})
	var notes: Dictionary = rel.get("notes", {})
	if notes.has(level):
		return notes[level]
	var highest := -1
	for key in notes.keys():
		if int(key) <= level and int(key) > highest:
			highest = int(key)
	if highest >= 0:
		return notes[highest]
	return "No notes yet."
