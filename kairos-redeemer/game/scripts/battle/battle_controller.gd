extends Node

const PLAYER_SCENE := preload("res://scenes/characters/player_battle_actor.tscn")
const FALSE_BLOSSOM_SCENE := preload("res://scenes/battle/enemies/false_blossom.tscn")
const THORN_HOUND_SCENE := preload("res://scenes/battle/enemies/thorn_hound.tscn")
const BRIAR_SCENE := preload("res://scenes/battle/bosses/briar_bridegroom.tscn")

@onready var enemy_root: Node2D = $"../EnemyRoot"
@onready var enemy_buttons: VBoxContainer = $"../EnemyRoot/EnemyButtons"
@onready var party_root: Node2D = $"../PartyRoot"
@onready var boss_name_label: Label = $"../UILayer/BattleHUD/BossPanel/BossVBox/BossName"
@onready var boss_hp_bar: ProgressBar = $"../UILayer/BattleHUD/BossPanel/BossVBox/BossHP"
@onready var boss_phase_label: Label = $"../UILayer/BattleHUD/BossPanel/BossVBox/BossPhase"
@onready var active_lie_label: Label = $"../UILayer/BattleHUD/BossPanel/BossVBox/ActiveLie"
@onready var lie_break_bar: ProgressBar = $"../UILayer/BattleHUD/BossPanel/BossVBox/LieBreakMeter"
@onready var prayer_root_status_label: Label = $"../UILayer/BattleHUD/BossPanel/BossVBox/PrayerRootStatus"
@onready var assurance_bar: ProgressBar = $"../UILayer/BattleHUD/AssurancePanel/AssuranceVBox/AssuranceBar"
@onready var status_labels: Array[Label] = [
	$"../UILayer/BattleHUD/PartyPanel/PartyVBox/EliorStatus",
	$"../UILayer/BattleHUD/PartyPanel/PartyVBox/JuniaStatus",
	$"../UILayer/BattleHUD/PartyPanel/PartyVBox/MicahStatus"
]
@onready var command_label: Label = $"../UILayer/CommandMenu/CommandMargin/CommandVBox/CommandLabel"
@onready var target_hint_label: Label = $"../UILayer/CommandMenu/CommandMargin/CommandVBox/TargetHint"
@onready var attack_button: Button = $"../UILayer/CommandMenu/CommandMargin/CommandVBox/CommandButtons/AttackButton"
@onready var tech_button: Button = $"../UILayer/CommandMenu/CommandMargin/CommandVBox/CommandButtons/TechButton"
@onready var defend_button: Button = $"../UILayer/CommandMenu/CommandMargin/CommandVBox/CommandButtons/DefendButton"
@onready var pray_button: Button = $"../UILayer/CommandMenu/CommandMargin/CommandVBox/CommandButtons/PrayButton"
@onready var synergy_button: Button = $"../UILayer/CommandMenu/CommandMargin/CommandVBox/CommandButtons/SynergyButton"
@onready var tech_list: VBoxContainer = $"../UILayer/CommandMenu/CommandMargin/CommandVBox/TechList"
@onready var tutorial_popup: CanvasLayer = $"../UILayer/TutorialPopup"
@onready var reward_panel: PanelContainer = $"../UILayer/RewardPanel"
@onready var reward_body: RichTextLabel = $"../UILayer/RewardPanel/RewardMargin/RewardVBox/RewardBody"
@onready var reward_continue_button: Button = $"../UILayer/RewardPanel/RewardMargin/RewardVBox/RewardContinueButton"

var battle_context: Dictionary = {}
var party_actors: Array[ActorBase] = []
var enemy_actors: Array[ActorBase] = []
var active_actor: ActorBase
var ready_queue: Array[ActorBase] = []
var lie_manager: Node
var battle_active: bool = false
var boss_phase: int = 1
var manual_command_open: bool = false
var selected_tech_mode: bool = false
var first_tutorial_shown: bool = false
var pending_target_action: Dictionary = {}
var pending_synergy_helper_id: String = ""
var boss_phase_transition_seen: Dictionary = {}
var prayer_root_phase_available: Dictionary = {}
var battle_result_pending_return: bool = false
var battle_victory_rewards_text: String = ""

func _ready() -> void:
	lie_manager = preload("res://scripts/battle/lie_manager.gd").new()
	add_child(lie_manager)
	battle_context = SceneRouter.battle_context
	_bind_buttons()
	_start_battle()

