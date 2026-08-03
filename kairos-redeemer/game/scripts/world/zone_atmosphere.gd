extends Node2D

enum ZoneKind { THRESHOLD, GARDEN }

@export var zone_kind: ZoneKind = ZoneKind.THRESHOLD
@export var star_count: int = 42

@onready var _vignette_top: ColorRect = $VignetteTop
@onready var _vignette_bottom: ColorRect = $VignetteBottom
@onready var _sky_band: ColorRect = $SkyBand
@onready var _stars_root: Node2D = $StarsRoot

func _ready() -> void:
	if zone_kind == ZoneKind.THRESHOLD:
		_spawn_stars()
		_apply_threshold_palette(false, false)
	else:
		_stars_root.visible = false
		_apply_garden_palette(false, false, false)

func apply_mood(
	keeper_or_battle_ready: bool = false,
	love_restored: bool = false,
	grove_active: bool = false
) -> void:
	if zone_kind == ZoneKind.THRESHOLD:
		_apply_threshold_palette(keeper_or_battle_ready, love_restored)
	else:
		_apply_garden_palette(keeper_or_battle_ready, love_restored, grove_active)

func _spawn_stars() -> void:
	if _stars_root == null:
		return
	_stars_root.visible = true
	for child in _stars_root.get_children():
		child.queue_free()

	var rng := RandomNumberGenerator.new()
	rng.seed = 91827
	for i in star_count:
		var star := ColorRect.new()
		var size := rng.randf_range(2.0, 5.0)
		star.size = Vector2(size, size)
		star.position = Vector2(rng.randf_range(-80.0, 1180.0), rng.randf_range(-70.0, 260.0))
		var brightness := rng.randf_range(0.55, 1.0)
		star.color = Color(0.82 + brightness * 0.18, 0.88 + brightness * 0.12, 1.0, rng.randf_range(0.35, 0.9))
		_stars_root.add_child(star)

func _apply_threshold_palette(gate_ready: bool, love_restored: bool) -> void:
	if _sky_band != null:
		_sky_band.color = Color(0.08, 0.12, 0.22, 0.55) if not love_restored else Color(0.14, 0.2, 0.34, 0.45)
	if _vignette_top != null:
		_vignette_top.color = Color(0.02, 0.04, 0.08, 0.35) if not gate_ready else Color(0.04, 0.06, 0.1, 0.28)
	if _vignette_bottom != null:
		_vignette_bottom.color = Color(0.04, 0.06, 0.1, 0.42)
	if _stars_root != null:
		_stars_root.modulate = Color(1.15, 1.2, 1.35, 1.0) if love_restored else Color(1.0, 1.05, 1.15, 1.0)

func _apply_garden_palette(battle_complete: bool, love_restored: bool, grove_active: bool) -> void:
	if _sky_band != null:
		if love_restored:
			_sky_band.color = Color(0.95, 0.82, 0.55, 0.38)
		elif battle_complete:
			_sky_band.color = Color(0.78, 0.88, 0.62, 0.32)
		else:
			_sky_band.color = Color(0.62, 0.78, 0.52, 0.28)
	if _vignette_top != null:
		_vignette_top.color = Color(0.12, 0.22, 0.14, 0.22) if grove_active else Color(0.1, 0.18, 0.12, 0.26)
	if _vignette_bottom != null:
		_vignette_bottom.color = Color(0.08, 0.14, 0.1, 0.3)
