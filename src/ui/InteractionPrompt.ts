import type { TextLog } from '../narrative/logs';

interface InteractionContext {
  stableEra: boolean;
  nearbyLog: { log: TextLog } | null;
  nearPit: boolean;
  nearWater: boolean;
  nearRegistrar: boolean;
  nearPredictor: boolean;
  nearGroveKeeper: boolean;
  uiBlocking: boolean;
}

export function resolveInteractionPrompt(ctx: InteractionContext): string | null {
  if (ctx.uiBlocking) {
    return null;
  }

  if (ctx.nearGroveKeeper && ctx.stableEra) {
    return '[T] Talk — Grove Keeper';
  }
  if (ctx.nearPredictor) {
    return '[T] Talk — Last Predictor';
  }
  if (ctx.nearRegistrar) {
    return '[T] Talk — Pit Registrar';
  }
  if (ctx.nearbyLog && ctx.nearPit) {
    return '[F] Read tablet · [E] Dehydrate (ring only)';
  }
  if (ctx.nearbyLog) {
    return `[F] Read — ${ctx.nearbyLog.log.title}`;
  }
  if (ctx.stableEra && ctx.nearWater) {
    return '[R] Drink at grove pool';
  }
  if (ctx.nearPit) {
    return '[E] Dehydrate on pit ring';
  }

  return null;
}