func _process(delta: float) -> void:
	if not battle_active:
		return

	for actor in party_actors + enemy_actors:
		if actor.is_defeated or actor.is_ready:
			continue
		actor.atb_value += actor.get_atb_gain(delta)
		if actor.atb_value >= actor.atb_max:
			actor.is_ready = true
			ready_queue.append(actor)

	if active_actor == null and not ready_queue.is_empty():
		active_actor = ready_queue.pop_front()
		if active_actor in party_actors:
			_begin_player_turn(active_actor)
		else:
			_process_enemy_turn(active_actor)

	_update_ui()

func _start_battle() -> void:
	CombatState.reset_battle_state()
	_spawn_party()
	_spawn_enemies()
	battle_active = true
	battle_result_pending_return = false
	battle_victory_rewards_text = ""
	reward_panel.visible = false
	command_label.text = "Awaiting actor..."
	target_hint_label.text = ""
	_set_command_buttons_enabled(false)
	_initialize_prayer_root_state()
	if not first_tutorial_shown:
		tutorial_popup.show_popup("[b]BATTLE BASICS[/b]\nSelect actions when a party member is ready. Use [i]Pray[/i] to gain Assurance and [i]Tech[/i] abilities to break Lies.")
		first_tutorial_shown = true

func _bind_buttons() -> void:
	attack_button.pressed.connect(_on_attack_pressed)
	tech_button.pressed.connect(_on_tech_pressed)
	defend_button.pressed.connect(_on_defend_pressed)
	pray_button.pressed.connect(_on_pray_pressed)
	synergy_button.pressed.connect(_on_synergy_pressed)
	reward_continue_button.pressed.connect(_on_reward_continue_pressed)

func _spawn_party() -> void:
	var actors = [
		{"id": "elior", "name": "Elior", "position": Vector2(160, 340), "color": Color(0.85, 0.75, 0.45), "hp": 120, "sp": 30, "power": 14, "guard": 12, "spirit": 11, "speed": 10},
		{"id": "junia", "name": "Junia", "position": Vector2(160, 420), "color": Color(0.95, 0.62, 0.47), "hp": 90, "sp": 36, "power": 9, "guard": 8, "spirit": 14, "speed": 14},
		{"id": "micah", "name": "Micah", "position": Vector2(160, 500), "color": Color(0.35, 0.45, 0.7), "hp": 100, "sp": 28, "power": 12, "guard": 10, "spirit": 10, "speed": 12}
	]

	for actor_data in actors:
		var actor: ActorBase = PLAYER_SCENE.instantiate()
		actor.actor_id = actor_data.id
		actor.display_name = actor_data.name
		actor.max_hp = actor_data.hp
		actor.max_sp = actor_data.sp
		actor.power = actor_data.power
		actor.guard = actor_data.guard
		actor.spirit = actor_data.spirit
		actor.speed = actor_data.speed
		actor.position = actor_data.position
		actor.get_node("Body").color = actor_data.color
		party_root.add_child(actor)
		party_actors.append(actor)

func _spawn_enemies() -> void:
	var battle_id: String = battle_context.get("battle_id", "garden_encounter_01")
	match battle_id:
		"briar_bridegroom":
			var boss: ActorBase = BRIAR_SCENE.instantiate()
			boss.position = Vector2(930, 390)
			enemy_root.add_child(boss)
			enemy_actors.append(boss)
			boss_name_label.text = "Briar Bridegroom"
			var blossom: ActorBase = FALSE_BLOSSOM_SCENE.instantiate()
			blossom.position = Vector2(1080, 330)
			enemy_root.add_child(blossom)
			enemy_actors.append(blossom)
		"garden_encounter_01":
			var hound: ActorBase = THORN_HOUND_SCENE.instantiate()
			hound.position = Vector2(860, 330)
			enemy_root.add_child(hound)
			enemy_actors.append(hound)
			var blossom: ActorBase = FALSE_BLOSSOM_SCENE.instantiate()
			blossom.position = Vector2(1020, 450)
			enemy_root.add_child(blossom)
			enemy_actors.append(blossom)
			boss_name_label.text = "Garden Encounter"
	_refresh_boss_max_value()
	_refresh_enemy_buttons()

func _begin_player_turn(actor: ActorBase) -> void:
	manual_command_open = true
	selected_tech_mode = false
	pending_target_action.clear()
	pending_synergy_helper_id = ""
	command_label.text = "%s is ready. Choose an action." % actor.display_name
	target_hint_label.text = ""
	_set_command_buttons_enabled(true)
	_refresh_tech_buttons()
	_refresh_enemy_buttons()

