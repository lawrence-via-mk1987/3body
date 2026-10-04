import type { EraKind } from '../orbital/types';

export interface LandmarkProximity {
  pitMeters: number;
  groveMeters: number;
  observatoryMeters: number;
  era: EraKind;
}

/**
 * Distance-weighted procedural cues at pit, grove, and observatory (no samples).
 */
export class LandmarkSpatialAudio {
  private pitGain: GainNode | null = null;
  private groveGain: GainNode | null = null;
  private obsGain: GainNode | null = null;
  private pitOsc: OscillatorNode | null = null;
  private groveOscs: OscillatorNode[] = [];
  private obsTickTimer = 0;

  attach(context: AudioContext, destination: AudioNode): void {
    this.pitGain = context.createGain();
    this.pitGain.gain.value = 0;
    this.pitGain.connect(destination);

    const pitFilter = context.createBiquadFilter();
    pitFilter.type = 'bandpass';
    pitFilter.frequency.value = 180;
    pitFilter.Q.value = 0.7;
    pitFilter.connect(this.pitGain);

    const pitNoise = context.createBufferSource();
    const len = context.sampleRate * 2;
    const buf = context.createBuffer(1, len, context.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.35;
    }
    pitNoise.buffer = buf;
    pitNoise.loop = true;
    pitNoise.connect(pitFilter);
    pitNoise.start();

    this.pitOsc = context.createOscillator();
    this.pitOsc.type = 'sine';
    this.pitOsc.frequency.value = 42;
    const pitOscGain = context.createGain();
    pitOscGain.gain.value = 0.08;
    this.pitOsc.connect(pitOscGain);
    pitOscGain.connect(this.pitGain);
    this.pitOsc.start();

    const groveGain = context.createGain();
    groveGain.gain.value = 0;
    groveGain.connect(destination);
    this.groveGain = groveGain;

    [392, 523.25, 659.25].forEach((freq, i) => {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = context.createGain();
      g.gain.value = i === 0 ? 0.018 : 0.012;
      osc.connect(g);
      g.connect(groveGain);
      osc.start();
      this.groveOscs.push(osc);
    });

    this.obsGain = context.createGain();
    this.obsGain.gain.value = 0;
    this.obsGain.connect(destination);
  }

  update(proximity: LandmarkProximity, delta: number): void {
    if (!this.pitGain || !this.groveGain || !this.obsGain) {
      return;
    }
    const now = performance.now() / 1000;

    const pitW = smoothFalloff(proximity.pitMeters, 90, 18);
    const pitLevel = pitW * (proximity.era === 'stable' ? 0.35 : 0.85);
    this.pitGain.gain.setTargetAtTime(pitLevel * 0.22, now, 0.35);

    const groveW = smoothFalloff(proximity.groveMeters, 70, 12);
    const groveLevel = proximity.era === 'stable' ? groveW * 0.55 : groveW * 0.08;
    this.groveGain.gain.setTargetAtTime(groveLevel * 0.2, now, 0.5);

    const obsW = smoothFalloff(proximity.observatoryMeters, 55, 10);
    this.obsGain.gain.setTargetAtTime(obsW * 0.12, now, 0.4);

    this.obsTickTimer += delta;
    if (obsW > 0.15 && this.obsTickTimer > 2.8 - obsW * 1.2) {
      this.obsTickTimer = 0;
      this.playObservatoryTick(obsW);
    }
  }

  private playObservatoryTick(weight: number): void {
    const gain = this.obsGain;
    if (!gain || !gain.context) {
      return;
    }
    const ctx = gain.context;
    const now = ctx.currentTime;
    const tick = ctx.createGain();
    tick.connect(gain);
    tick.gain.setValueAtTime(0.0001, now);
    tick.gain.exponentialRampToValueAtTime(0.04 * weight, now + 0.02);
    tick.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
    osc.connect(tick);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  dispose(): void {
    this.pitOsc?.stop();
    this.groveOscs.forEach((o) => o.stop());
  }
}

function smoothFalloff(distance: number, max: number, full: number): number {
  if (distance >= max) {
    return 0;
  }
  const t = 1 - (distance - full) / (max - full);
  return Math.max(0, Math.min(1, t));
}
