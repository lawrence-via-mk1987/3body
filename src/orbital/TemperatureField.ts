import * as THREE from 'three';
import type { EraKind, EraPhase, SunSnapshot, TemperatureSample } from './types';

export function computeSunHeatContribution(sun: SunSnapshot): number {
  if (!sun.active || sun.elevation <= 0) {
    return 0;
  }

  const elevationFactor = Math.cos(Math.min(sun.elevation, Math.PI / 2));
  return sun.intensity * elevationFactor * sun.apparentScale * 0.35;
}

export function computeSurfaceTemperature(
  suns: SunSnapshot[],
  era: EraKind,
  phase: EraPhase,
  elapsedInPhase: number,
): number {
  const sunHeat = suns.reduce((sum, sun) => sum + computeSunHeatContribution(sun), 0);

  let temperature = sunHeat;

  if (era === 'chaotic') {
    const noise = Math.sin(elapsedInPhase * 0.7) * 0.25 + Math.cos(elapsedInPhase * 0.31) * 0.15;
    temperature += noise;

    if (phase === 'deep_cold') {
      temperature = Math.min(temperature, -1.2);
    }
    if (phase === 'flying_star' || phase === 'tri_solar') {
      temperature = Math.max(temperature, 2.6);
    }
    if (phase === 'eclipse_relief') {
      temperature = Math.min(temperature, -0.4);
    }
  } else {
    temperature = THREE.MathUtils.clamp(temperature, -0.5, 1);
  }

  return THREE.MathUtils.clamp(temperature, -3, 3);
}

export function describeTemperature(value: number): Pick<TemperatureSample, 'label' | 'status'> {
  if (value <= -2) {
    return { label: 'Freezing', status: 'freezing' };
  }
  if (value <= -1) {
    return { label: 'Bitter Cold', status: 'cold' };
  }
  if (value <= 1) {
    return { label: 'Survivable', status: 'safe' };
  }
  if (value <= 2) {
    return { label: 'Scorching', status: 'heat' };
  }
  return { label: 'Lethal Heat', status: 'lethal' };
}
