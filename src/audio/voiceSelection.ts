import type { Locale } from '../i18n/locale';

const EN_PREFER = [
  /samantha/i,
  /daniel/i,
  /karen/i,
  /moira/i,
  /google uk english/i,
  /google us english/i,
  /microsoft (zira|david|aria|jenny|guy)/i,
  /natural/i,
  /neural/i,
  /premium/i,
];

const EN_AVOID = [
  /espeak/i,
  /compact/i,
  /super-compact/i,
  /bad/i,
  /whisper/i,
  /croak/i,
];

const ZH_PREFER = [
  /ting-?ting/i,
  /meijia/i,
  /huihui/i,
  /yaoyao/i,
  /xiaoxiao/i,
  /yunxi/i,
  /google.*mandarin/i,
  /google.*普通话/i,
  /microsoft.*xiaoxiao/i,
  /microsoft.*yunxi/i,
];

const ZH_AVOID = [
  /en-/i,
  /english/i,
  /espeak/i,
  /compact/i,
];

function scoreVoice(voice: SpeechSynthesisVoice, locale: Locale): number {
  const lang = voice.lang.toLowerCase();
  const name = voice.name;
  let score = 0;

  if (locale === 'zh') {
    if (lang.startsWith('zh-cn')) {
      score += 55;
    } else if (lang.startsWith('zh-hk')) {
      score += 28;
    } else if (lang.startsWith('zh-tw')) {
      score += 22;
    } else if (lang.startsWith('zh')) {
      score += 35;
    } else {
      return -100;
    }
    for (const pattern of ZH_PREFER) {
      if (pattern.test(name)) {
        score += 22;
      }
    }
    for (const pattern of ZH_AVOID) {
      if (pattern.test(name)) {
        score -= 35;
      }
    }
  } else {
    if (lang.startsWith('en-us')) {
      score += 45;
    } else if (lang.startsWith('en-gb')) {
      score += 42;
    } else if (lang.startsWith('en')) {
      score += 30;
    } else {
      return -100;
    }
    for (const pattern of EN_PREFER) {
      if (pattern.test(name)) {
        score += 20;
      }
    }
    for (const pattern of EN_AVOID) {
      if (pattern.test(name)) {
        score -= 40;
      }
    }
  }

  if (voice.localService) {
    score += 4;
  }
  if (voice.default) {
    score += 2;
  }

  return score;
}

export function pickPreferredVoice(
  voices: SpeechSynthesisVoice[],
  locale: Locale,
): SpeechSynthesisVoice | null {
  if (voices.length === 0) {
    return null;
  }

  const ranked = voices
    .map((voice) => ({ voice, score: scoreVoice(voice, locale) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.voice ?? null;
}

export function narrationProsody(locale: Locale): {
  lang: string;
  rate: number;
  pitch: number;
} {
  if (locale === 'zh') {
    return { lang: 'zh-CN', rate: 0.86, pitch: 0.94 };
  }
  return { lang: 'en-US', rate: 0.8, pitch: 0.92 };
}
