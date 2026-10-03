import type { Locale } from '../i18n/locale';
import type { NearbyLog } from '../narrative/LogMarkers';

export type InputMode = 'keyboard' | 'touch';

export interface InteractionContext {
  stableEra: boolean;
  nearbyLog: NearbyLog | null;
  nearPit: boolean;
  nearWater: boolean;
  nearRegistrar: boolean;
  nearPredictor: boolean;
  nearGroveKeeper: boolean;
  uiBlocking: boolean;
  input: InputMode;
  locale: Locale;
  forecastCalibrated?: boolean;
}

export function resolveInteractionPrompt(ctx: InteractionContext): string | null {
  if (ctx.uiBlocking) {
    return null;
  }

  const touch = ctx.input === 'touch';
  const zh = ctx.locale === 'zh';

  if (ctx.nearGroveKeeper && ctx.stableEra) {
    return touch
      ? (zh ? '点 Talk — 林守护者' : 'Tap Talk — Grove Keeper')
      : '[T] Talk — Grove Keeper';
  }
  if (ctx.nearPredictor) {
    return touch
      ? (zh ? '点 Talk — 末位预测者' : 'Tap Talk — Last Predictor')
      : '[T] Talk — Last Predictor';
  }
  if (ctx.nearRegistrar) {
    return touch
      ? (zh ? '点 Talk — 大坑登记员' : 'Tap Talk — Pit Registrar')
      : '[T] Talk — Pit Registrar';
  }
  if (ctx.nearbyLog && ctx.nearPit) {
    return touch
      ? (zh
        ? `点 Read 读碑 · 点 Fold 在坑边折叠`
        : `Tap Read — tablet · Tap Fold on pit ring`)
      : '[F] Read tablet · [E] Dehydrate (ring only)';
  }
  if (ctx.nearbyLog) {
    return touch
      ? (zh ? `点 Read — ${ctx.nearbyLog.log.title}` : `Tap Read — ${ctx.nearbyLog.log.title}`)
      : `[F] Read — ${ctx.nearbyLog.log.title}`;
  }
  if (ctx.stableEra && ctx.nearWater) {
    return touch
      ? (zh ? '点 Use — 林池饮水' : 'Tap Use — drink at grove pool')
      : '[R] Drink at grove pool';
  }
  if (ctx.nearPit) {
    return touch
      ? (zh ? '点 Fold — 坑边脱水' : 'Tap Fold — dehydrate on pit ring')
      : '[E] Dehydrate on pit ring';
  }

  return null;
}

/** Contextual hint for the status line when near an interactable (mobile-friendly on touch). */
export function resolveNearbyActionStatus(ctx: InteractionContext): string | null {
  if (ctx.uiBlocking) {
    return null;
  }

  const touch = ctx.input === 'touch';
  const zh = ctx.locale === 'zh';

  if (ctx.nearGroveKeeper && ctx.stableEra) {
    return touch
      ? (zh ? '靠近林守护者 — 点下方 Talk 交谈。' : 'Grove Keeper nearby — tap Talk below.')
      : 'Press T to speak with the Grove Keeper.';
  }
  if (ctx.nearPredictor) {
    if (touch) {
      return ctx.forecastCalibrated
        ? (zh ? '末位预测者在旁 — 点 Talk 交谈。' : 'Last Predictor nearby — tap Talk below.')
        : (zh ? '点 Talk — 预测者可校准天空预报。' : 'Tap Talk — the Predictor can calibrate your forecast.');
    }
    return ctx.forecastCalibrated
      ? 'Press T to speak with the Last Predictor.'
      : 'Press T — the Last Predictor can calibrate your forecast.';
  }
  if (ctx.nearRegistrar) {
    return touch
      ? (zh ? '登记员在旁 — 点下方 Talk 交谈。' : 'Registrar nearby — tap Talk below.')
      : 'Press T to speak with the Registrar of the Pit.';
  }
  if (ctx.nearbyLog && ctx.nearPit) {
    return touch
      ? (zh
        ? `点 Read 读「${ctx.nearbyLog.log.title}」；点 Fold 仅在坑环上折叠。`
        : `Tap Read for ${ctx.nearbyLog.log.title.toLowerCase()}. Tap Fold on the pit ring only.`)
      : `F — read ${ctx.nearbyLog.log.title.toLowerCase()}. E — dehydrate on the ring only (step away from the stone).`;
  }
  if (ctx.nearbyLog) {
    return touch
      ? (zh ? `点 Read 阅读「${ctx.nearbyLog.log.title}」。` : `Tap Read to read ${ctx.nearbyLog.log.title.toLowerCase()}.`)
      : ctx.nearbyLog.discovered
        ? `Press F to re-read ${ctx.nearbyLog.log.title.toLowerCase()}.`
        : `Press F to read ${ctx.nearbyLog.log.title.toLowerCase()}.`;
  }
  if (ctx.stableEra && ctx.nearWater) {
    return touch
      ? (zh ? '稳定纪元 — 点 Use 在林池饮水。' : 'Stable Era — tap Use to drink at the grove pool.')
      : 'Stable Era — press R at the grove pool to drink condensate.';
  }

  return null;
}
