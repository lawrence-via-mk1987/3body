extends Node

@export_file("*.ogg") var stream_path: String = ""
@export var volume_db: float = -14.0
@export var autoplay: bool = true

var _player: AudioStreamPlayer

func _ready() -> void:
	_player = AudioStreamPlayer.new()
	_player.name = "AmbiencePlayer"
	_player.volume_db = volume_db
	add_child(_player)

	if stream_path.is_empty():
		return

	var stream: AudioStream = load(stream_path)
	if stream == null:
		push_warning("Zone ambience missing stream: %s" % stream_path)
		return

	if stream is AudioStreamOggVorbis:
		stream.loop = true
	elif stream is AudioStreamWAV:
		stream.loop_mode = AudioStreamWAV.LOOP_FORWARD

	_player.stream = stream
	if autoplay:
		_player.play()

func set_volume_db(value: float) -> void:
	volume_db = value
	if _player != null:
		_player.volume_db = value

func fade_to(value: float, duration: float = 1.0) -> void:
	if _player == null:
		return
	var tween := create_tween()
	tween.tween_property(_player, "volume_db", value, duration)
