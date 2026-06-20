extends Node

const PLAYER_SCENE := preload("res://scenes/characters/player_battle_actor.tscn")
const FALSE_BLOSSOM_SCENE := preload("res://scenes/battle/enemies/false_blossom.tscn")
const BRIAR_SCENE := preload("res://scenes/battle/bosses/briar_bridegroom.tscn")

@onready var enemy_root: Node2D = $"../EnemyRoot"
@onready var party_root: Node2D = $"../PartyRoot"
@onready var boss_name_label: Label = $"../UILayer/BattleHUD/BossPanel/BossVBox/BossName"
@onready var boss_hp_bar: ProgressBar = $"../UILayer/BattleHUD/BossPanel/BossVBox/BossHP"
@onready var boss_phase_label: Label = $"../UILayer/BattleHUD/BossPanel/BossVBox/BossPhase"
@onready var active_lie_label: Label = $"../UILayer/BattleHUD/BossPanel/BossVBox/ActiveLie"
@onready var lie_break_bar: ProgressBar = $"../UILayer/BattleHUD/BossPanel/BossVBox/LieBreakMeter"
@onready var assurance_bar: ProgressBar = $"../UILayer/BattleHUD/AssurancePanel/AssuranceVBox/AssuranceBar"
@onready var status_labels: Array[Label] = [
	$"../UILayer/BattleHUD/PartyPanel/PartyVBox/EliorStatus",
	$"../UILayer/BattleHUD/PartyPanel/PartyVBox/JuniaStatus",
	$"../UILayer/BattleHUD/PartyPanel/PartyVBox/MicahStatus"
]
@onready var command_label: Label = $"../UILayer/CommandMenu/CommandMargin/CommandVBox/CommandLabel"
@onready var attack_button: Button = $"../UILayer/CommandMenu/CommandMargin/CommandVBox/CommandButtons/AttackButton"
@onready var tech_button: Button = $"../UILayer/CommandMenu/CommandMargin/CommandVBox/CommandButtons/TechButton"
@onready var defend_button: Button = $"../UILayer/CommandMenu/CommandMargin/CommandVBox/CommandButtons/DefendButton"
@onready var pray_button: Button = $"../UILayer/CommandMenu/CommandMargin/CommandVBox/CommandButtons/PrayButton"
@onready var synergy_button: Button = $"../UILayer/CommandMenu/CommandMargin/CommandVBox/CommandButtons/SynergyButton"
@onready var tech_list: VBoxContainer = $"../UILayer/CommandMenu/CommandMargin/CommandVBox/TechList"
@onready var tutorial_popup: CanvasLayer = $"../UILayer/TutorialPopup"

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
	command_label.text = "Awaiting actor..."
	_set_command_buttons_enabled(false)
	if not first_tutorial_shown:
		tutorial_popup.show_popup("[b]BATTLE BASICS[/b]\nSelect actions when a party member is ready. Use [i]Pray[/i] to gain Assurance and [i]Tech[/i] abilities to break Lies.")
		first_tutorial_shown = true

func _bind_buttons() -> void:
	attack_button.pressed.connect(_on_attack_pressed)
	tech_button.pressed.connect(_on_tech_pressed)
	defend_button.pressed.connect(_on_defend_pressed)
	pray_button.pressed.connect(_on_pray_pressed)
	synergy_button.pressed.connect(_on_synergy_pressed)

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
			boss_hp_bar.max_value = boss.max_hp
		_:
			var blossom: ActorBase = FALSE_BLOSSOM_SCENE.instantiate()
			blossom.position = Vector2(900, 390)
			enemy_root.add_child(blossom)
			enemy_actors.append(blossom)
			boss_name_label.text = "False Blossom"
			boss_hp_bar.max_value = blossom.max_hp

func _begin_player_turn(actor: ActorBase) -> void:
	manual_command_open = true
	selected_tech_mode = false
	command_label.text = "%s is ready. Choose an action." % actor.display_name
	_set_command_buttons_enabled(true)
	_refresh_tech_buttons()

func _process_enemy_turn(actor: ActorBase) -> void:
	var action := actor.call("choose_action", battle_context, CombatState)
	match action.get("type", "attack"):
		"apply_lie":
			lie_manager.apply_lie(action.get("lie_id", "if_you_release_you_lose"))
			CombatState.reduce_assurance(20)
			command_label.text = "%s twists the battle with a Lie." % actor.display_name
		"attack":
			if not party_actors.is_empty():
				party_actors[0].take_damage(10)
				command_label.text = "%s strikes %s." % [actor.display_name, party_actors[0].display_name]

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

func _finish_turn(actor: ActorBase) -> void:
	ready_queue.erase(actor)
	actor.atb_value = 0.0
	actor.is_ready = false
	active_actor = null
	manual_command_open = false
	selected_tech_mode = false
	_set_command_buttons_enabled(false)
	tech_list.visible = false
	_cleanup_defeated()
	_check_battle_end()

