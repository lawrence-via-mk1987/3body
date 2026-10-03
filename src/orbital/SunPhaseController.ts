import type { EraPhase } from './types';
import type { SunBody } from './SunBody';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function dampedOscillation(time: number, frequency: number, amplitude: number, offset = 0): number {
  return Math.sin(time * frequency + offset) * amplitude;
}

export class SunPhaseController {
  update(
    phase: EraPhase,
    progress: number,
    elapsed: number,
    sunA: SunBody,
    sunB: SunBody,
    sunC: SunBody,
  ): void {
    const t = Math.min(Math.max(progress, 0), 1);

    switch (phase) {
      case 'deep_cold':
        sunA.setLayout(lerp(-1.2, -0.2, t), lerp(-0.35, 0.05, t), 0.8, lerp(0.1, 0.35, t), true);
        sunB.setLayout(2.2, -0.5, 0.7, 0, false);
        sunC.setLayout(-2.4, -0.6, 0.7, 0, false);
        break;

      case 'thaw':
        sunA.setLayout(0.4, lerp(0.05, 0.45, t), 1, lerp(0.45, 0.9, t), true);
        sunB.setLayout(2.8, lerp(-0.2, 0.15, t), 0.9, lerp(0, 0.25, t), t > 0.35);
        sunC.setLayout(-2.5, lerp(-0.08, 0.12, t), 0.75, lerp(0, 0.18, t), t > 0.72);
        break;

      case 'scorch':
        sunA.setLayout(0.8, lerp(0.55, 0.85, t), 1.1, lerp(1, 1.45, t), true);
        sunB.setLayout(-1.4, lerp(0.2, 0.5, t), 1, lerp(0.35, 0.75, t), true);
        sunC.setLayout(2.9, lerp(0.12, 0.38, t), 0.85, lerp(0.25, 0.55, t), true);
        break;

      case 'binary_chaos': {
        const swing = dampedOscillation(elapsed, 0.9, 0.8, sunA.phaseOffset);
        sunA.setLayout(0.5 + swing, 0.55, 1.05, 1.2, true);
        sunB.setLayout(-0.5 - swing, 0.5, 1, 1.05, true);
        sunC.setLayout(2.6, lerp(0.18, 0.42, t), 0.9, lerp(0.3, 0.65, t), true);
        break;
      }

      case 'tri_solar':
        sunA.setLayout(-1.35, lerp(0.48, 0.72, t), 1.2, lerp(1.2, 1.85, t), true);
        sunB.setLayout(0.15, lerp(0.5, 0.74, t), 1.15, lerp(1.1, 1.75, t), true);
        sunC.setLayout(1.65, lerp(0.46, 0.7, t), 1.25, lerp(1.15, 1.8, t), true);
        break;

      case 'flying_star': {
        const approach = Math.min(t * 1.15, 1);
        sunA.setLayout(2.5, 0.22, 0.65, 0.22, approach < 0.55);
        sunB.setLayout(-2.35, 0.18, 0.65, 0.18, approach < 0.55);
        sunC.setLayout(
          lerp(-0.35, 0.05, approach),
          lerp(0.05, 0.22, approach),
          lerp(1.8, 3.4, approach),
          lerp(1.6, 2.9, approach),
          true,
        );
        break;
      }

      case 'eclipse_relief':
        sunA.setLayout(0.2, 0.35, 0.9, 0.2, true);
        sunB.setLayout(1.8, 0.3, 0.85, 0.15, true);
        sunC.setLayout(-1.6, 0.28, 0.8, 0.1, true);
        break;

      case 'stable_golden':
        sunA.setLayout(lerp(-0.5, 0.5, t), lerp(0.35, 0.55, t), 1, 0.85, true);
        sunB.setLayout(2.4, -0.15, 0.75, 0, false);
        sunC.setLayout(-2.2, -0.2, 0.75, 0, false);
        break;

      default:
        break;
    }
  }
}
