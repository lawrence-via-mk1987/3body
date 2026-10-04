import type { Locale } from './locale';
import type { DeathReason } from '../survival/SurvivalSystem';
import { pickLocale } from './pick';

export function getDeathMessageCopy(locale: Locale, reason: DeathReason): string {
  const table: Record<DeathReason, Partial<Record<Locale, string>>> = {
    heat: {
      en: 'The suns claimed you. Your civilization ends in scorched silence.',
      zh: '烈日收走了你。你的文明在焦土与寂静中终结。',
      ja: '三つの太陽があなたを飲み込んだ。文明は焼けた静寂の中で終わる。',
    },
    cold: {
      en: 'The chaotic night froze your body before the next dawn.',
      zh: '乱纪元的寒夜在你见到下一个黎明前冻住了身体。',
      ja: '乱紀元の夜が、次の夜明け前に体を凍らせた。',
    },
    thirst: {
      en: 'The wasteland drank the last of your water.',
      zh: '荒原喝干了最后一滴水。',
      ja: '荒原が最後の水まで奪った。',
    },
    unknown: {
      en: 'Another cycle ends. The wasteland waits for the next civilization.',
      zh: '又一个循环结束。荒原等待下一个文明。',
      ja: 'また一つのサイクルが終わる。荒原は次の文明を待っている。',
    },
  };

  const row = table[reason] ?? table.unknown;
  return pickLocale(locale, row, row.en ?? table.unknown.en!);
}

export function formatDeathLogsLine(locale: Locale, found: number, total: number): string {
  return pickLocale(
    locale,
    {
      en: `Civilization memory preserved: ${found} / ${total} logs remain known to you across cycles.`,
      zh: `文明记忆：你已知晓 ${found} / ${total} 块碑文。`,
      ja: `文明の記憶：${found} / ${total} の碑文を、サイクルを越えて覚えている。`,
    },
    `Civilization memory preserved: ${found} / ${total} logs remain known to you across cycles.`,
  );
}

export function formatWorldAgeCounsel(locale: Locale, name: string, worldNote: string): string {
  return pickLocale(
    locale,
    {
      en: `World age: ${name} — ${worldNote}`,
      zh: `世界时代：${name} — ${worldNote}`,
      ja: `世界の時代：${name} — ${worldNote}`,
    },
    `World age: ${name} — ${worldNote}`,
  );
}
