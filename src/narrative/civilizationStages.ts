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
    {
      id: 5,
      name: 'Distant sky age',
      blurb: 'Sages name a fixed star — not ours — and wonder who watches back.',
      worldNote: 'The observatory pendulum slows; a new tablet speaks of other worlds.',
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
    {
      id: 5,
      name: '远天时代',
      blurb: '智者命名一颗不属于我们的固定星——并猜想谁在回望。',
      worldNote: '天文台摆趋缓；新碑述说他界。',
    },
  ],
  ja: [
    {
      id: 0,
      name: '部族の荒原',
      blurb: '散らばる廃墟——定住はまだない。',
      worldNote: '骨標と灰の輪だけ。',
    },
    {
      id: 1,
      name: '脱水の時代',
      blurb: '大穴が数えられる制度となる。',
      worldNote: '穴の足場と折りたたまれた列が増える。',
    },
    {
      id: 2,
      name: '観測教団',
      blurb: '賢者たちが共に空を見上げる。',
      worldNote: '天文台の足場と狼煙が現れる。',
    },
    {
      id: 3,
      name: '恒紀元の盟約',
      blurb: '災厄のあいだに希望が植えられる。',
      worldNote: '林の小径とキャンプの火が目を覚ます。',
    },
    {
      id: 4,
      name: '統一サイクル',
      blurb: '道が穴、ドーム、林を結ぶ。',
      worldNote: '道標と灯が生きた地図を示す。',
    },
    {
      id: 5,
      name: '遠天の時代',
      blurb: '賢者たちは我らの太陽ではない固定星に名を与え——誰が見返しているかを問う。',
      worldNote: '天文台の振り子は緩み、新しい碑が他界を語る。',
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
    if (locale === 'zh') {
      return `文明 #${cycleNumber} 完成了「${current.name}」的纪录。世界仍记住 ${current.worldNote}`;
    }
    if (locale === 'ja') {
      return `文明 #${cycleNumber} は「${current.name}」の記録を閉じた。世界は覚えている：${current.worldNote}`;
    }
    return `Civilization #${cycleNumber} closed the ${current.name} record. The world remembers: ${current.worldNote}`;
  }
  const next = getStageCopy(locale, nextStage);
  if (locale === 'zh') {
    return `下一循环（#${cycleNumber + 1}）将进入「${next.name}」——${next.worldNote}`;
  }
  if (locale === 'ja') {
    return `次のサイクル（#${cycleNumber + 1}）は「${next.name}」へ——${next.worldNote}`;
  }
  return `Next cycle (#${cycleNumber + 1}) enters ${next.name} — ${next.worldNote}`;
}
