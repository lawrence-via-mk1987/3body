import type { Locale } from '../i18n/locale';

export interface StageCopy {
  id: number;
  name: string;
  blurb: string;
  worldNote: string;
}

const STAGES: Record<Locale, StageCopy[]> = {
  en: [
    {
      id: 0,
      name: 'Clan wasteland',
      blurb: 'Scattered ruins — no living settlement.',
      worldNote: 'Bone markers and ash rings only.',
    },
    {
      id: 1,
      name: 'Dehydration age',
      blurb: 'The pit becomes a counted institution.',
      worldNote: 'Pit scaffolds and folded rows multiply.',
    },
    {
      id: 2,
      name: 'Observation sect',
      blurb: 'Sages watch the sky together.',
      worldNote: 'Observatory scaffolds and signal fires appear.',
    },
    {
      id: 3,
      name: 'Grove covenant',
      blurb: 'Hope is planted between catastrophes.',
      worldNote: 'Grove paths and camp hearths wake.',
    },
    {
      id: 4,
      name: 'Unified cycle',
      blurb: 'Roads link pit, dome, and grove.',
      worldNote: 'Waystones and lanterns mark a living map.',
    },
  ],
  zh: [
    {
      id: 0,
      name: '部落荒原',
      blurb: '散落废墟——尚无定居。',
      worldNote: '仅有骨标与灰烬环。',
    },
    {
      id: 1,
      name: '脱水时代',
      blurb: '大坑成为被计数的制度。',
      worldNote: '坑边脚手架与折叠行列增多。',
    },
    {
      id: 2,
      name: '观测教团',
      blurb: '智者共同仰望天空。',
      worldNote: '天文台脚手架与信火出现。',
    },
    {
      id: 3,
      name: '恒纪元盟约',
      blurb: '希望在灾厄之间被种下。',
      worldNote: '林径与营火苏醒。',
    },
    {
      id: 4,
      name: '统一循环',
      blurb: '道路连接坑、台与林。',
      worldNote: '路石与灯笼标出活地图。',
    },
  ],
};

export function getStageCopy(locale: Locale, stage: number): StageCopy {
  const list = STAGES[locale];
  return list[Math.min(Math.max(stage, 0), list.length - 1)]!;
}

export function epilogueStageMessage(
  locale: Locale,
  cycleNumber: number,
  stage: number,
  nextStage: number | null,
): string {
  const current = getStageCopy(locale, stage);
  if (nextStage === null || nextStage <= stage) {
    return locale === 'zh'
      ? `文明 #${cycleNumber} 完成了「${current.name}」的纪录。世界仍记住 ${current.worldNote}`
      : `Civilization #${cycleNumber} closed the ${current.name} record. The world remembers: ${current.worldNote}`;
  }
  const next = getStageCopy(locale, nextStage);
  return locale === 'zh'
    ? `下一循环（#${cycleNumber + 1}）将进入「${next.name}」——${next.worldNote}`
    : `Next cycle (#${cycleNumber + 1}) enters ${next.name} — ${next.worldNote}`;
}
