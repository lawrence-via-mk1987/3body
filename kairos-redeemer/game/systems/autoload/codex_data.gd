extends Node

const ENTRIES := {
	"beth_tikvah": {
		"title": "Beth-Tikvah",
		"body": "House of Hope. A hill community of bread, prayer, song, and firstfruits remembrance."
	},
	"lamp_of_ages": {
		"title": "Lamp of Ages",
		"body": "A sacred witness relic tied to memory, fracture, and the wounds of history."
	},
	"threshold_of_testimony": {
		"title": "Threshold of Testimony",
		"body": "A realm outside ordinary chronology where history is seen in the light of Christ."
	},
	"keeper_of_hours": {
		"title": "Keeper of Hours",
		"body": "A grave guide of the Threshold who interprets wounded history and sends the party into the first age."
	},
	"garden_of_first_light": {
		"title": "Garden of First Light",
		"body": "The oldest remembered wound. Beauty survives here, but fear has taught gift to clutch and love to possess."
	},
	"false_blossom": {
		"title": "False Blossom",
		"body": "A deceiver of the Garden whose beauty disguises distortion and false blessing."
	},
	"briar_bridegroom": {
		"title": "Briar Bridegroom",
		"body": "Counterfeit guardian of devotion. He teaches fear to wear the face of love and possession to call itself faithfulness."
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
	}
}

func get_entry(entry_id: String) -> Dictionary:
	return ENTRIES.get(entry_id, {"title": entry_id, "body": "No entry available."})

func get_truth(truth_id: String) -> Dictionary:
	return TRUTHS.get(truth_id, {"title": truth_id, "body": "No truth available."})
