import type { Locale } from '../i18n/locale';
import type { EraPhase } from '../orbital/types';
import type { TemperatureSample } from '../orbital/types';

const PHASE_OMENS: Record<Locale, Partial<Record<EraPhase, string>>> = {
  en: {
    flying_star: 'Omen: the horizon remembers red — the ground loses its grip.',
    scorch: 'Omen: the air will boil what water you keep.',
    tri_solar: 'Omen: three suns argue — stone and hide lift from the ground.',
    deep_cold: 'Omen: the night wants your heat.',
  },
  zh: {
    flying_star: '预兆：地平线记得红色——大地抓不住任何东西。',
    scorch: '预兆：空气即将夺走你存下的每一滴水。',
    tri_solar: '预兆：三颗太阳在争辩——石与皮屑离地飘起。',
    deep_cold: '预兆：夜要吸走你最后一点热。',
  },
  ja: {
    flying_star: '前兆：地平線は赤を覚えている——地面の引力が緩む。',
    scorch: '前兆：空気が蓄えた水をすべて奪い去る。',
    tri_solar: '前兆：三つの太陽が争う——石と皮が地面から浮く。',
    deep_cold: '前兆：夜が最後の熱を欲している。',
  },
};

const LETHAL_OMEN: Record<Locale, string> = {
  en: 'Omen: the surface is no longer for the living — fold or shelter.',
  zh: '预兆：表面已非生者之地——折叠或躲入掩体。',
  ja: '前兆：地表はもはや生者の場所ではない——折りたたむか掩蔽へ。',
};

export function omenForPhaseEnter(phase: EraPhase, locale: Locale): string | null {
  return PHASE_OMENS[locale]?.[phase] ?? PHASE_OMENS.en[phase] ?? null;
}

export function omenForLethalTemperature(locale: Locale): string | null {
  return LETHAL_OMEN[locale] ?? LETHAL_OMEN.en;
}

export function shouldWarnLethal(sample: TemperatureSample, warnedThisPhase: boolean): boolean {
  if (warnedThisPhase) {
    return false;
  }
  return sample.status === 'lethal' || (sample.status === 'heat' && sample.value >= 2.4);
}
