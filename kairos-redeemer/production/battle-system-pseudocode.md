# Kairos Redeemer - Battle System Pseudocode

## Purpose

This document gives implementation-level pseudocode for the vertical slice battle system in Godot.

The focus is on:

- ATB turn flow
- actions
- Assurance
- Lies
- Truth counters
- victory / defeat

---

## 1. Battle Start Flow

```text
load battle scene
spawn party actors
spawn enemy actors
load battle context
reset CombatState
initialize Assurance
initialize battle UI
begin update loop
```

Pseudocode:

```gdscript
func start_battle(battle_context: Dictionary) -> void:
    CombatState.reset_battle_state()
    current_battle_context = battle_context
    spawn_party()
    spawn_enemies()
    assurance_points = battle_context.get("starting_assurance", 200)
    battle_active = true
```

---

## 2. ATB Update Loop

Each living actor fills a readiness meter over time.

```gdscript
func _process(delta: float) -> void:
    if not battle_active:
        return

    for actor in all_actors:
        if actor.is_defeated:
            continue
        actor.atb_value += actor.get_atb_gain(delta)
        if actor.atb_value >= actor.atb_max and not actor.is_ready:
            actor.is_ready = true
            queue_ready_actor(actor)
```

Suggested actor-side helper:

```gdscript
func get_atb_gain(delta: float) -> float:
    return base_atb_rate * (1.0 + speed_stat / 100.0) * delta
```

---

## 3. Turn Selection Logic

```gdscript
func process_turn_queue() -> void:
    if active_actor != null:
        return

    if ready_queue.is_empty():
        return

    active_actor = ready_queue.pop_front()

    if active_actor.is_player_controlled:
        ui_open_command_menu(active_actor)
    else:
        enemy_take_turn(active_actor)
```

---

## 4. Player Command Flow

```gdscript
func on_player_command_selected(command_id: String, payload: Dictionary) -> void:
    match command_id:
        "attack":
            resolve_attack(active_actor, payload.target)
        "tech":
            resolve_tech(active_actor, payload.ability_id, payload.target)
        "defend":
            resolve_defend(active_actor)
        "pray":
            resolve_pray(active_actor)
        "item":
            resolve_item(active_actor, payload.item_id, payload.target)
        "synergy":
            resolve_synergy(payload.synergy_id, payload.targets)
```

At the end:

```gdscript
func finish_active_turn() -> void:
    active_actor.atb_value = 0.0
    active_actor.is_ready = false
    active_actor = null
    check_battle_end()
```

---

## 5. Attack Resolution

```gdscript
func resolve_attack(user: ActorBase, target: ActorBase) -> void:
    var damage = CombatMath.calculate_physical_damage(user, target, 1.0)
    target.take_damage(damage)
    finish_active_turn()
```

---

## 6. Tech Resolution

```gdscript
func resolve_tech(user: ActorBase, ability_id: String, target: ActorBase) -> void:
    var ability = AbilityDB.get_ability(ability_id)

    if user.current_sp < ability.sp_cost:
        ui_show_error("Not enough SP")
        return

    user.current_sp -= ability.sp_cost

    match ability.formula_type:
        "physical":
            var damage = CombatMath.calculate_physical_damage(user, target, ability.base_power)
            target.take_damage(damage)
        "tech":
            var damage = CombatMath.calculate_tech_damage(user, target, ability.base_power)
            target.take_damage(damage)
        "heal":
            var healing = CombatMath.calculate_heal(user, ability.base_power)
            target.heal(healing)
        "lie_break":
            apply_truth_counter(ability.truth_tags, ability.get("lie_counter_value", 1))

    if ability.status_apply != "":
        try_apply_status(user, target, ability)

    finish_active_turn()
```

---

## 7. Defend Resolution

```gdscript
func resolve_defend(user: ActorBase) -> void:
    user.add_temporary_state("defending", 1)
    finish_active_turn()
```

---

## 8. Pray Resolution

```gdscript
func resolve_pray(user: ActorBase) -> void:
    CombatState.add_assurance(20)
    user.cleanse_minor_spiritual_pressure()
    ui_show_float_text(user, "Prayer")
    finish_active_turn()
```

