import type { EraKind, EraPhase } from '../orbital/types';
import { masterGainFromSlider } from './audioGain';

type AudioLayer = {
  gain: GainNode;
  cleanup?: () => void;
};

export interface AudioDirectorOptions {
  /** Slow chaos arpeggio on desktop; phones keep pads only. */
  musicArpeggio: boolean;
}

export class AudioDirector {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private windLayer: AudioLayer | null = null;
  private solarLayer: AudioLayer | null = null;
  private stableLayer: AudioLayer | null = null;
  private menuMusic: AudioLayer | null = null;
  private chaosMusic: AudioLayer | null = null;
  private stableMusic: AudioLayer | null = null;
  private started = false;
  private masterVolume = 0.78;
  private musicEnabled = true;
  private menuActive = false;
  private duckMultiplier = 1;
  private musicArpeggio = true;
  private lastEra: EraKind = 'chaotic';

  configure(options: AudioDirectorOptions): void {
    this.musicArpeggio = options.musicArpeggio;
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    this.applyMusicLevels(this.lastEra, 'thaw', 0);
  }

  setMenuMusicActive(active: boolean): void {
    this.menuActive = active;
    this.applyMusicLevels(this.lastEra, 'thaw', 0);
  }

  /** Lower music under voice-over and cutscenes. */
  setMusicDuck(duck: boolean): void {
    this.duckMultiplier = duck ? 0.22 : 1;
    if (!this.musicBus || !this.context) {
      return;
    }
    const target = this.musicEnabled ? this.duckMultiplier : 0;
    this.musicBus.gain.setTargetAtTime(target, this.context.currentTime, 0.35);
  }

  async start(initialVolume = 0.78): Promise<void> {
    this.masterVolume = initialVolume;
    if (this.started && this.context) {
      return;
    }

    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = masterGainFromSlider(initialVolume);
    this.masterGain.connect(this.context.destination);

    this.musicBus = this.context.createGain();
    this.musicBus.gain.value = 1;
    this.musicBus.connect(this.masterGain!);

    this.windLayer = this.createWindLayer();
    this.solarLayer = this.createSolarLayer();
    this.stableLayer = this.createStableLayer();
    this.menuMusic = this.createMenuMusic();
    this.chaosMusic = this.createChaosMusic();
    this.stableMusic = this.createStableMusic();

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    this.started = true;
  }

  async unlockFromGesture(initialVolume = 0.78): Promise<boolean> {
    await this.start(initialVolume);
    if (!this.context || !this.masterGain) {
      return false;
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    this.masterGain.gain.setTargetAtTime(
      masterGainFromSlider(this.masterVolume),
      this.context.currentTime,
      0.05,
    );
    return this.context.state === 'running';
  }

  isContextRunning(): boolean {
    return Boolean(this.started && this.context && this.context.state === 'running');
  }

  stop(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    this.masterGain.gain.setTargetAtTime(0, this.context.currentTime, 0.4);
    this.setMenuMusicActive(false);
  }

  resume(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    this.masterGain.gain.setTargetAtTime(
      masterGainFromSlider(this.masterVolume),
      this.context.currentTime,
      0.6,
    );
    void this.context.resume();
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = volume;
    if (!this.context || !this.masterGain) {
      return;
    }
    this.masterGain.gain.setTargetAtTime(
      masterGainFromSlider(volume),
      this.context.currentTime,
      0.08,
    );
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  update(era: EraKind, phase: EraPhase, temperature: number): void {
    if (!this.started || !this.context || !this.windLayer || !this.solarLayer || !this.stableLayer) {
      return;
    }

    const now = this.context.currentTime;
    const isStable = era === 'stable';
    const isDangerous = phase === 'tri_solar' || phase === 'flying_star' || phase === 'scorch';
    const isCold = phase === 'deep_cold' || phase === 'eclipse_relief';

    const windLevel = isCold ? 0.38 : isDangerous ? 0.18 : 0.24;
    const solarLevel = isDangerous ? 0.52 : isStable ? 0.12 : 0.24 + Math.max(temperature, 0) * 0.06;
    const stableLevel = isStable ? 0.42 : 0;

    this.windLayer.gain.gain.setTargetAtTime(windLevel, now, 0.8);
    this.solarLayer.gain.gain.setTargetAtTime(solarLevel, now, 0.8);
    this.stableLayer.gain.gain.setTargetAtTime(stableLevel, now, 1.2);

    this.lastEra = era;
    this.applyMusicLevels(era, phase, temperature);
  }

  playStableEraChime(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime;
    const chimeGain = this.context.createGain();
    chimeGain.connect(this.masterGain);
    chimeGain.gain.setValueAtTime(0.0001, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.18, now + 0.08);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

    [220, 277.18, 329.63].forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(chimeGain);
      oscillator.start(now + index * 0.04);
      oscillator.stop(now + 2.8);
    });
  }

