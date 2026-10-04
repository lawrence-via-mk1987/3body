import type { Locale } from '../i18n/locale';
import type { EraPhase } from '../orbital/types';
import type { DeathReason } from '../survival/SurvivalSystem';
import type { NpcPosture } from '../world/HumanoidNpc';

export interface CutsceneBeat {
  phase: EraPhase;
  duration: number;
  subtitle: string;
  posture: NpcPosture;
}

export function openingCutsceneBeats(locale: Locale): CutsceneBeat[] {
  if (locale === 'ja') {
    return [
      {
        phase: 'binary_chaos',
        duration: 9,
        posture: 'skyward',
        subtitle:
          '三体星に穏やかな朝はない。三つの太陽が引き合い、昼は約束を守らない。'
          + '君の文明は、空を見上げ、待つことを学んだ数多の文明の一つだ。',
      },
      {
        phase: 'flying_star',
        duration: 9,
        posture: 'upright',
        subtitle:
          '乱紀元では空が人を殺す。人々は大穴に折りたたまれて待つ。待つことは生きることと同じではない。',
      },
      {
        phase: 'stable_golden',
        duration: 9,
        posture: 'tending',
        subtitle:
          '時に空は燃えることを忘れる。それが恒紀元だ。終わる。そこから運び出すものこそ、意味のすべてだ。',
      },
      {
        phase: 'stable_golden',
        duration: 10,
        posture: 'upright',
        subtitle:
          '君は次の試みだ。歩け。彼らが残した文字を読め。見上げよ——地平線が赤くなるときは目をそらすことを学べ。',
      },
    ];
  }
  if (locale === 'zh') {
    return [
      {
        phase: 'binary_chaos',
        duration: 9,
        posture: 'skyward',
        subtitle:
          '三体星没有温和的清晨。三颗太阳相互牵引，白昼从不守约。'
          + '你的文明是众多仰望天空、并学会等待的文明之一。',
      },
      {
        phase: 'flying_star',
        duration: 9,
        posture: 'upright',
        subtitle:
          '乱纪元里，天空杀人。人们折入大坑等待。等待不等于活着。',
      },
      {
        phase: 'stable_golden',
        duration: 9,
        posture: 'tending',
        subtitle:
          '有时天空忘记燃烧。那是恒纪元。它会结束。你带出去的东西，才是意义所在。',
      },
      {
        phase: 'stable_golden',
        duration: 10,
        posture: 'upright',
        subtitle:
          '你是下一次尝试。行走。阅读他们留下的文字。仰望——并在地平线变红时学会移开目光。',
      },
    ];
  }
  return [
    {
      phase: 'binary_chaos',
      duration: 9,
      posture: 'skyward',
      subtitle:
        'Trisolaris has no gentle morning. Three suns pull, and the day does not keep its promise. '
        + 'Your civilization is one of many that looked up — and learned to wait.',
    },
    {
      phase: 'flying_star',
      duration: 9,
      posture: 'upright',
      subtitle:
        'In a Chaotic Era the sky kills. People fold into the pit and wait. Waiting is not the same as living.',
    },
    {
      phase: 'stable_golden',
      duration: 9,
      posture: 'tending',
      subtitle:
        'Sometimes the sky forgets to burn. That is a Stable Era. It ends. What you carry out of it is the whole point.',
    },
    {
      phase: 'stable_golden',
      duration: 10,
      posture: 'upright',
      subtitle:
        'You are the next attempt. Walk. Read what they left. Look up — and look away when the horizon turns red.',
    },
  ];
}

export function deathCutsceneBeats(locale: Locale, reason: DeathReason): CutsceneBeat[] {
  const phase: EraPhase =
    reason === 'cold' ? 'deep_cold' : reason === 'thirst' ? 'scorch' : 'flying_star';
  const posture: NpcPosture = reason === 'cold' ? 'upright' : reason === 'thirst' ? 'tending' : 'upright';

  if (locale === 'ja') {
    const subtitle =
      reason === 'heat'
        ? '太陽がこの文明を奪った。数字は関係ない。空が先に来た。'
        : reason === 'cold'
          ? '次の夜明けより先に夜が来た。体はまだ朝を数えているうちに凍った。'
          : reason === 'thirst'
            ? '空より先に水が去った。文明は火より長くは空の瓶には耐えられない。'
            : 'このサイクルは止まった。荒原は次の文明のために場所を残している。';
    return [{ phase, duration: 11, posture, subtitle }];
  }

  if (locale === 'zh') {
    const subtitle =
      reason === 'heat'
        ? '太阳夺走了这一文明。数字无关紧要。天空先到。'
        : reason === 'cold'
          ? '黎明未来，夜先至。身体在仍指望早晨时冻住了。'
          : reason === 'thirst'
            ? '水比天空先离开。文明扛火的时间，长不过空罐。'
            : '这一循环停止了。荒原为下一文明留着位置。';
    return [{ phase, duration: 11, posture, subtitle }];
  }

  const subtitle =
    reason === 'heat'
      ? 'The suns took this civilization. The numbers did not matter. The sky arrived first.'
      : reason === 'cold'
        ? 'Night came before the next dawn. The body froze while it was still counting on morning.'
        : reason === 'thirst'
          ? 'The water left before the sky did. A civilization can survive fire longer than an empty jar.'
          : 'This cycle stopped. The wasteland keeps the place for the next one.';
  return [{ phase, duration: 11, posture, subtitle }];
}

export function victoryCutsceneBeats(locale: Locale, epilogueSpeech: string): CutsceneBeat[] {
  const parts = epilogueSpeech.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const body = parts[0] ?? epilogueSpeech;
  const tail = parts[1] ?? '';
  if (locale === 'zh') {
    return [
      {
        phase: 'stable_golden',
        duration: 12,
        posture: 'tending',
        subtitle: body,
      },
      ...(tail
        ? [{
          phase: 'stable_golden' as EraPhase,
          duration: 10,
          posture: 'upright' as NpcPosture,
          subtitle: tail,
        }]
        : []),
    ];
  }
  return [
    {
      phase: 'stable_golden',
      duration: 12,
      posture: 'tending',
      subtitle: body,
    },
    ...(tail
      ? [{
        phase: 'stable_golden' as EraPhase,
        duration: 10,
        posture: 'upright' as NpcPosture,
        subtitle: tail,
      }]
      : []),
  ];
}
