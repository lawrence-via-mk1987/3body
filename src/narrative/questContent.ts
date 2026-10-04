import type { Locale } from '../i18n/locale';

export type QuestStepId =
  | 'find_waystone'
  | 'calibrate_predictor'
  | 'endure_chaos'
  | 'grove_stable'
  | 'read_final_log';

export interface QuestStepCopy {
  id: QuestStepId;
  title: string;
  detail: string;
}

const STEPS: Record<Locale, QuestStepCopy[]> = {
  en: [
    {
      id: 'find_waystone',
      title: 'Find the waystone',
      detail: 'Head east — glowing marker. Use Read when close.',
    },
    {
      id: 'calibrate_predictor',
      title: 'Calibrate the sky',
      detail: 'Southeast observatory — Talk to the Last Predictor.',
    },
    {
      id: 'endure_chaos',
      title: 'Endure the Chaotic Era',
      detail: 'Shelter, fold at the pit, or wait — until gold returns.',
    },
    {
      id: 'grove_stable',
      title: 'Use the Stable Era',
      detail: 'Southwest grove — Drink at the pool, read Stable tablets.',
    },
    {
      id: 'read_final_log',
      title: 'Read the Final Log',
      detail: 'Stable Era only — near the grove pool, glowing stone.',
    },
  ],
  zh: [
    {
      id: 'find_waystone',
      title: '找到路石',
      detail: '向东走——发光标记，靠近后阅读。',
    },
    {
      id: 'calibrate_predictor',
      title: '校准天空',
      detail: '东南天文台——与末代预测者交谈。',
    },
    {
      id: 'endure_chaos',
      title: '熬过乱纪元',
      detail: '找掩体、在坑边折叠，或等待金色天空。',
    },
    {
      id: 'grove_stable',
      title: '利用恒纪元',
      detail: '西南林——池边饮水，阅读恒纪元碑文。',
    },
    {
      id: 'read_final_log',
      title: '阅读最终日志',
      detail: '仅恒纪元——林边池旁的发光石碑。',
    },
  ],
  ja: [
    {
      id: 'find_waystone',
      title: '道標を探す',
      detail: '東へ——光るマーカー。近づいたら読む（F）。',
    },
    {
      id: 'calibrate_predictor',
      title: '空を合わせる',
      detail: '南東の天文台——末代の予測者と話す（T）。',
    },
    {
      id: 'endure_chaos',
      title: '乱紀元を耐える',
      detail: '掩蔽、穴で折りたたむ、または待つ——金色が戻るまで。',
    },
    {
      id: 'grove_stable',
      title: '恒紀元を使う',
      detail: '南西の林——池で水を飲み、恒紀元の碑を読む。',
    },
    {
      id: 'read_final_log',
      title: '最終ログを読む',
      detail: '恒紀元のみ——林の池そばの光る石碑。',
    },
  ],
};