func _process_enemy_turn(actor: ActorBase) -> void:
	actor.phase_hint = boss_phase
	var action := actor.call("choose_action", battle_context, CombatState)
	match action.get("type", "attack"):
		"apply_lie":
			lie_manager.apply_lie(action.get("lie_id", "if_you_release_you_lose"))
			CombatState.reduce_assurance(20)
			command_label.text = "%s twists the battle with a Lie." % actor.display_name
		"attack":
			var target := _get_party_target(action.get("target_index", 0))
			if target != null:
				target.take_damage(_enemy_damage(actor, 10))
				command_label.text = "%s strikes %s." % [actor.display_name, target.display_name]
		"heavy_attack":
			var target := _get_party_target(action.get("target_index", 0))
			if target != null:
				target.take_damage(_enemy_damage(actor, 18))
				command_label.text = "%s lashes out with crushing force." % actor.display_name
		"support_attack":
			var target := _get_party_target(action.get("target_index", 1))
			if target != null:
				target.take_damage(_enemy_damage(actor, 12))
				CombatState.reduce_assurance(10)
				command_label.text = "%s strikes through the confusion." % actor.display_name

	if actor.actor_id == "briar_bridegroom":
		_update_briar_phase(actor)

	_finish_turn(actor)

func _update_briar_phase(actor: ActorBase) -> void:
	var hp_ratio := float(actor.current_hp) / float(max(actor.max_hp, 1))
	if hp_ratio <= 0.35:
		boss_phase = 3
	elif hp_ratio <= 0.70:
		boss_phase = 2
	else:
		boss_phase = 1

	if not boss_phase_transition_seen.get(boss_phase, false):
		boss_phase_transition_seen[boss_phase] = true
		_ensure_prayer_root_for_phase(boss_phase)
		match boss_phase:
			2:
				command_label.text = "Briar Bridegroom tightens the Garden's grip."
				target_hint_label.text = "A Lie may soon be imposed. Prepare Truth actions."
				tutorial_popup.show_popup("[b]Phase 2 - Possession[/b]\nThe Garden closes in. Use Truth actions and prayer wisely when the Lie appears.")
			3:
				command_label.text = "Briar Bridegroom forces beauty into possession."
				target_hint_label.text = "Break the Lie or the final phase will intensify."
				tutorial_popup.show_popup("[b]Phase 3 - False Union[/b]\nThe Briar Bridegroom grows more violent. A fresh Prayer Root pulse is available this phase.")

func _finish_turn(actor: ActorBase) -> void:
	ready_queue.erase(actor)
	actor.atb_value = 0.0
	actor.is_ready = false
	active_actor = null
	manual_command_open = false
	selected_tech_mode = false
	pending_target_action.clear()
	pending_synergy_helper_id = ""
	_set_command_buttons_enabled(false)
	tech_list.visible = false
	_cleanup_defeated()
	_refresh_enemy_buttons()
	_check_battle_end()

func _cleanup_defeated() -> void:
	party_actors = party_actors.filter(func(a): return not a.is_defeated)
	enemy_actors = enemy_actors.filter(func(a): return not a.is_defeated)

func _check_battle_end() -> void:
	if enemy_actors.is_empty():
		battle_active = false
		command_label.text = "Victory."
		match battle_context.get("battle_id", ""):
			"briar_bridegroom":
				GameState.set_flag("briar_bridegroom_defeated", true)
				CodexState.unlock_entry("briar_bridegroom")
				CodexState.unlock_truth("beloved_son_receives_and_gives")
				battle_victory_rewards_text = "[b]Fruit of Love Restored[/b]\n- Codex entry unlocked: Briar Bridegroom\n- Truth unlocked: The Beloved Son Receives and Gives\n- Return to the Threshold of Testimony"
			"garden_encounter_01":
				GameState.set_flag("garden_first_battle_complete", true)
				QuestState.set_objective_text("Speak with the fearful pair and continue toward the Tree.")
				CodexState.unlock_entry("garden_of_first_light")
				CodexState.unlock_entry("false_blossom")
				battle_victory_rewards_text = "[b]Garden Encounter Cleared[/b]\n- Objective updated\n- Codex entries unlocked: Garden of First Light, False Blossom"
		_show_reward_panel()
	elif party_actors.is_empty():
		battle_active = false
		command_label.text = "Defeat. Returning to previous scene."
		call_deferred("_return_to_world")

func _return_to_world() -> void:
	SceneRouter.return_to_previous_world_scene()

