extends Control

@onready var continue_button: Button = %ContinueButton
@onready var save_summary_label: Label = %SaveSummaryLabel

func _ready() -> void:
	var has_save := SaveState.has_save_file()
	continue_button.disabled = not has_save
	if has_save:
		save_summary_label.text = SaveState.get_save_summary()
	else:
		save_summary_label.text = "No saved journey yet."

func _on_new_game_pressed() -> void:
	SaveState.start_new_game()

func _on_continue_pressed() -> void:
	if not SaveState.continue_game():
		continue_button.disabled = true
		save_summary_label.text = "Could not load save."

func _on_quit_pressed() -> void:
	get_tree().quit()
