import { ORBITAL_CONFIG } from './config';
import type { EraPhase, ForecastEntry } from './types';
import { CHAOTIC_PHASES } from './types';

const FORECAST_OFFSETS = [15, 30, 45];

function neighborPhases(phase: EraPhase): EraPhase[] {
  const index = CHAOTIC_PHASES.indexOf(phase);
  if (index === -1) {
    return ['stable_golden'];
  }

  const neighbors: EraPhase[] = [phase];
  if (index > 0) {
    neighbors.push(CHAOTIC_PHASES[index - 1]);
  }
  if (index < CHAOTIC_PHASES.length - 1) {
    neighbors.push(CHAOTIC_PHASES[index + 1]);
  }
  return neighbors;
}

function estimateTemperatureRange(phase: EraPhase): [number, number] {
  switch (phase) {
    case 'deep_cold':
      return [-3, -1];
    case 'thaw':
      return [-1, 1];
    case 'scorch':
      return [1, 2.5];
    case 'binary_chaos':
      return [-1.5, 2.5];
    case 'tri_solar':
    case 'flying_star':
      return [2.5, 3];
    case 'eclipse_relief':
      return [-1.5, 0];
    case 'stable_golden':
      return [-0.5, 1];
    default:
      return [-2, 2];
  }
}

export function buildForecast(
  currentPhase: EraPhase,
  elapsedInPhase: number,
  phaseDuration: number,
): ForecastEntry[] {
  const neighbors = neighborPhases(currentPhase);

  return FORECAST_OFFSETS.map((offset) => {
    const beyondHorizon = offset > 30;
    const likelyPhase = beyondHorizon
      ? neighbors[Math.floor(Math.random() * neighbors.length)]
      : currentPhase;

    const timeRemaining = Math.max(phaseDuration - elapsedInPhase, 0);
    const phaseMayChange = offset > timeRemaining;
    const confidence = phaseMayChange
      ? Math.max(0.25, ORBITAL_CONFIG.forecastBaseConfidence - offset * 0.008)
      : Math.min(0.95, ORBITAL_CONFIG.forecastBaseConfidence + 0.2);

    return {
      timeOffset: offset,
      phase: likelyPhase,
      confidence,
      temperatureRange: estimateTemperatureRange(likelyPhase),
    };
  });
}

export function summarizeForecast(entries: ForecastEntry[]): string {
  if (entries.length === 0) {
    return 'No reading';
  }

  const [first] = entries;
  const [minTemp, maxTemp] = first.temperatureRange;

  if (maxTemp >= 2.5) {
    return 'Lethal heat likely';
  }
  if (minTemp <= -2) {
    return 'Deep freeze likely';
  }
  if (maxTemp > 1.5) {
    return 'Warming ahead';
  }
  if (minTemp < -0.5) {
    return 'Cold surge ahead';
  }
  return 'Conditions uncertain';
}
