import type { Locale } from './locale';

export interface CinematicCard {
  eyebrow: string;
  title: string;
  body: string;
}

export interface WorldIntroCopy {
  summaryTitle: string;
  paragraphs: string[];
  youLine: string;
}

export interface IntroUiCopy {
  worldIntroSummary: string;
  controlsSummary: string;
  cinematicSkip: string;
  cinematicNext: string;
  cinematicFinish: string;
  narrationLabel: string;
  replayCinematic: string;
  localeEn: string;
  localeZh: string;
  languageLabel: string;
}

const UI: Record<Locale, IntroUiCopy> = {
  en: {
    worldIntroSummary: 'The world (inspired by the Three Body Problem)',
    controlsSummary: 'Controls & fan disclaimer',
    cinematicSkip: 'Skip intro',
    cinematicNext: 'Continue',
    cinematicFinish: 'Enter the wasteland',
    narrationLabel: 'Spoken narration (browser voice)',
    replayCinematic: 'Replay opening intro',
    localeEn: 'English',
    localeZh: '简体中文',
    languageLabel: 'Language',
  },
  zh: {
    worldIntroSummary: '世界背景（灵感来自《三体》）',
    controlsSummary: '操作与同人免责声明',
    cinematicSkip: '跳过开场',
    cinematicNext: '继续',
    cinematicFinish: '进入荒原',
    narrationLabel: '语音旁白（浏览器朗读）',
    replayCinematic: '重播开场',
    localeEn: 'English',
    localeZh: '简体中文',
    languageLabel: '语言',
  },
};

const WORLD: Record<Locale, WorldIntroCopy> = {
  en: {
    summaryTitle: 'The world (inspired by the Three Body Problem)',
    paragraphs: [
      'On <strong>Trisolaris</strong>, three suns move in unstable orbits. Their gravity never settles into a simple day and night—so the weather does not either. This demo is fan-inspired by Liu Cixin’s <em>The Three Body Problem</em>; it is not the novel or the TV drama, only a survival sketch built from its ideas.',
      'Most of the time is a <strong>Chaotic Era (乱纪元)</strong>: heat that kills in minutes, cold that follows, skies where one sun can swell into a lethal <strong>flying star</strong>. Trisolarian life survives by hoarding water, hiding underground, and sometimes <strong>dehydrating</strong>—folding into dry stasis until the sky turns kinder.',
      'Rare windows called a <strong>Stable Era (恒纪元)</strong> bring calm: gentler temperature, green returning, time to repair and read what earlier civilizations left in the ruins. Stable Eras always end. Each cycle hopes the next will endure longer than the last.',
    ],
    youLine:
      'In this demo you endure one such cycle: follow the beacons, learn from tablets and counselors, and try to reach the <strong>Final Log</strong> beneath a stable sky.',
  },
  zh: {
    summaryTitle: '世界背景（灵感来自《三体》）',
    paragraphs: [
      '在<strong>三体星</strong>上，三颗太阳在混沌的轨道间运行。它们的引力无法像单一恒星那样给出稳定的昼夜，天气也因此无法稳定。本演示是同人作品，灵感来自刘慈欣的《三体》，并非小说或电视剧的复述，只是借用其思想的生存小品。',
      '大多数时候是<strong>乱纪元</strong>：酷热可在片刻间致命，严寒紧随其后；天空中一颗太阳可膨胀为致命的<strong>飞星</strong>。三体生命靠囤积水源、躲入地下，有时<strong>脱水</strong>——将身体折入干燥的休眠，直到天空再次仁慈。',
      '罕见的<strong>恒纪元</strong>带来安宁：温度温和、绿色回归，有时间修复并阅读先前文明留在废墟中的记录。恒纪元总会结束。每一个循环都盼望下一个能撑得更久。',
    ],
    youLine:
      '在本演示中，你将经历这样一个循环：跟随信标，向石碑与引路人学习，并尝试在恒纪元的天空下找到<strong>最终日志</strong>。',
  },
};

const CINEMATIC: Record<Locale, CinematicCard[]> = {
  en: [
    {
      eyebrow: 'Cycle unknown · Chaotic sky',
      title: 'Three suns. No fixed dawn.',
      body:
        'Trisolaris has no gentle seasons. Three stars tug at one another; the horizon can turn from frost to fire without warning. Your civilization is one of many that looked up—and learned to wait.',
    },
    {
      eyebrow: '乱纪元 · Chaotic Era',
      title: 'Endure, or fold.',
      body:
        'In the Chaotic Era, water is memory and shade is currency. When heat rises, seek the pit ring and dehydrate. When the forecast screams red, do not trust the open plain.',
    },
    {
      eyebrow: '恒纪元 · hope',
      title: 'When the sky forgives',
      body:
        'A Stable Era is a held breath. Green returns. Follow the grove beacon, drink, read—and if you can, find the Final Log before chaos returns. Hope is not a prediction. It is a discipline.',
    },
  ],
  zh: [
    {
      eyebrow: '未知循环 · 乱纪元天空',
      title: '三颗太阳。没有固定的黎明。',
      body:
        '三体星没有温和的季节。三颗恒星相互牵引；地平线可在毫无预警间从霜寒变为烈火。你的文明是众多仰望天空、并学会等待的文明之一。',
    },
    {
      eyebrow: '乱纪元',
      title: '忍耐，或折叠。',
      body:
        '乱纪元里，水是记忆，阴影是货币。当酷热升起，寻找脱水坑环带并脱水。当预报一片赤红，不要信任开阔的荒原。',
    },
    {
      eyebrow: '恒纪元 · 希望',
      title: '当天空暂时仁慈',
      body:
        '恒纪元是一次屏息。绿色归来。跟随树林信标，饮水，阅读——若可以，在乱纪元回归前找到最终日志。希望不是预测，是纪律。',
    },
  ],
};

export const STABLE_ERA_NARRATION: Record<Locale, string> = {
  en: 'Stable Era. The sky is kind. Breathe while you can.',
  zh: '恒纪元。天空暂时仁慈。趁此呼吸。',
};

export function getIntroUi(locale: Locale): IntroUiCopy {
  return UI[locale];
}

export function getWorldIntro(locale: Locale): WorldIntroCopy {
  return WORLD[locale];
}

export function getCinematicCards(locale: Locale): CinematicCard[] {
  return CINEMATIC[locale];
}