func _cleanup_defeated() -> void:
	party_actors = party_actors.filter(func(a): return not a.is_defeated)
	enemy_actors = enemy_actors.filter(func(a): return not a.is_defeated)

func _check_battle_end() -> void:
	if enemy_actors.is_empty():
		battle_active = false
		command_label.text = "Victory. Returning to world..."
		match battle_context.get("battle_id", ""):
			"briar_bridegroom":
				GameState.set_flag("briar_bridegroom_defeated", true)
				CodexState.unlock_entry("briar_bridegroom")
				CodexState.unlock_truth("beloved_son_receives_and_gives")
			"garden_encounter_01":
				QuestState.set_objective_text("Speak with the fearful pair and continue toward the Tree.")
				CodexState.unlock_entry("garden_of_first_light")
				CodexState.unlock_entry("false_blossom")
		call_deferred("_return_to_world")
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
		boss_hp_bar.value = enemy_actors[0].current_hp
	boss_phase_label.text = "Phase %d" % boss_phase
	active_lie_label.text = "Active Lie: %s" % (CombatState.active_lie_id if not CombatState.active_lie_id.is_empty() else "--")
	lie_break_bar.max_value = max(CombatState.lie_break_threshold, 1)
	lie_break_bar.value = CombatState.lie_break_progress
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
	var damage := _calculate_basic_damage(active_actor, enemy_actors[0], 1.0)
	enemy_actors[0].take_damage(damage)
	command_label.text = "%s attacks for %d damage." % [active_actor.display_name, damage]
	_finish_turn(active_actor)

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
	CombatState.add_assurance(20)
	command_label.text = "%s prays and steadies the party." % active_actor.display_name
	_finish_turn(active_actor)

func _on_synergy_pressed() -> void:
	if not _can_accept_player_input():
		return
	if active_actor.actor_id != "elior":
		command_label.text = "Only Elior can initiate slice synergy in this build."
		return
	if enemy_actors.is_empty():
		return
	var helper_id := _first_ready_helper_for_elior()
	if helper_id.is_empty():
		command_label.text = "No ally is ready for synergy."
		return

	var damage := 0
	if helper_id == "junia":
		damage = 36
		CombatState.add_assurance(15)
		command_label.text = "Psalm of First Light strikes and heartens the party."
	elif helper_id == "micah":
		damage = 42
		var broke := lie_manager.apply_truth_counter(["beloved", "truth", "witness"], 2)
		if broke:
			CombatState.active_lie_id = ""
			CombatState.lie_break_progress = 0
			CombatState.lie_break_threshold = 0
			CombatState.add_assurance(25)
		command_label.text = "Serpent Breaker tears through deception."

	enemy_actors[0].take_damage(damage)
	_consume_helper(helper_id)
	_finish_turn(active_actor)

func _refresh_tech_buttons() -> void:
	for child in tech_list.get_children():
		child.queue_free()

	tech_list.visible = selected_tech_mode and active_actor != null
	if not tech_list.visible or active_actor == null:
		return

	for ability in _get_actor_techs(active_actor.actor_id):
		var button := Button.new()
		button.text = "%s (SP %d)" % [ability.name, ability.sp_cost]
		button.disabled = active_actor.current_sp < ability.sp_cost
		button.pressed.connect(func(): _use_tech(ability))
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
			var damage := _calculate_basic_damage(active_actor, enemy_actors[0], ability.multiplier)
			enemy_actors[0].take_damage(damage)
			command_label.text = "%s uses %s for %d damage." % [active_actor.display_name, ability.name, damage]
		"release":
			CombatState.add_assurance(15)
			if CombatState.active_lie_id == "if_you_release_you_lose":
				var broke := lie_manager.apply_truth_counter(ability.truth_tags, ability.break_value)
				command_label.text = "%s uses %s to resist the Lie." % [active_actor.display_name, ability.name]
				if broke:
					CombatState.active_lie_id = ""
					CombatState.lie_break_progress = 0
					CombatState.lie_break_threshold = 0
					enemy_actors[0].take_damage(60)
					command_label.text = "%s breaks the Lie and opens the enemy!" % ability.name
		"truth":
			if CombatState.active_lie_id == "if_you_release_you_lose":
				var broke := lie_manager.apply_truth_counter(ability.truth_tags, ability.break_value)
				command_label.text = "%s invokes %s." % [active_actor.display_name, ability.name]
				if broke:
					CombatState.active_lie_id = ""
					CombatState.lie_break_progress = 0
					CombatState.lie_break_threshold = 0
					CombatState.add_assurance(40)
					enemy_actors[0].take_damage(60)
					command_label.text = "%s shatters the Lie." % ability.name
			else:
				command_label.text = "%s steadies the party, but no Lie is active." % ability.name
				CombatState.add_assurance(10)
		"reveal":
			enemy_actors[0].take_damage(_calculate_basic_damage(active_actor, enemy_actors[0], ability.multiplier))
			CombatState.add_assurance(10)
			command_label.text = "%s exposes the false bloom." % ability.name

	_finish_turn(active_actor)

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