func _update_ui() -> void:
	if enemy_actors.is_empty():
		boss_hp_bar.value = 0
	else:
		var total_hp := 0
		for enemy in enemy_actors:
			total_hp += enemy.current_hp
		boss_hp_bar.value = total_hp
	boss_phase_label.text = "Phase %d" % boss_phase if battle_context.get("battle_id", "") == "briar_bridegroom" else "Skirmish"
	active_lie_label.text = "Active Lie: %s" % (CombatState.active_lie_id if not CombatState.active_lie_id.is_empty() else "--")
	lie_break_bar.max_value = max(CombatState.lie_break_threshold, 1)
	lie_break_bar.value = CombatState.lie_break_progress
	prayer_root_status_label.text = "Prayer Root: %s" % _current_prayer_root_status()
	assurance_bar.max_value = CombatState.assurance_max_points
	assurance_bar.value = CombatState.assurance_points

	for i in range(status_labels.size()):
		if i >= party_actors.size():
			status_labels[i].text = "--"
			continue
		var actor = party_actors[i]
		var readiness := ""
		if actor == active_actor:
			readiness = " [ACTIVE]"
		elif actor.is_ready:
			readiness = " [READY]"
		status_labels[i].text = "%s HP %d SP %d%s" % [actor.display_name, actor.current_hp, actor.current_sp, readiness]

func _set_command_buttons_enabled(enabled: bool) -> void:
	attack_button.disabled = not enabled
	tech_button.disabled = not enabled
	defend_button.disabled = not enabled
	pray_button.disabled = not enabled
	synergy_button.disabled = not enabled

func _on_attack_pressed() -> void:
	if not _can_accept_player_input():
		return
	if enemy_actors.is_empty():
		return
	pending_target_action = {"type": "attack", "multiplier": 1.0}
	target_hint_label.text = "Choose an enemy target."
	command_label.text = "%s prepares to strike." % active_actor.display_name
	_refresh_enemy_buttons()

func _on_tech_pressed() -> void:
	if not _can_accept_player_input():
		return
	selected_tech_mode = not selected_tech_mode
	_refresh_tech_buttons()

func _on_defend_pressed() -> void:
	if not _can_accept_player_input():
		return
	command_label.text = "%s takes a defensive stance." % active_actor.display_name
	CombatState.add_assurance(5)
	_finish_turn(active_actor)

func _on_pray_pressed() -> void:
	if not _can_accept_player_input():
		return
	var boosted_prayer := false
	if battle_context.get("battle_id", "") == "briar_bridegroom" and prayer_root_phase_available.get(boss_phase, false):
		prayer_root_phase_available[boss_phase] = false
		CombatState.add_assurance(35)
		boosted_prayer = true
		command_label.text = "%s prays at the truth-root. The Garden answers with clarity." % active_actor.display_name
		if CombatState.active_lie_id == "if_you_release_you_lose":
			var broke := lie_manager.apply_truth_counter(["beloved", "release", "truth", "worship"], 2)
			if broke and not enemy_actors.is_empty():
				_clear_active_lie()
				enemy_actors[0].take_damage(70)
				command_label.text = "Prayer breaks the Lie and opens Briar Bridegroom!"
	else:
		CombatState.add_assurance(20)
		command_label.text = "%s prays and steadies the party." % active_actor.display_name
	if boosted_prayer:
		target_hint_label.text = "The truth-root has gone still for this phase."
	_finish_turn(active_actor)

func _on_synergy_pressed() -> void:
	if not _can_accept_player_input():
		return
	if active_actor.actor_id != "elior":
		command_label.text = "Only Elior can initiate slice synergy in this build."
		return
	var helper_id := _first_ready_helper_for_elior()
	if helper_id.is_empty():
		command_label.text = "No ally is ready for synergy."
		return
	pending_synergy_helper_id = helper_id
	pending_target_action = {"type": "synergy"}
	command_label.text = "%s calls for aid from %s." % [active_actor.display_name, helper_id.capitalize()]
	target_hint_label.text = "Choose an enemy target for the synergy."
	_refresh_enemy_buttons()

func _refresh_tech_buttons() -> void:
	for child in tech_list.get_children():
		child.queue_free()

	tech_list.visible = selected_tech_mode and active_actor != null
	if not tech_list.visible or active_actor == null:
		target_hint_label.text = "" if pending_target_action.is_empty() else target_hint_label.text
		return

	for ability in _get_actor_techs(active_actor.actor_id):
		var button := Button.new()
		button.text = "%s (SP %d)" % [ability.name, ability.sp_cost]
		button.disabled = active_actor.current_sp < ability.sp_cost
		button.pressed.connect(_on_tech_button_pressed.bind(ability))
		tech_list.add_child(button)

