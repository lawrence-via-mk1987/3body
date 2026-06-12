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
        sunC.setLayout(-1.8, -0.25, 0.8, 0, false);
        break;

      case 'scorch':
        sunA.setLayout(0.8, lerp(0.55, 0.85, t), 1.1, lerp(1, 1.45, t), true);
        sunB.setLayout(-1.4, lerp(0.2, 0.5, t), 1, lerp(0.35, 0.75, t), true);
        sunC.setLayout(2.6, 0.1, 0.8, 0.15, false);
        break;

      case 'binary_chaos': {
        const swing = dampedOscillation(elapsed, 0.9, 0.8, sunA.phaseOffset);
        sunA.setLayout(0.5 + swing, 0.55, 1.05, 1.2, true);
        sunB.setLayout(-0.5 - swing, 0.5, 1, 1.05, true);
        sunC.setLayout(2.2, -0.1, 0.8, 0, false);
        break;
      }

      case 'tri_solar':
        sunA.setLayout(-0.8, lerp(0.45, 0.7, t), 1.2, lerp(1.2, 1.8, t), true);
        sunB.setLayout(1.4, lerp(0.42, 0.68, t), 1.15, lerp(1.1, 1.7, t), true);
        sunC.setLayout(2.8, lerp(0.4, 0.66, t), 1.25, lerp(1.15, 1.75, t), true);
        break;

      case 'flying_star':
        sunA.setLayout(2.4, 0.2, 0.7, 0.2, t < 0.4);
        sunB.setLayout(-2.2, 0.15, 0.7, 0.15, t < 0.4);
        sunC.setLayout(
          lerp(-0.3, 0.2, t),
          lerp(0.04, 0.14, t),
          lerp(2.2, 3.2, t),
          lerp(1.8, 2.8, t),
          true,
        );
        break;

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
