import { ORBITAL_CONFIG } from './config';
import type { EraKind, EraPhase } from './types';
import { CHAOTIC_PHASES } from './types';

const PHASE_DURATIONS: Record<EraPhase, [number, number]> = {
  deep_cold: [30, 90],
  thaw: [20, 40],
  scorch: [30, 60],
  binary_chaos: [20, 50],
  tri_solar: [10, 25],
  flying_star: [8, 15],
  eclipse_relief: [5, 15],
  stable_golden: [ORBITAL_CONFIG.stableEraDurationSec, ORBITAL_CONFIG.stableEraDurationSec],
};

const TRANSITION_WEIGHTS: Record<EraPhase, Partial<Record<EraPhase, number>>> = {
  deep_cold: { thaw: 4, eclipse_relief: 1 },
  thaw: { scorch: 4, deep_cold: 1, binary_chaos: 1 },
  scorch: { binary_chaos: 3, thaw: 2, tri_solar: 1 },
  binary_chaos: { scorch: 2, tri_solar: 2, eclipse_relief: 2, thaw: 1 },
  tri_solar: { scorch: 3, binary_chaos: 2, eclipse_relief: 2 },
  flying_star: { scorch: 2, eclipse_relief: 3, deep_cold: 1 },
  eclipse_relief: { thaw: 3, deep_cold: 2, scorch: 1 },
  stable_golden: { deep_cold: 1, scorch: 1 },
};

const DANGEROUS_PHASES: EraPhase[] = ['tri_solar', 'flying_star'];

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickWeighted(options: Array<{ phase: EraPhase; weight: number }>): EraPhase {
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  let roll = Math.random() * total;

  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) {
      return option.phase;
    }
  }

  return options[options.length - 1].phase;
}

export interface StableEraRoll {
  chance: number;
  force: boolean;
}

export class EraStateMachine {
  era: EraKind = 'chaotic';
  phase: EraPhase = ORBITAL_CONFIG.startPhase;
  elapsedInPhase = 0;
  phaseDuration = 45;
  private dangerousCooldown = 0;

  constructor(
    private readonly getStableRoll: () => StableEraRoll = () => ({ chance: ORBITAL_CONFIG.stableEraChance, force: false }),
    private readonly onChaoticPhaseEnded?: () => void,
    private readonly onStableEntered?: () => void,
  ) {
    this.phaseDuration = this.rollDuration(ORBITAL_CONFIG.startPhase);
    this.elapsedInPhase = this.phaseDuration * ORBITAL_CONFIG.startPhaseProgress;
  }

  update(delta: number): boolean {
    this.elapsedInPhase += delta;
    if (this.dangerousCooldown > 0) {
      this.dangerousCooldown -= delta;
    }

    if (this.elapsedInPhase < this.phaseDuration) {
      return false;
    }

    this.transition();
    return true;
  }

  getPhaseProgress(): number {
    return Math.min(this.elapsedInPhase / this.phaseDuration, 1);
  }

  private transition(): void {
    if (this.era === 'stable') {
      this.enterChaotic('deep_cold');
      return;
    }

    this.onChaoticPhaseEnded?.();

    const roll = this.getStableRoll();
    if (roll.force || Math.random() < roll.chance) {
      this.enterStable();
      this.onStableEntered?.();
      return;
    }

    const nextPhase = this.pickNextChaoticPhase();
    this.enterPhase(nextPhase);
  }

  private pickNextChaoticPhase(): EraPhase {
    const weights = TRANSITION_WEIGHTS[this.phase];
    const options = Object.entries(weights)
      .map(([phase, weight]) => ({ phase: phase as EraPhase, weight: weight ?? 0 }))
      .filter((option) => option.weight > 0)
      .filter((option) => this.dangerousCooldown <= 0 || !DANGEROUS_PHASES.includes(option.phase));

    if (options.length === 0) {
      return CHAOTIC_PHASES[Math.floor(Math.random() * CHAOTIC_PHASES.length)];
    }

    return pickWeighted(options);
  }

  private enterStable(): void {
    this.era = 'stable';
    this.enterPhase('stable_golden');
  }

  private enterChaotic(phase: EraPhase): void {
    this.era = 'chaotic';
    this.enterPhase(phase);
  }

  private enterPhase(phase: EraPhase): void {
    if (DANGEROUS_PHASES.includes(phase)) {
      this.dangerousCooldown = 35;
    }

    this.phase = phase;
    this.elapsedInPhase = 0;
    this.phaseDuration = this.rollDuration(phase);
  }

  private rollDuration(phase: EraPhase): number {
    const [min, max] = PHASE_DURATIONS[phase];
    return randomBetween(min, max);
  }

  reset(): void {
    this.era = 'chaotic';
    this.phase = ORBITAL_CONFIG.startPhase;
    this.phaseDuration = this.rollDuration(ORBITAL_CONFIG.startPhase);
    this.elapsedInPhase = this.phaseDuration * ORBITAL_CONFIG.startPhaseProgress;
    this.dangerousCooldown = 0;
  }

  getSnapshot(): {
    era: EraKind;
    phase: EraPhase;
    elapsedInPhase: number;
    phaseDuration: number;
    dangerousCooldown: number;
  } {
    return {
      era: this.era,
      phase: this.phase,
      elapsedInPhase: this.elapsedInPhase,
      phaseDuration: this.phaseDuration,
      dangerousCooldown: this.dangerousCooldown,
    };
  }

  applySnapshot(snapshot: {
    era: EraKind;
    phase: EraPhase;
    elapsedInPhase: number;
    phaseDuration: number;
    dangerousCooldown: number;
  }): void {
    this.era = snapshot.era;
    this.phase = snapshot.phase;
    this.elapsedInPhase = snapshot.elapsedInPhase;
    this.phaseDuration = snapshot.phaseDuration;
    this.dangerousCooldown = snapshot.dangerousCooldown;
  }
}
