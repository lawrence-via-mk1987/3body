class_name ActorBase
extends Node2D

@export var actor_id: String = ""
@export var display_name: String = "Actor"
@export var max_hp: int = 100
@export var max_sp: int = 20
@export var power: int = 10
@export var guard: int = 10
@export var spirit: int = 10
@export var speed: int = 10
@export var base_atb_rate: float = 35.0

var current_hp: int
var current_sp: int
var atb_value: float = 0.0
var atb_max: float = 100.0
var is_ready: bool = false
var is_defeated: bool = false

func _ready() -> void:
	current_hp = max_hp
	current_sp = max_sp

func get_atb_gain(delta: float) -> float:
	return base_atb_rate * (1.0 + float(speed) / 100.0) * delta

func take_damage(amount: int) -> void:
	current_hp = max(current_hp - amount, 0)
	if current_hp <= 0:
		is_defeated = true

func heal(amount: int) -> void:
	current_hp = min(current_hp + amount, max_hp)

func spend_sp(amount: int) -> bool:
	if current_sp < amount:
		return false
	current_sp -= amount
	return true