Later, Prayer can also:
- interact with sacred nodes
- add truth pressure to certain Lies

---

## 9. Synergy Resolution

```gdscript
func resolve_synergy(synergy_id: String, targets: Array) -> void:
    var synergy = SynergyDB.get_synergy(synergy_id)
    var participants = get_synergy_participants(synergy_id)

    for actor in participants:
        actor.current_sp -= synergy.sp_cost_per_actor
        actor.atb_value = 0.0
        actor.is_ready = false

    if synergy.assurance_cost > 0:
        CombatState.reduce_assurance(synergy.assurance_cost)

    apply_synergy_effect(synergy, targets)

    active_actor = null
    check_battle_end()
```

---

## 10. Assurance Logic

```gdscript
func add_assurance(amount: int) -> void:
    assurance_points = clamp(assurance_points + amount, 0, assurance_max_points)
    ui_update_assurance(assurance_points)

func reduce_assurance(amount: int) -> void:
    assurance_points = clamp(assurance_points - amount, 0, assurance_max_points)
    ui_update_assurance(assurance_points)
```

Recommended:

- `assurance_max_points = 500`
- 100 points = 1 visible segment

---

## 11. Lie Application Logic

```gdscript
func apply_lie(lie_id: String) -> void:
    var lie = LieDB.get_lie(lie_id)
    CombatState.active_lie_id = lie_id
    CombatState.lie_break_progress = 0
    CombatState.lie_break_threshold = lie.break_threshold
    ui_show_lie_banner(lie.display_name)
    apply_lie_effects_to_party(lie)
```

---

## 12. Truth Counter Logic

```gdscript
func apply_truth_counter(truth_tags: Array[String], base_value: int) -> void:
    if CombatState.active_lie_id == "":
        return

    var lie = LieDB.get_lie(CombatState.active_lie_id)
    var break_gain = 0

    for tag in truth_tags:
        if tag in lie.counter_tags:
            break_gain += 1

    break_gain += base_value - 1

    if CombatState.assurance_points >= 400:
        break_gain += 1

    CombatState.lie_break_progress += break_gain
    ui_update_lie_break_meter(CombatState.lie_break_progress, CombatState.lie_break_threshold)

    if CombatState.lie_break_progress >= CombatState.lie_break_threshold:
        break_lie()
```

---

## 13. Lie Break Logic

```gdscript
func break_lie() -> void:
    var lie = LieDB.get_lie(CombatState.active_lie_id)
    remove_lie_effects_from_party(lie)
    trigger_lie_break_backlash(lie)
    ui_play_truth_break_effect()
    CombatState.active_lie_id = ""
    CombatState.lie_break_progress = 0
```

For Briar Bridegroom, backlash should:
- remove shield
- stagger boss briefly
- brighten arena

---

## 14. Enemy Turn Logic

```gdscript
func enemy_take_turn(enemy: ActorBase) -> void:
    var action = enemy.choose_action(current_battle_context, CombatState)
    resolve_enemy_action(enemy, action)
```

For slice enemies, use simple AI:

- target weakest
- use bind when available
- False Blossom prioritizes deception buff
- Briar phase logic is state-driven

---

## 15. Boss Phase Logic

```gdscript
func update_briar_phase() -> void:
    var hp_ratio = briar.current_hp / briar.max_hp

    if briar.current_phase == 1 and hp_ratio <= 0.70:
        transition_to_phase_2()
    elif briar.current_phase == 2 and (hp_ratio <= 0.35 or phase_2_lie_broken):
        transition_to_phase_3()
```

---

## 16. Battle End Checks

```gdscript
func check_battle_end() -> void:
    if all_enemies_defeated():
        battle_victory()
        return

    if all_party_defeated():
        battle_defeat()
        return
```

---

## 17. Save-Safe Design Rule

Do not allow saving during active battle in the first slice.

Allow save:
- before entering Garden
- at Threshold
- before boss arena if desired
- after boss

---

## 18. Vertical Slice Combat Scope Limit

Only implement these fully for the first pass:

- 3 party actors
- 4 field enemies
- 1 boss
- 1 active Lie
- 2 Synergy Techs
- 5-7 statuses max

Anything beyond that belongs to later production.
