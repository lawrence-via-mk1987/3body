import type { EraKind } from '../orbital/types';
import type { TemperatureSample } from '../orbital/types';
import { GROVE_LANDMARK, OBSERVATORY_LANDMARK, PIT_LANDMARK } from './landmarks';

export type WayfindingTarget = 'pit' | 'grove' | 'observatory';

export interface WayfindingContext {
  era: EraKind;
  hydration: number;
  temperature: TemperatureSample;
  nearGroveWater: boolean;
  hasFinalLog: boolean;
  forecastCalibrated: boolean;
  playerX: number;
  playerZ: number;
}

const PIT_PROXIMITY = 28;
const GROVE_PROXIMITY = 32;
const OBSERVATORY_PROXIMITY = 30;

export function resolveWayfindingTarget(ctx: WayfindingContext): WayfindingTarget | null {
  const distPit = Math.hypot(ctx.playerX - PIT_LANDMARK.x, ctx.playerZ - PIT_LANDMARK.z);
  const distGrove = Math.hypot(
    ctx.playerX - GROVE_LANDMARK.x,
    ctx.playerZ - GROVE_LANDMARK.z,
  );
  const distObservatory = Math.hypot(
    ctx.playerX - OBSERVATORY_LANDMARK.x,
    ctx.playerZ - OBSERVATORY_LANDMARK.z,
  );

  if (ctx.era === 'stable') {
    if (distGrove <= GROVE_PROXIMITY) {
      return null;
    }
    if (ctx.hydration < 72 || !ctx.hasFinalLog) {
      return 'grove';
    }
    return null;
  }

  const criticalPit = ctx.hydration < 30
    || ctx.temperature.status === 'lethal';
  if (criticalPit && distPit > PIT_PROXIMITY) {
    return 'pit';
  }

  if (!ctx.forecastCalibrated && distObservatory > OBSERVATORY_PROXIMITY) {
    return 'observatory';
  }

  if (distPit <= PIT_PROXIMITY) {
    return null;
  }

  const needsPit = ctx.hydration < 42
    || ctx.temperature.status === 'heat'
    || ctx.temperature.status === 'lethal';

  return needsPit ? 'pit' : null;
}

export function wayfindingLabel(target: WayfindingTarget): string {
  switch (target) {
    case 'pit':
      return 'Dehydration pit';
    case 'grove':
      return 'Stable Era grove';
    case 'observatory':
      return 'Observatory (Predictor)';
    default:
      return 'Landmark';
  }
}

export function wayfindingCoords(target: WayfindingTarget): { x: number; z: number } {
  switch (target) {
    case 'pit':
      return PIT_LANDMARK;
    case 'grove':
      return GROVE_LANDMARK;
    case 'observatory':
      return OBSERVATORY_LANDMARK;
    default:
      return PIT_LANDMARK;
  }
}