  setCinematicBed(active: boolean): void {
    if (!this.context || !this.stableLayer || !this.windLayer) {
      return;
    }
    const now = this.context.currentTime;
    const stableTarget = active ? 0.2 : 0;
    const windTarget = active ? 0.08 : 0.14;
    this.stableLayer.gain.gain.setTargetAtTime(stableTarget, now, 0.5);
    this.windLayer.gain.gain.setTargetAtTime(windTarget, now, 0.5);
    this.setMusicDuck(active);
  }

  playLogDiscover(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime;
    const gain = this.context.createGain();
    gain.connect(this.masterGain);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    const oscillator = this.context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.2);
    oscillator.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + 0.35);
  }

  dispose(): void {
    this.windLayer?.cleanup?.();
    this.solarLayer?.cleanup?.();
    this.stableLayer?.cleanup?.();
    this.menuMusic?.cleanup?.();
    this.chaosMusic?.cleanup?.();
    this.stableMusic?.cleanup?.();
    void this.context?.close();
    this.context = null;
    this.started = false;
  }

  private applyMusicLevels(era: EraKind, phase: EraPhase, temperature: number): void {
    if (!this.context || !this.menuMusic || !this.chaosMusic || !this.stableMusic || !this.musicBus) {
      return;
    }

    const now = this.context.currentTime;
    if (!this.musicEnabled) {
      this.menuMusic.gain.gain.setTargetAtTime(0, now, 0.5);
      this.chaosMusic.gain.gain.setTargetAtTime(0, now, 0.5);
      this.stableMusic.gain.gain.setTargetAtTime(0, now, 0.5);
      this.musicBus.gain.setTargetAtTime(0, now, 0.4);
      return;
    }

    this.musicBus.gain.setTargetAtTime(this.duckMultiplier, now, 0.35);

    if (this.menuActive) {
      this.menuMusic.gain.gain.setTargetAtTime(0.22, now, 1.2);
      this.chaosMusic.gain.gain.setTargetAtTime(0, now, 0.8);
      this.stableMusic.gain.gain.setTargetAtTime(0, now, 0.8);
      return;
    }

    this.menuMusic.gain.gain.setTargetAtTime(0, now, 0.8);

    const isStable = era === 'stable';
    const isDangerous = phase === 'tri_solar' || phase === 'flying_star' || phase === 'scorch';
    const heatBoost = Math.min(Math.max(temperature, 0) * 0.02, 0.06);

    if (isStable) {
      this.chaosMusic.gain.gain.setTargetAtTime(0, now, 1.4);
      this.stableMusic.gain.gain.setTargetAtTime(0.24, now, 1.6);
    } else {
      const chaosLevel = (this.musicArpeggio ? 0.17 : 0.1) + (isDangerous ? 0.08 : 0) + heatBoost;
      this.chaosMusic.gain.gain.setTargetAtTime(chaosLevel, now, 1.1);
      this.stableMusic.gain.gain.setTargetAtTime(0, now, 0.9);
    }
  }

  private createWindLayer(): AudioLayer {
    const context = this.context!;
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(this.masterGain!);

    const bufferSize = context.sampleRate * 2;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.45;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;

    source.connect(filter);
    filter.connect(gain);
    source.start();

    return { gain, cleanup: () => source.stop() };
  }

  private createSolarLayer(): AudioLayer {
    const context = this.context!;
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(this.masterGain!);

    const oscillators: OscillatorNode[] = [];
    [55, 82.5, 110].forEach((frequency) => {
      const oscillator = context.createOscillator();
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = frequency;
      const partialGain = context.createGain();
      partialGain.gain.value = 0.04;
      oscillator.connect(partialGain);
      partialGain.connect(gain);
      oscillator.start();
      oscillators.push(oscillator);
    });

    const lfo = context.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 12;
    lfo.connect(lfoGain);
    lfoGain.connect(oscillators[0].frequency);
    lfo.start();

    return {
      gain,
      cleanup: () => {
        oscillators.forEach((oscillator) => oscillator.stop());
        lfo.stop();
      },
    };
  }

  private createStableLayer(): AudioLayer {
    const context = this.context!;
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(this.masterGain!);

    const oscillators: OscillatorNode[] = [];
    [130.81, 164.81, 196.0, 246.94].forEach((frequency) => {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      const partialGain = context.createGain();
      partialGain.gain.value = 0.03;
      oscillator.connect(partialGain);
      partialGain.connect(gain);
      oscillator.start();
      oscillators.push(oscillator);
    });

    return {
      gain,
      cleanup: () => oscillators.forEach((oscillator) => oscillator.stop()),
    };
  }

  private createMenuMusic(): AudioLayer {
    const context = this.context!;
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(this.musicBus!);

    const oscillators: OscillatorNode[] = [];
    [130.81, 164.81, 196.0].forEach((frequency) => {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      const partial = context.createGain();
      partial.gain.value = 0.018;
      oscillator.connect(partial);
      partial.connect(gain);
      oscillator.start();
      oscillators.push(oscillator);
    });

    const lfo = context.createOscillator();
    lfo.frequency.value = 0.04;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    return {
      gain,
      cleanup: () => {
        oscillators.forEach((o) => o.stop());
        lfo.stop();
      },
    };
  }

  private createChaosMusic(): AudioLayer {
    const context = this.context!;
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(this.musicBus!);

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 280;
    filter.connect(gain);

    const oscillators: OscillatorNode[] = [];
    [48, 50.8, 72].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 2 && this.musicArpeggio ? 'triangle' : 'sawtooth';
      oscillator.frequency.value = frequency;
      const partial = context.createGain();
      partial.gain.value = index === 2 ? 0.025 : 0.035;
      oscillator.connect(partial);
      partial.connect(filter);
      oscillator.start();
      oscillators.push(oscillator);
    });

    if (this.musicArpeggio) {
      const lfo = context.createOscillator();
      lfo.frequency.value = 0.11;
      const lfoGain = context.createGain();
      lfoGain.gain.value = 8;
      lfo.connect(lfoGain);
      lfoGain.connect(oscillators[2]!.frequency);
      lfo.start();
      oscillators.push(lfo);
    }

    return {
      gain,
      cleanup: () => oscillators.forEach((o) => o.stop()),
    };
  }

  private createStableMusic(): AudioLayer {
    const context = this.context!;
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(this.musicBus!);

    const oscillators: OscillatorNode[] = [];
    [174.61, 220, 261.63].forEach((frequency) => {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      const partial = context.createGain();
      partial.gain.value = 0.022;
      oscillator.connect(partial);
      partial.connect(gain);
      oscillator.start();
      oscillators.push(oscillator);
    });

    const swell = context.createOscillator();
    swell.frequency.value = 0.06;
    const swellGain = context.createGain();
    swellGain.gain.value = 0.015;
    swell.connect(swellGain);
    swellGain.connect(gain.gain);
    swell.start();

    return {
      gain,
      cleanup: () => {
        oscillators.forEach((o) => o.stop());
        swell.stop();
      },
    };
  }
}
