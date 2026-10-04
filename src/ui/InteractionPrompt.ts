import type { Locale } from '../i18n/locale';
import { pickLocale } from '../i18n/pick';
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

function L(locale: Locale, en: string, zh: string, ja: string): string {
  return pickLocale(locale, { en, zh, ja }, en);
}

export function resolveInteractionPrompt(ctx: InteractionContext): string | null {
  if (ctx.uiBlocking) {
    return null;
  }

  const touch = ctx.input === 'touch';
  const { locale } = ctx;

  if (ctx.nearGroveKeeper && ctx.stableEra) {
    return touch
      ? L(locale, 'Tap Talk — Grove Keeper', '点 Talk — 林守护者', 'Talk をタップ — 林の守り手')
      : '[T] Talk — Grove Keeper';
  }
  if (ctx.nearPredictor) {
    return touch
      ? L(locale, 'Tap Talk — Last Predictor', '点 Talk — 末位预测者', 'Talk をタップ — 末代の予測者')
      : '[T] Talk — Last Predictor';
  }
  if (ctx.nearRegistrar) {
    return touch
      ? L(locale, 'Tap Talk — Pit Registrar', '点 Talk — 大坑登记员', 'Talk をタップ — 大穴の登録係')
      : '[T] Talk — Pit Registrar';
  }
  if (ctx.nearbyLog && ctx.nearPit) {
    return touch
      ? L(
        locale,
        'Tap Read — tablet · Tap Fold on pit ring',
        '点 Read 读碑 · 点 Fold 在坑边折叠',
        'Read で碑 · Fold は穴の輪のみ',
      )
      : '[F] Read tablet · [E] Dehydrate (ring only)';
  }
  if (ctx.nearbyLog) {
    return touch
      ? L(locale, `Tap Read — ${ctx.nearbyLog.log.title}`, `点 Read — ${ctx.nearbyLog.log.title}`, `Read — ${ctx.nearbyLog.log.title}`)
      : `[F] Read — ${ctx.nearbyLog.log.title}`;
  }
  if (ctx.stableEra && ctx.nearWater) {
    return touch
      ? L(locale, 'Tap Use — drink at grove pool', '点 Use — 林池饮水', 'Use — 林の池で水')
      : '[R] Drink at grove pool';
  }
  if (ctx.nearPit) {
    return touch
      ? L(locale, 'Tap Fold — dehydrate on pit ring', '点 Fold — 坑边脱水', 'Fold — 穴の輪で脱水')
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
  const { locale } = ctx;

  if (ctx.nearGroveKeeper && ctx.stableEra) {
    return touch
      ? L(locale, 'Grove Keeper nearby — tap Talk below.', '靠近林守护者 — 点下方 Talk 交谈。', '林の守り手が近い — 下の Talk をタップ。')
      : 'Press T to speak with the Grove Keeper.';
  }
  if (ctx.nearPredictor) {
    if (touch) {
      return ctx.forecastCalibrated
        ? L(locale, 'Last Predictor nearby — tap Talk below.', '末位预测者在旁 — 点 Talk 交谈。', '末代の予測者が近い — Talk をタップ。')
        : L(locale, 'Tap Talk — the Predictor can calibrate your forecast.', '点 Talk — 预测者可校准天空预报。', 'Talk — 予測者が予報を研ぎ澄ます。');
    }
    return ctx.forecastCalibrated
      ? 'Press T to speak with the Last Predictor.'
      : 'Press T — the Last Predictor can calibrate your forecast.';
  }
  if (ctx.nearRegistrar) {
    return touch
      ? L(locale, 'Registrar nearby — tap Talk below.', '登记员在旁 — 点下方 Talk 交谈。', '登録係が近い — 下の Talk をタップ。')
      : 'Press T to speak with the Registrar of the Pit.';
  }
  if (ctx.nearbyLog && ctx.nearPit) {
    return touch
      ? L(
        locale,
        `Tap Read for ${ctx.nearbyLog.log.title.toLowerCase()}. Tap Fold on the pit ring only.`,
        `点 Read 读「${ctx.nearbyLog.log.title}」；点 Fold 仅在坑环上折叠。`,
        `Read で「${ctx.nearbyLog.log.title}」。Fold は穴の輪のみ。`,
      )
      : `F — read ${ctx.nearbyLog.log.title.toLowerCase()}. E — dehydrate on the ring only (step away from the stone).`;
  }
  if (ctx.nearbyLog) {
    return touch
      ? L(
        locale,
        `Tap Read to read ${ctx.nearbyLog.log.title.toLowerCase()}.`,
        `点 Read 阅读「${ctx.nearbyLog.log.title}」。`,
        `Read で「${ctx.nearbyLog.log.title}」を読む。`,
      )
      : ctx.nearbyLog.discovered
        ? `Press F to re-read ${ctx.nearbyLog.log.title.toLowerCase()}.`
        : `Press F to read ${ctx.nearbyLog.log.title.toLowerCase()}.`;
  }
  if (ctx.stableEra && ctx.nearWater) {
    return touch
      ? L(locale, 'Stable Era — tap Use to drink at the grove pool.', '稳定纪元 — 点 Use 在林池饮水。', '恒紀元 — Use で林の池から水を。')
      : 'Stable Era — press R at the grove pool to drink condensate.';
  }

  return null;
}
