import type { Locale } from '../i18n/locale';
import { narrationProsody } from './voiceSelection';

/** Who is speaking — used for pitch/rate offsets on browser TTS. */
export type VoiceRole =
  | 'narrator'
  | 'registrar'
  | 'predictor'
  | 'keeper'
  | 'tablet'
  | 'witness';

export function voiceRoleForNpc(npc: 'registrar' | 'predictor' | 'grove'): VoiceRole {
  if (npc === 'registrar') {
    return 'registrar';
  }
  if (npc === 'predictor') {
    return 'predictor';
  }
  return 'keeper';
}

export function prosodyForRole(
  locale: Locale,
  role: VoiceRole,
): { lang: string; rate: number; pitch: number } {
  const base = narrationProsody(locale);
  switch (role) {
    case 'registrar':
      return { lang: base.lang, rate: base.rate * 0.92, pitch: base.pitch * 0.88 };
    case 'predictor':
      return { lang: base.lang, rate: base.rate * 0.96, pitch: base.pitch * 1.04 };
    case 'keeper':
      return { lang: base.lang, rate: base.rate * 0.9, pitch: base.pitch * 0.96 };
    case 'tablet':
      return { lang: base.lang, rate: base.rate * 0.84, pitch: base.pitch * 0.9 };
    case 'witness':
      return { lang: base.lang, rate: base.rate * 0.88, pitch: base.pitch * 0.94 };
    case 'narrator':
    default:
      return base;
  }
}
