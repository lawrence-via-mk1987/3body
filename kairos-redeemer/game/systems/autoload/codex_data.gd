extends Node

const ENTRIES := {
	"beth_tikvah": {
		"title": "Beth-Tikvah",
		"body": "House of Hope. A hill community of bread, prayer, song, and firstfruits remembrance.",
		"category": "places"
	},
	"lamp_of_ages": {
		"title": "Lamp of Ages",
		"body": "A sacred witness relic tied to memory, fracture, and the wounds of history.",
		"category": "places"
	},
	"threshold_of_testimony": {
		"title": "Threshold of Testimony",
		"body": "A realm outside ordinary chronology where history is seen in the light of Christ.",
		"category": "places"
	},
	"keeper_of_hours": {
		"title": "Keeper of Hours",
		"body": "A grave guide of the Threshold who interprets wounded history and sends the party into the first age.",
		"category": "people"
	},
	"garden_of_first_light": {
		"title": "Garden of First Light",
		"body": "The oldest remembered wound. Beauty survives here, but fear has taught gift to clutch and love to possess.",
		"category": "places"
	},
	"false_blossom": {
		"title": "False Blossom",
		"body": "A deceiver of the Garden whose beauty disguises distortion and false blessing.",
		"category": "foes"
	},
	"briar_bridegroom": {
		"title": "Briar Bridegroom",
		"body": "Counterfeit guardian of devotion. He teaches fear to wear the face of love and possession to call itself faithfulness.",
		"category": "foes"
	}
}

const TRUTHS := {
	"gift_is_received_not_seized": {
		"title": "Gift Is Received, Not Seized",
		"body": "Fear grasps because it distrusts the Giver. Love opens its hand and receives without possession."
	},
	"beloved_son_receives_and_gives": {
		"title": "The Beloved Son Receives and Gives",
		"body": "The first man grasped in distrust. The Beloved Son receives from the Father and gives without fear."
	},
	"beloved_before_you_grasp": {
		"title": "Beloved Before You Grasp",
		"body": "The Father's love is not wages for the strong. You were His before you proved anything."
	}
}

const VERSES := {
	"psalm_23_shepherd": {
		"title": "Psalm 23:1",
		"reference": "Psalm 23:1",
		"body": "The Lord is my shepherd; I shall not want.",
		"theme": "beloved"
	},
	"romans_8_beloved": {
		"title": "Romans 8:16",
		"reference": "Romans 8:16",
		"body": "The Spirit himself testifies with our spirit that we are children of God.",
		"theme": "identity"
	},
	"philippians_4_guard": {
		"title": "Philippians 4:7",
		"reference": "Philippians 4:7",
		"body": "And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.",
		"theme": "peace"
	},
	"isaiah_43_fear_not": {
		"title": "Isaiah 43:1",
		"reference": "Isaiah 43:1",
		"body": "Fear not, for I have redeemed you; I have called you by name, you are mine.",
		"theme": "beloved"
	},
	"first_john_3_beloved": {
		"title": "1 John 3:1",
		"reference": "1 John 3:1",
		"body": "See what kind of love the Father has given to us, that we should be called children of God.",
		"theme": "beloved"
	},
	"zephaniah_3_quiet_love": {
		"title": "Zephaniah 3:17",
		"reference": "Zephaniah 3:17",
		"body": "The Lord your God is in your midst, a mighty one who will save; he will rejoice over you with gladness.",
		"theme": "beloved"
	}
}

func get_entry(entry_id: String) -> Dictionary:
	return ENTRIES.get(entry_id, {"title": entry_id, "body": "No entry available.", "category": "places"})

func get_truth(truth_id: String) -> Dictionary:
	return TRUTHS.get(truth_id, {"title": truth_id, "body": "No truth available."})

func get_verse(verse_id: String) -> Dictionary:
	return VERSES.get(verse_id, {"title": verse_id, "reference": "", "body": "No verse available.", "theme": ""})

func get_entries_by_category(category: String) -> Array[String]:
	var ids: Array[String] = []
	for entry_id in ENTRIES.keys():
		if ENTRIES[entry_id].get("category", "") == category:
			ids.append(entry_id)
	ids.sort()
	return ids

const CODEX_CATEGORIES := ["places", "people", "foes"]
