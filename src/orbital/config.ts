import type { EraPhase } from './types';

export const ORBITAL_CONFIG = {
  chaoticPhaseMinSec: 20,
  chaoticPhaseMaxSec: 90,
  stableEraChance: 0.08,
  stableEraDurationSec: 180,
  triSolarLethalThreshold: 3,
  forecastHorizonSec: 45,
  forecastBaseConfidence: 0.6,
  celestialRadius: 360,
  sunBaseScale: 18,
  /** First session phase — visible sun so players can orient immediately. */
  startPhase: 'thaw' as EraPhase,
  startPhaseProgress: 0.55,
  minAmbientIntensity: 0.42,
} as const;
