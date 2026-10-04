import type { Locale } from './locale';
import { pickLocale } from './pick';

export type MenuCutsceneReplayId =
  | 'opening'
  | 'radio'
  | 'distant_sky'
  | 'exodus'
  | 'death';

export interface CinematicReplayUi {
  replayCutsceneLabel: string;
  replayCutscenePlay: string;
  options: Record<MenuCutsceneReplayId, string>;
  predictorRitualHint: string;
  predictorRitualLock: string;
  predictorRitualCancel: string;
  predictorRitualRotate: string;
  pendulumJournalHint: string;
  pendulumToastHint: string;
}

const COPY: Record<Locale, CinematicReplayUi> = {
  en: {
    replayCutsceneLabel: 'Replay story beat',
    replayCutscenePlay: 'Play selected',
    options: {
      opening: 'Opening Witness intro',
      radio: 'Radio silence (远星)',
      distant_sky: 'Distant sky tablet',
      exodus: 'Exodus contact epilogue',
      death: 'Death cutscene (last reason)',
    },
    predictorRitualHint: 'Turn the bronze rings until they match the sky’s phase, then lock alignment.',
    predictorRitualLock: 'Lock alignment',
    predictorRitualCancel: 'Step back',
    predictorRitualRotate: 'Rotate ring',
    pendulumJournalHint: 'Observatory pendulum thrashes — chaos is not a clock; read the phase, not hope.',
    pendulumToastHint: 'The pendulum swings wild — the sky is in chaos.',
  },
  zh: {
    replayCutsceneLabel: '重播剧情片段',
    replayCutscenePlay: '播放所选',
    options: {
      opening: '开场见证者序',
      radio: '静噪电台（远星）',
      distant_sky: '远星石碑',
      exodus: '流亡接触结语',
      death: '死亡过场（上次原因）',
    },
    predictorRitualHint: '转动三环，使刻度与当下天相一致，然后锁定。',
    predictorRitualLock: '锁定',
    predictorRitualCancel: '退后',
    predictorRitualRotate: '旋转环',
    pendulumJournalHint: '天文台摆锤狂摆——乱纪元不是钟表；读相位，不读愿望。',
    pendulumToastHint: '摆锤剧烈摆动——天空处于混沌。',
  },
  ja: {
    replayCutsceneLabel: 'ストーリーを再生',
    replayCutscenePlay: '選択を再生',
    options: {
      opening: 'オープニング（証人）',
      radio: '静噪電波（遠星）',
      distant_sky: '遠星の碑',
      exodus: 'エクソダス接触',
      death: '死亡カット（前回の理由）',
    },
    predictorRitualHint: '青銅の輪を今の位相に合わせ、固定する。',
    predictorRitualLock: '固定',
    predictorRitualCancel: '離れる',
    predictorRitualRotate: '輪を回す',
    pendulumJournalHint: '天文台の振り子が激しく——混沌は時計ではない。位相を読め。',
    pendulumToastHint: '振り子が荒れている——空は混沌だ。',
  },
};

export function getCinematicReplayUi(locale: Locale): CinematicReplayUi {
  return pickLocale(locale, COPY, COPY.en);
}
