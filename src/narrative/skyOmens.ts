import type { Locale } from '../i18n/locale';
import type { EraPhase } from '../orbital/types';
import type { TemperatureSample } from '../orbital/types';

export function omenForPhaseEnter(phase: EraPhase, locale: Locale): string | null {
  if (locale === 'zh') {
    switch (phase) {
      case 'flying_star':
        return '预兆：地平线记得红色。';
      case 'scorch':
        return '预兆：空气即将夺走你存下的每一滴水。';
      case 'tri_solar':
        return '预兆：三颗太阳在争辩——快找阴影。';
      case 'deep_cold':
        return '预兆：夜要吸走你最后一点热。';
      default:
        return null;
    }
  }

  switch (phase) {
    case 'flying_star':
      return 'Omen: the horizon remembers red.';
    case 'scorch':
      return 'Omen: the air will boil what water you keep.';
    case 'tri_solar':
      return 'Omen: three suns argue — find shadow soon.';
    case 'deep_cold':
      return 'Omen: the night wants your heat.';
    default:
      return null;
  }
}

export function omenForLethalTemperature(locale: Locale): string | null {
  if (locale === 'zh') {
    return '预兆：表面已非生者之地——折叠或躲入掩体。';
  }
  return 'Omen: the surface is no longer for the living — fold or shelter.';
}

export function shouldWarnLethal(sample: TemperatureSample, warnedThisPhase: boolean): boolean {
  if (warnedThisPhase) {
    return false;
  }
  return sample.status === 'lethal' || (sample.status === 'heat' && sample.value >= 2.4);
}