func _use_tech(ability: Dictionary) -> void:
	if not _can_accept_player_input():
		return
	if not active_actor.spend_sp(ability.sp_cost):
		command_label.text = "Not enough SP."
		return
	if enemy_actors.is_empty():
		return

	match ability.type:
		"damage":
			pending_target_action = {"type": "tech_damage", "ability": ability}
			command_label.text = "%s prepares %s." % [active_actor.display_name, ability.name]
			target_hint_label.text = "Choose an enemy target."
		"release":
			CombatState.add_assurance(15)
			pending_target_action = {"type": "tech_release", "ability": ability}
			command_label.text = "%s prepares %s." % [active_actor.display_name, ability.name]
			target_hint_label.text = "Choose the enemy pressing the Lie."
		"truth":
			pending_target_action = {"type": "tech_truth", "ability": ability}
			command_label.text = "%s invokes %s." % [active_actor.display_name, ability.name]
			target_hint_label.text = "Choose the enemy under Truth pressure."
		"reveal":
			pending_target_action = {"type": "tech_reveal", "ability": ability}
			command_label.text = "%s focuses %s." % [active_actor.display_name, ability.name]
			target_hint_label.text = "Choose an enemy target."
	_refresh_enemy_buttons()

func _get_actor_techs(actor_id: String) -> Array[Dictionary]:
	match actor_id:
		"elior":
			return [
				{"name": "Seed Slash", "sp_cost": 4, "type": "damage", "multiplier": 1.35},
				{"name": "Beloved Seal", "sp_cost": 8, "type": "truth", "truth_tags": ["beloved", "truth"], "break_value": 2}
			]
		"junia":
			return [
				{"name": "Psalm Rush", "sp_cost": 4, "type": "damage", "multiplier": 1.2},
				{"name": "Song of Release", "sp_cost": 7, "type": "release", "truth_tags": ["release", "worship"], "break_value": 2}
			]
		"micah":
			return [
				{"name": "Veil Pierce", "sp_cost": 4, "type": "reveal", "multiplier": 1.0},
				{"name": "Watchman's Cry", "sp_cost": 5, "type": "truth", "truth_tags": ["witness"], "break_value": 1}
			]
		_:
			return []

func _calculate_basic_damage(attacker: ActorBase, defender: ActorBase, multiplier: float) -> int:
	return max(int(attacker.power * multiplier - defender.guard * 0.35), 1)

func _can_accept_player_input() -> bool:
	return battle_active and manual_command_open and active_actor != null and active_actor in party_actors

func _first_ready_helper_for_elior() -> String:
	for actor in party_actors:
		if actor.actor_id == "elior":
			continue
		if actor.is_ready:
			return actor.actor_id
	return ""

func _consume_helper(helper_id: String) -> void:
	for actor in party_actors:
		if actor.actor_id == helper_id:
			ready_queue.erase(actor)
			actor.atb_value = 0.0
			actor.is_ready = false
			return

func _refresh_enemy_buttons() -> void:
	for child in enemy_buttons.get_children():
		child.queue_free()

	for enemy in enemy_actors:
		var button := Button.new()
		button.text = "%s HP %d" % [enemy.display_name, enemy.current_hp]
		button.disabled = enemy.is_defeated or pending_target_action.is_empty()
		button.pressed.connect(_on_enemy_target_selected.bind(enemy))
		enemy_buttons.add_child(button)

