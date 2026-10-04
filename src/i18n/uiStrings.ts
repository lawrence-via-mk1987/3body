import type { Locale } from './locale';
import { pickLocale } from './pick';

export interface MobileChromeCopy {
  controlsHint: string;
  lookHint: string;
  run: string;
  journal: string;
  pause: string;
  sky: string;
  silentNote: string;
}

const MOBILE: Record<Locale, MobileChromeCopy> = {
  en: {
    controlsHint: 'WASD move · mouse look · Shift sprint · E pit · F read · T talk · R drink · J journal · P pause',
    lookHint: 'Drag the right side to look',
    run: 'Run',
    journal: 'Journal',
    pause: 'Pause',
    sky: 'Sky',
    silentNote: 'Sound unlocks after you tap Play or Enable sound.',
  },
  zh: {
    controlsHint: 'WASD 移动 · 鼠标视角 · Shift 冲刺 · E 脱水 · F 阅读 · T 交谈 · R 饮水 · J 日志 · P 暂停',
    lookHint: '右侧拖动视角',
    run: '奔跑',
    journal: '日志',
    pause: '暂停',
    sky: '天空',
    silentNote: '点击开始或启用声音后解锁音频。',
  },
  ja: {
    controlsHint: 'WASD 移動 · マウス視点 · Shift 走る · E 脱水 · F 読む · T 会話 · R 水 · J 手記 · P 一時停止',
    lookHint: '右側をドラッグして視点',
    run: '走る',
    journal: '手記',
    pause: '一時停止',
    sky: '空',
    silentNote: 'プレイまたは「音を有効にする」をタップすると音声が使えます。',
  },
};

export function getMobileChromeCopy(locale: Locale): MobileChromeCopy {
  return pickLocale(locale, MOBILE, MOBILE.en);
}

/** Subtitle under 三体游戏 (title stays Chinese). */
export function getMenuTagline(locale: Locale): string {
  return pickLocale(
    locale,
    {
      en: 'Three suns, no fixed days—survive until the Stable Era.',
      zh: '三颗太阳，无恒纪元——活到下一个恒纪元。',
      ja: '三つの太陽、定まらぬ空——恒纪元まで生き延びよ。',
    },
    'Three suns, no fixed days—survive until the Stable Era.',
  );
}

export function dialogueCloseHint(locale: Locale): string {
  return pickLocale(locale, {
    en: 'Press Esc or Close to leave.',
    zh: '按 Esc 或关闭离开。',
    ja: 'Esc または閉じるで戻る。',
  }, 'Press Esc or Close to leave.');
}

export function storyContinueLabel(locale: Locale): string {
  return pickLocale(locale, {
    en: 'Continue',
    zh: '继续',
    ja: '続ける',
  }, 'Continue');
}

export function journalQuestHeading(locale: Locale): string {
  return pickLocale(locale, { en: 'This cycle', zh: '本循环目标', ja: 'このサイクル' }, 'This cycle');
}

export function journalLettersHeading(locale: Locale): string {
  return pickLocale(
    locale,
    { en: 'Letters from the prior sage', zh: '上一循环智者的信', ja: '前のサイクルの智者の手紙' },
    'Letters from the prior sage',
  );
}

export function journalEmptyLetters(locale: Locale): string {
  return pickLocale(
    locale,
    {
      en: 'Letters unlock as you survive and discover the wasteland.',
      zh: '旅程中会解锁信件。',
      ja: '生き延びて荒原を知ると手紙が解放される。',
    },
    'Letters unlock as you survive and discover the wasteland.',
  );
}

export function journalEmptyEra(locale: Locale): string {
  return pickLocale(
    locale,
    { en: 'No sky events recorded yet this cycle.', zh: '本循环尚无天空记录。', ja: 'このサイクルではまだ空の記録がない。' },
    'No sky events recorded yet this cycle.',
  );
}

export function journalEmptyLogs(locale: Locale): string {
  return pickLocale(
    locale,
    { en: 'No texts recovered yet. Press F at glowing markers.', zh: '尚未找回文字。在发光标记处按 F。', ja: 'まだ文字を取り戻していない。光る標で F。' },
    'No texts recovered yet. Press F at glowing markers.',
  );
}

export function mobileSheetCloseLabel(locale: Locale): string {
  return pickLocale(locale, { en: 'Close', zh: '关闭', ja: '閉じる' }, 'Close');
}

export function witnessSpeakerLabel(locale: Locale): string {
  return pickLocale(locale, { en: 'The Witness', zh: '见证者', ja: '見証者' }, 'The Witness');
}

/** Shown during the 3D orbit diagram in the opening cutscene. */
export function orbitDiagramCaption(locale: Locale): string {
  return pickLocale(
    locale,
    {
      en: 'No stable orbit — only passing epochs. Three suns and one world tug each other in three dimensions.',
      zh: '没有稳定轨道——只有短暂的纪元。三颗太阳与一颗世界在三维中相互牵引。',
      ja: '安定した軌道はない——通過する紀元だけ。三つの太陽と一つの世界が三次元で引き合う。',
    },
    'No stable orbit — only passing epochs. Three suns and one world tug each other in three dimensions.',
  );
}
