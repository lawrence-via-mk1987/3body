import type { EraKind, EraPhase } from '../orbital/types';

type AudioLayer = {
  gain: GainNode;
  cleanup?: () => void;
};

export class AudioDirector {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private windLayer: AudioLayer | null = null;
  private solarLayer: AudioLayer | null = null;
  private stableLayer: AudioLayer | null = null;
  private started = false;

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.55;
    this.masterGain.connect(this.context.destination);

    this.windLayer = this.createWindLayer();
    this.solarLayer = this.createSolarLayer();
    this.stableLayer = this.createStableLayer();

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    this.started = true;
  }

  stop(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    this.masterGain.gain.setTargetAtTime(0, this.context.currentTime, 0.4);
  }

  resume(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    this.masterGain.gain.setTargetAtTime(0.55, this.context.currentTime, 0.6);
    void this.context.resume();
  }

  update(era: EraKind, phase: EraPhase, temperature: number): void {
    if (!this.started || !this.context || !this.windLayer || !this.solarLayer || !this.stableLayer) {
      return;
    }

    const now = this.context.currentTime;
    const isStable = era === 'stable';
    const isDangerous = phase === 'tri_solar' || phase === 'flying_star' || phase === 'scorch';
    const isCold = phase === 'deep_cold' || phase === 'eclipse_relief';

    const windLevel = isCold ? 0.22 : isDangerous ? 0.1 : 0.14;
    const solarLevel = isDangerous ? 0.34 : isStable ? 0.06 : 0.14 + Math.max(temperature, 0) * 0.04;
    const stableLevel = isStable ? 0.28 : 0;

    this.windLayer.gain.gain.setTargetAtTime(windLevel, now, 0.8);
    this.solarLayer.gain.gain.setTargetAtTime(solarLevel, now, 0.8);
    this.stableLayer.gain.gain.setTargetAtTime(stableLevel, now, 1.2);
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
    void this.context?.close();
    this.context = null;
    this.started = false;
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
}