func _on_enemy_target_selected(target: ActorBase) -> void:
	if pending_target_action.is_empty() or not _can_accept_player_input():
		return

	var action_type: String = pending_target_action.get("type", "")
	match action_type:
		"attack":
			var damage := _calculate_basic_damage(active_actor, target, pending_target_action.get("multiplier", 1.0))
			target.take_damage(damage)
			command_label.text = "%s attacks %s for %d damage." % [active_actor.display_name, target.display_name, damage]
			_finish_turn(active_actor)
		"tech_damage":
			var ability: Dictionary = pending_target_action.get("ability", {})
			var damage := _calculate_basic_damage(active_actor, target, ability.get("multiplier", 1.0))
			target.take_damage(damage)
			command_label.text = "%s uses %s for %d damage." % [active_actor.display_name, ability.get("name", "Tech"), damage]
			_finish_turn(active_actor)
		"tech_release":
			var ability: Dictionary = pending_target_action.get("ability", {})
			var broke := false
			if CombatState.active_lie_id == "if_you_release_you_lose":
				broke = lie_manager.apply_truth_counter(ability.get("truth_tags", []), ability.get("break_value", 1))
			command_label.text = "%s uses %s to resist the Lie." % [active_actor.display_name, ability.get("name", "Tech")]
			if broke:
				_clear_active_lie()
				target.take_damage(60)
				command_label.text = "%s breaks the Lie and opens %s!" % [ability.get("name", "Tech"), target.display_name]
			_finish_turn(active_actor)
		"tech_truth":
			var ability: Dictionary = pending_target_action.get("ability", {})
			if CombatState.active_lie_id == "if_you_release_you_lose":
				var broke := lie_manager.apply_truth_counter(ability.get("truth_tags", []), ability.get("break_value", 1))
				command_label.text = "%s invokes %s against the Lie." % [active_actor.display_name, ability.get("name", "Tech")]
				if broke:
					_clear_active_lie()
					CombatState.add_assurance(40)
					target.take_damage(60)
					command_label.text = "%s shatters the Lie around %s." % [ability.get("name", "Tech"), target.display_name]
			else:
				command_label.text = "%s steadies the party, but no Lie is active." % ability.get("name", "Tech")
				CombatState.add_assurance(10)
			_finish_turn(active_actor)
		"tech_reveal":
			var ability: Dictionary = pending_target_action.get("ability", {})
			var damage := _calculate_basic_damage(active_actor, target, ability.get("multiplier", 1.0))
			target.take_damage(damage)
			CombatState.add_assurance(10)
			command_label.text = "%s exposes %s." % [ability.get("name", "Tech"), target.display_name]
			_finish_turn(active_actor)
		"synergy":
			var damage := 0
			if pending_synergy_helper_id == "junia":
				damage = 36
				CombatState.add_assurance(15)
				command_label.text = "Psalm of First Light strikes %s and heartens the party." % target.display_name
			elif pending_synergy_helper_id == "micah":
				damage = 42
				if CombatState.active_lie_id == "if_you_release_you_lose":
					var broke := lie_manager.apply_truth_counter(["beloved", "truth", "witness"], 2)
					if broke:
						_clear_active_lie()
						CombatState.add_assurance(25)
				command_label.text = "Serpent Breaker tears through %s." % target.display_name

			target.take_damage(damage)
			_consume_helper(pending_synergy_helper_id)
			_finish_turn(active_actor)

func _clear_active_lie() -> void:
	CombatState.active_lie_id = ""
	CombatState.lie_break_progress = 0
	CombatState.lie_break_threshold = 0
	target_hint_label.text = "The Lie has broken. Press the advantage."

func _get_party_target(target_index: int) -> ActorBase:
	if party_actors.is_empty():
		return null
	var clamped_index := clamp(target_index, 0, party_actors.size() - 1)
	return party_actors[clamped_index]

func _enemy_damage(actor: ActorBase, base_damage: int) -> int:
	return max(base_damage + int(actor.power * 0.35), 1)

func _refresh_boss_max_value() -> void:
	var total_max_hp := 0
	for enemy in enemy_actors:
		total_max_hp += enemy.max_hp
	boss_hp_bar.max_value = max(total_max_hp, 1)

func _on_tech_button_pressed(ability: Dictionary) -> void:
	_use_tech(ability)

func _initialize_prayer_root_state() -> void:
	prayer_root_phase_available.clear()
	_ensure_prayer_root_for_phase(1)

func _ensure_prayer_root_for_phase(phase: int) -> void:
	if battle_context.get("battle_id", "") != "briar_bridegroom":
		return
	if not prayer_root_phase_available.has(phase):
		prayer_root_phase_available[phase] = true

func _current_prayer_root_status() -> String:
	if battle_context.get("battle_id", "") != "briar_bridegroom":
		return "--"
	return "Ready" if prayer_root_phase_available.get(boss_phase, false) else "Spent"

func _show_reward_panel() -> void:
	reward_panel.visible = true
	reward_body.text = battle_victory_rewards_text
	battle_result_pending_return = true
	target_hint_label.text = "Choose Return to leave the battle."
	_set_command_buttons_enabled(false)
	tech_list.visible = false

func _on_reward_continue_pressed() -> void:
	if not battle_result_pending_return:
		return
	battle_result_pending_return = false
	reward_panel.visible = false
	call_deferred("_return_to_world")