const LOG_ACTION_HINTS: Record<Locale, Record<string, string>> = {
  en: {
    waystone:
      'Next: follow the compass to the observatory (southeast). Talk to the Last Predictor to calibrate your forecast.',
    observatory:
      'Next: calibrate with the Predictor (Talk). Then endure chaos — pit fold (Use) or cave shelter when the sky turns harsh.',
    shelter_ruin:
      'Next: nearby cave (-5, 10) cuts heat/cold. Mark it for the next red sky.',
    dehydration_rows:
      'Next: stand on the amber ring at the pit — Use to fold when heat or thirst spikes.',
    cave_refuge:
      'Next: when temperature turns lethal, stay inside this cave. Keep moving toward the observatory or pit as needed.',
    traveler_stone:
      'Next: northwest pit or southeast observatory — you choose order, but calibrate before trusting the sky.',
    grove_hope:
      'Next: find The Final Log downslope from the pool (Stable Era). Read it before chaos returns.',
    final_log:
      'Cycle complete — read the epilogue, then walk into the next civilization with what you learned.',
  },
  zh: {
    waystone: '下一步：沿罗盘前往东南天文台，与预测者交谈以校准预报。',
    observatory: '下一步：与预测者交谈完成校准，随后在乱纪元中掩体或坑边折叠。',
    shelter_ruin: '下一步：附近洞穴 (-5, 10) 可避热寒，记住位置。',
    dehydration_rows: '下一步：站在坑边琥珀环上——危急时用「使用」折叠。',
    cave_refuge: '下一步：温度致命时留在洞内，再前往天文台或脱水坑。',
    traveler_stone: '下一步：西北坑或东南台——建议先校准预报。',
    grove_hope: '下一步：恒纪元中在池边找最终日志。',
    final_log: '本循环完成——读完后进入下一文明。',
  },
  ja: {
    waystone:
      '次：コンパスに従い南東の天文台へ。末代の予測者と話し（T）、予報を合わせよ。',
    observatory:
      '次：予測者と合わせよ（T）。その後乱紀元を耐えよ——穴で折りたたむ（E）か、空が厳しいときは洞に避難。',
    shelter_ruin:
      '次：近くの洞（-5, 10）が熱と寒を和らげる。次の赤い空のために覚えておけ。',
    dehydration_rows:
      '次：穴の琥珀色の輪の上に立て——熱や渇きが尖るとき「使用」（E）で折りたため。',
    cave_refuge:
      '次：温度が致死になるときはこの洞の中にいろ。必要に応じて天文台か穴へ向かえ。',
    traveler_stone:
      '次：北西の穴か南東の天文台——順序は選べるが、空を信じる前に合わせよ。',
    grove_hope:
      '次：池の下流で最終ログを探せ（恒紀元）。乱紀元が戻る前に読め。',
    final_log:
      'サイクル完了——エピローグを読み、学んだことを携えて次の文明へ。',
  },
};

export function getQuestSteps(locale: Locale): QuestStepCopy[] {
  return STEPS[locale] ?? STEPS.en;
}

export function getLogActionHint(locale: Locale, logId: string): string | null {
  const table = LOG_ACTION_HINTS[locale] ?? LOG_ACTION_HINTS.en;
  return table[logId] ?? null;
}

export interface QuestProgressInput {
  hasWaystone: boolean;
  predictorCalibrated: boolean;
  enteredStableThisRun: boolean;
  hasGroveHope: boolean;
  hasFinalLog: boolean;
}

export function isQuestStepComplete(id: QuestStepId, input: QuestProgressInput): boolean {
  switch (id) {
    case 'find_waystone':
      return input.hasWaystone;
    case 'calibrate_predictor':
      return input.predictorCalibrated;
    case 'endure_chaos':
      return input.enteredStableThisRun;
    case 'grove_stable':
      return input.hasGroveHope || input.hasFinalLog;
    case 'read_final_log':
      return input.hasFinalLog;
    default:
      return false;
  }
}

export function getActiveQuestStep(
  locale: Locale,
  input: QuestProgressInput,
): QuestStepCopy | null {
  for (const step of getQuestSteps(locale)) {
    if (!isQuestStepComplete(step.id, input)) {
      return step;
    }
  }
  return null;
}

export function getQuestObjectiveLine(locale: Locale, input: QuestProgressInput): string {
  const active = getActiveQuestStep(locale, input);
  if (!active) {
    if (locale === 'zh') {
      return '章节：本循环目标已完成——再启或追求新的 counsel 结局';
    }
    if (locale === 'ja') {
      return '章：このサイクルの目標は完了——再開するか、counsel エンディングを追え';
    }
    return 'Chapter: Cycle goals complete — restart or chase counsel endings';
  }
  if (locale === 'zh') {
    return `章节：${active.title} — ${active.detail}`;
  }
  if (locale === 'ja') {
    return `章：${active.title} — ${active.detail}`;
  }
  return `Chapter: ${active.title} — ${active.detail}`;
}
