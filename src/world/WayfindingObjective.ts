import type { EraKind } from '../orbital/types';
import type { TemperatureSample } from '../orbital/types';
import { PIT_LANDMARK, GROVE_LANDMARK } from './landmarks';

export type WayfindingTarget = 'pit' | 'grove';

export interface WayfindingContext {
  era: EraKind;
  hydration: number;
  temperature: TemperatureSample;
  nearGroveWater: boolean;
  hasFinalLog: boolean;
  playerX: number;
  playerZ: number;
}

const PIT_PROXIMITY = 28;
const GROVE_PROXIMITY = 32;

export function resolveWayfindingTarget(ctx: WayfindingContext): WayfindingTarget | null {
  const distPit = Math.hypot(ctx.playerX - PIT_LANDMARK.x, ctx.playerZ - PIT_LANDMARK.z);
  const distGrove = Math.hypot(ctx.playerX - GROVE_LANDMARK.x, ctx.playerZ - GROVE_LANDMARK.z);

  if (ctx.era === 'stable') {
    if (distGrove <= GROVE_PROXIMITY) {
      return null;
    }
    if (ctx.hydration < 72 || !ctx.hasFinalLog) {
      return 'grove';
    }
    return null;
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
  return target === 'pit' ? 'Dehydration pit' : 'Stable Era grove';
}

export function wayfindingCoords(target: WayfindingTarget): { x: number; z: number } {
  return target === 'pit' ? PIT_LANDMARK : GROVE_LANDMARK;
}
