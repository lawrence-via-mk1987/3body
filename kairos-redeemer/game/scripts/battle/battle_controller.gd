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
@onready var command_label: Label = $"../UILayer/CommandMenu/CommandLabel"

var battle_context: Dictionary = {}
var party_actors: Array[ActorBase] = []
var enemy_actors: Array[ActorBase] = []
var active_actor: ActorBase
var ready_queue: Array[ActorBase] = []
var lie_manager: Node
var battle_active: bool = false
var boss_phase: int = 1

func _ready() -> void:
	lie_manager = preload("res://scripts/battle/lie_manager.gd").new()
	add_child(lie_manager)
	battle_context = SceneRouter.battle_context
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
			_process_player_turn(active_actor)
		else:
			_process_enemy_turn(active_actor)

	_update_ui()

func _start_battle() -> void:
	CombatState.reset_battle_state()
	_spawn_party()
	_spawn_enemies()
	battle_active = true
	command_label.text = "Placeholder battle shell: auto-resolving turns."

func _spawn_party() -> void:
	var actors = [
		{"id": "elior", "name": "Elior", "position": Vector2(160, 340), "color": Color(0.85, 0.75, 0.45)},
		{"id": "junia", "name": "Junia", "position": Vector2(160, 420), "color": Color(0.95, 0.62, 0.47)},
		{"id": "micah", "name": "Micah", "position": Vector2(160, 500), "color": Color(0.35, 0.45, 0.7)}
	]

	for actor_data in actors:
		var actor: ActorBase = PLAYER_SCENE.instantiate()
		actor.actor_id = actor_data.id
		actor.display_name = actor_data.name
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

func _process_player_turn(actor: ActorBase) -> void:
	if enemy_actors.is_empty():
		return

	if CombatState.active_lie_id == "if_you_release_you_lose" and actor.actor_id == "elior":
		var broke = lie_manager.apply_truth_counter(["beloved", "truth"], 2)
		if broke:
			CombatState.active_lie_id = ""
			CombatState.lie_break_progress = 0
			CombatState.lie_break_threshold = 0
			CombatState.add_assurance(40)
			if not enemy_actors.is_empty():
				enemy_actors[0].take_damage(60)
	else:
		enemy_actors[0].take_damage(18)

	_finish_turn(actor)

func _process_enemy_turn(actor: ActorBase) -> void:
	var action := actor.call("choose_action", battle_context, CombatState)
	match action.get("type", "attack"):
		"apply_lie":
			lie_manager.apply_lie(action.get("lie_id", "if_you_release_you_lose"))
			CombatState.reduce_assurance(20)
		"attack":
			if not party_actors.is_empty():
				party_actors[0].take_damage(10)

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
	_cleanup_defeated()
	_check_battle_end()

func _cleanup_defeated() -> void:
	party_actors = party_actors.filter(func(a): return not a.is_defeated)
	enemy_actors = enemy_actors.filter(func(a): return not a.is_defeated)

func _check_battle_end() -> void:
	if enemy_actors.is_empty():
		battle_active = false
		command_label.text = "Victory. Returning to world..."
		if battle_context.get("battle_id", "") == "briar_bridegroom":
			GameState.set_flag("briar_bridegroom_defeated", true)
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
		status_labels[i].text = "%s HP %d SP %d" % [actor.display_name, actor.current_hp, actor.current_sp]
