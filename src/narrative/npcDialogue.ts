import type { Locale } from '../i18n/locale';
import type { DialogueNode, DialogueTree } from './dialogueTypes';
import type { CounselSnapshot } from './CounselChoices';
import type { StoryBeatId } from './storyContent';
import {
  GROVE_KEEPER_DIALOGUE,
  GROVE_KEEPER_DIALOGUE_JA,
  GROVE_KEEPER_DIALOGUE_ZH,
} from './groveKeeperDialogue';
import {
  PIT_REGISTRAR_DIALOGUE,
  PIT_REGISTRAR_DIALOGUE_JA,
  PIT_REGISTRAR_DIALOGUE_ZH,
} from './pitRegistrarDialogue';
import {
  PREDICTOR_DIALOGUE,
  PREDICTOR_DIALOGUE_JA,
  PREDICTOR_DIALOGUE_ZH,
} from './predictorDialogue';
import type { PitRegistrarFlags } from './PitRegistrarState';

export interface NpcDialogueContext {
  locale: Locale;
  logCount: number;
  storyBeats: readonly StoryBeatId[];
  civilizationCycle: number;
  forecastCalibrated: boolean;
  pitFlags: Readonly<PitRegistrarFlags>;
  groveHopeHint: boolean;
  counsel: Readonly<CounselSnapshot>;
}

function hasBeat(ctx: NpcDialogueContext, id: StoryBeatId): boolean {
  return ctx.storyBeats.includes(id);
}

function appendParagraph(base: string, extra: string | null): string {
  if (!extra) {
    return base;
  }
  return `${base}\n\n${extra}`;
}

function registrarCallback(ctx: NpcDialogueContext): string | null {
  const parts: string[] = [];
  if (ctx.locale === 'zh') {
    parts.push(`登记员低声说：${ctx.civilizationCycle} 号文明仍在计数。`);
    if (hasBeat(ctx, 'letter_fold')) {
      parts.push('你读过智者关于折叠的信——这里的环记得你的脚步。');
    }
    if (ctx.logCount >= 3) {
      parts.push('三块碑文在你脑中连成线；登记员点头，仿佛早已读过。');
    }
    if (ctx.counsel.registrar === 'survivors') {
      parts.push('你曾选择计数生者——登记员把名册收得更紧。');
    } else if (ctx.counsel.registrar === 'memorial') {
      parts.push('你曾选择纪念死者——坑边多了几行新刻的笔划。');
    }
  } else if (ctx.locale === 'ja') {
    parts.push(`登録係が低く言う：文明 #${ctx.civilizationCycle} はまだ数えている。`);
    if (hasBeat(ctx, 'letter_fold')) {
      parts.push('折りたたむ手紙を読んだ——この輪は君の足跡を覚えている。');
    }
    if (ctx.logCount >= 3) {
      parts.push('三つの碑が頭の中で線を結ぶ。登録係はすでに知っていたかのようにうなずく。');
    }
    if (ctx.counsel.registrar === 'survivors') {
      parts.push('生者を数えるを選んだ——登録係は名簿をより強く握る。');
    } else if (ctx.counsel.registrar === 'memorial') {
      parts.push('死者を記すを選んだ——穴の縁に新しい刻みが増えた。');
    }
  } else {
    parts.push(`The Registrar murmurs: Civilization #${ctx.civilizationCycle} still keeps count.`);
    if (hasBeat(ctx, 'letter_fold')) {
      parts.push('You read the sage\'s letter on folding — the ring remembers your step.');
    }
    if (ctx.logCount >= 3) {
      parts.push('Three tablets echo in your mind; the Registrar nods as if they already knew.');
    }
    if (ctx.counsel.registrar === 'survivors') {
      parts.push('You chose to count survivors — the Registrar grips the ledger tighter.');
    } else if (ctx.counsel.registrar === 'memorial') {
      parts.push('You chose to memorial the dead — fresh scratches mark the pit rim.');
    }
  }
  return parts.join(' ');
}

function predictorCallback(ctx: NpcDialogueContext): string | null {
  if (ctx.locale === 'zh') {
    const parts: string[] = [];
    if (hasBeat(ctx, 'letter_predictor')) {
      parts.push('末代预测者看见你眼中有智者的信：「更窄的怀疑，仍是怀疑。」');
    }
    if (ctx.logCount >= 5) {
      parts.push('「五块碑文的警告相同——只是我们仍相信数字。」');
    }
    if (ctx.forecastCalibrated) {
      parts.push('表盘已对齐；他不再追问，只望天。');
    }
    if (ctx.counsel.predictor === 'endurance') {
      parts.push('你曾选择信脚程——他轻笑：「脚程也会耗尽。」');
    } else if (ctx.counsel.predictor === 'numbers') {
      parts.push('你曾选择信数字——他摇头：「数字也会说谎。」');
    }
    return parts.join(' ') || null;
  }

  if (ctx.locale === 'ja') {
    const parts: string[] = [];
    if (hasBeat(ctx, 'letter_predictor')) {
      parts.push('末代の予測者は君の目に賢者の手紙を見る：「より狭い疑いも、疑いだ。」');
    }
    if (ctx.logCount >= 5) {
      parts.push('「五つの碑、一つの警告——それでも数字を信じる。」');
    }
    if (ctx.forecastCalibrated) {
      parts.push('ダイヤルは合った。彼はもう問わず、ただ空を見る。');
    }
    if (ctx.counsel.predictor === 'endurance') {
      parts.push('足程を信じるを選んだ——彼はほとんど笑う：「足も尽きる。」');
    } else if (ctx.counsel.predictor === 'numbers') {
      parts.push('数字を信じるを選んだ——彼は首を振る：「数字も嘘をつく。」');
    }
    return parts.join(' ') || null;
  }

  const parts: string[] = [];
  if (hasBeat(ctx, 'letter_predictor')) {
    parts.push('The Predictor sees the sage\'s letter in your eyes: "Narrower doubt is still doubt."');
  }
  if (ctx.logCount >= 5) {
    parts.push('"Five tablets, one warning — and we still trust numbers."');
  }
  if (ctx.forecastCalibrated) {
    parts.push('The dials are aligned; he asks nothing more, only watches the sky.');
  }
  if (ctx.counsel.predictor === 'endurance') {
    parts.push('You chose to trust endurance — he almost smiles: "Feet tire too."');
  } else if (ctx.counsel.predictor === 'numbers') {
    parts.push('You chose to trust numbers — he shakes his head: "Numbers lie as well."');
  }
  return parts.join(' ') || null;
}

function groveCallback(ctx: NpcDialogueContext): string | null {
  if (ctx.locale === 'zh') {
    const parts: string[] = [];
    if (hasBeat(ctx, 'letter_grove_call') || hasBeat(ctx, 'letter_stable')) {
      parts.push('守林人指向池边：「智者叫你来读最后一块碑。」');
    }
    if (ctx.logCount >= 6) {
      parts.push('「六块文字——只差最终日志。」');
    }
    if (ctx.groveHopeHint) {
      parts.push('池边的光比上次更稳。');
    }
    if (ctx.counsel.grove === 'hope') {
      parts.push('你曾选择播种希望——新芽在恒纪元里微微颤动。');
    } else if (ctx.counsel.grove === 'caution') {
      parts.push('你曾选择播种谨慎——水窖被标记得更清楚。');
    }
    return parts.join(' ') || null;
  }

  if (ctx.locale === 'ja') {
    const parts: string[] = [];
    if (hasBeat(ctx, 'letter_grove_call') || hasBeat(ctx, 'letter_stable')) {
      parts.push('守り人は池を指す：「賢者が最後の碑を読みに来いと言った。」');
    }
    if (ctx.logCount >= 6) {
      parts.push('「六つの文字——残るは最終ログだけ。」');
    }
    if (ctx.groveHopeHint) {
      parts.push('池のきらめきが前より安定している。');
    }
    if (ctx.counsel.grove === 'hope') {
      parts.push('希望を植えるを選んだ——新芽が恒紀元の光の中でわずかに震える。');
    } else if (ctx.counsel.grove === 'caution') {
      parts.push('慎重さを植えるを選んだ——水の印が池そばによりはっきり刻まれた。');
    }
    return parts.join(' ') || null;
  }

  const parts: string[] = [];
  if (hasBeat(ctx, 'letter_grove_call') || hasBeat(ctx, 'letter_stable')) {
    parts.push('The Keeper points to the pool: "The sage sent you for the last tablet."');
  }
  if (ctx.logCount >= 6) {
    parts.push('"Six texts recovered — only the Final Log remains."');
  }
  if (ctx.groveHopeHint) {
    parts.push('The pool shimmer steadies, as if remembering you.');
  }
  if (ctx.counsel.grove === 'hope') {
    parts.push('You chose to plant hope — new shoots tremble in the Stable Era light.');
  } else if (ctx.counsel.grove === 'caution') {
    parts.push('You chose to plant caution — water marks are carved clearer by the pool.');
  }
  return parts.join(' ') || null;
}

function cloneNode(node: DialogueNode, bodyOverride?: string): DialogueNode {
  return {
    ...node,
    body: bodyOverride ?? node.body,
    choices: node.choices.map((choice) => ({ ...choice })),
  };
}

function moralRegistrarNode(ctx: NpcDialogueContext): DialogueNode {
  if (ctx.locale === 'zh') {
    return {
      id: 'moral_count',
      speaker: '登记员',
      body:
        '坑必须选择如何计数。生者延续故事；死者证明故事曾存在。'
        + '你的选择会被下一个乱纪元记住。',
      choices: [
        {
          id: 'survivors',
          label: '计数生者——让名册继续。',
          nextId: 'moral_done',
          sideEffect: 'counsel_registrar_survivors',
        },
        {
          id: 'memorial',
          label: '纪念死者——刻下他们的名字。',
          nextId: 'moral_done',
          sideEffect: 'counsel_registrar_memorial',
        },
      ],
    };
  }
  if (ctx.locale === 'ja') {
    return {
      id: 'moral_count',
      speaker: '大穴の登録係',
      body:
        '大穴はどう数えるか選ばなければならない。生者は物語を運び、死者は物語があったことを証明する。'
        + '君の選択は次の乱紀元まで残る。',
      choices: [
        {
          id: 'survivors',
          label: '生者を数える——名簿を続けよ。',
          nextId: 'moral_done',
          sideEffect: 'counsel_registrar_survivors',
        },
        {
          id: 'memorial',
          label: '死者を記す——名を刻め。',
          nextId: 'moral_done',
          sideEffect: 'counsel_registrar_memorial',
        },
      ],
    };
  }
  return {
    id: 'moral_count',
    speaker: 'Registrar of the Pit',
    body:
      'The pit must choose how to count. Survivors carry the story forward; '
      + 'the dead prove the story was real. Your choice will linger into the next Chaotic Era.',
    choices: [
      {
        id: 'survivors',
        label: 'Count survivors — keep the ledger alive.',
        nextId: 'moral_done',
        sideEffect: 'counsel_registrar_survivors',
      },
      {
        id: 'memorial',
        label: 'Memorialize the dead — carve their names.',
        nextId: 'moral_done',
        sideEffect: 'counsel_registrar_memorial',
      },
    ],
  };
}

function moralPredictorNode(ctx: NpcDialogueContext): DialogueNode {
  if (ctx.locale === 'zh') {
    return {
      id: 'moral_predict',
      speaker: '末代预测者',
      body: '若只能信一样：数字的锥，还是血肉能走到的距离？',
      choices: [
        {
          id: 'numbers',
          label: '信数字——把锥收窄。',
          nextId: 'moral_predict_done',
          sideEffect: 'counsel_predictor_numbers',
        },
        {
          id: 'endurance',
          label: '信脚程——在乱纪元里走下去。',
          nextId: 'moral_predict_done',
          sideEffect: 'counsel_predictor_endurance',
        },
      ],
    };
  }
  if (ctx.locale === 'ja') {
    return {
      id: 'moral_predict',
      speaker: '末代の予測者',
      body: '一つだけ信じられるなら：数字の錐か、血肉が歩ける距離か？',
      choices: [
        {
          id: 'numbers',
          label: '数字を信じる——錐を狭めよ。',
          nextId: 'moral_predict_done',
          sideEffect: 'counsel_predictor_numbers',
        },
        {
          id: 'endurance',
          label: '足程を信じる——乱紀元を歩き続けよ。',
          nextId: 'moral_predict_done',
          sideEffect: 'counsel_predictor_endurance',
        },
      ],
    };
  }
  return {
    id: 'moral_predict',
    speaker: 'Last Predictor',
    body: 'If you can trust only one thing: the cone of numbers, or how far flesh can walk?',
    choices: [
      {
        id: 'numbers',
        label: 'Trust numbers — narrow the cone.',
        nextId: 'moral_predict_done',
        sideEffect: 'counsel_predictor_numbers',
      },
      {
        id: 'endurance',
        label: 'Trust endurance — keep walking through chaos.',
        nextId: 'moral_predict_done',
        sideEffect: 'counsel_predictor_endurance',
      },
    ],
  };
}

function moralGroveNode(ctx: NpcDialogueContext): DialogueNode {
  if (ctx.locale === 'zh') {
    return {
      id: 'moral_grove',
      speaker: '守林人',
      body: '恒纪元太短，只能种一样：希望的象征，或谨慎的纪律。',
      choices: [
        {
          id: 'hope',
          label: '播种希望——让下一位看见绿。',
          nextId: 'moral_grove_done',
          sideEffect: 'counsel_grove_hope',
        },
        {
          id: 'caution',
          label: '播种谨慎——让下一位看见水。',
          nextId: 'moral_grove_done',
          sideEffect: 'counsel_grove_caution',
        },
      ],
    };
  }
  if (ctx.locale === 'ja') {
    return {
      id: 'moral_grove',
      speaker: '林の守り人',
      body: '恒紀元は短すぎて全部は植えられない——一つの種を選べ：希望か、慎重さか。',
      choices: [
        {
          id: 'hope',
          label: '希望を植える——次の旅人に緑を見せよ。',
          nextId: 'moral_grove_done',
          sideEffect: 'counsel_grove_hope',
        },
        {
          id: 'caution',
          label: '慎重さを植える——次の旅人に水を見せよ。',
          nextId: 'moral_grove_done',
          sideEffect: 'counsel_grove_caution',
        },
      ],
    };
  }
  return {
    id: 'moral_grove',
    speaker: 'Grove Keeper',
    body: 'The Stable Era is too short to plant everything — choose one seed: hope, or caution.',
    choices: [
      {
        id: 'hope',
        label: 'Plant hope — let the next traveler see green.',
        nextId: 'moral_grove_done',
        sideEffect: 'counsel_grove_hope',
      },
      {
        id: 'caution',
        label: 'Plant caution — let the next traveler see water.',
        nextId: 'moral_grove_done',
        sideEffect: 'counsel_grove_caution',
      },
    ],
  };
}

function pitRegistrarBase(locale: Locale): DialogueTree {
  if (locale === 'zh') {
    return PIT_REGISTRAR_DIALOGUE_ZH;
  }
  if (locale === 'ja') {
    return PIT_REGISTRAR_DIALOGUE_JA;
  }
  return PIT_REGISTRAR_DIALOGUE;
}

function predictorBase(locale: Locale): DialogueTree {
  if (locale === 'zh') {
    return PREDICTOR_DIALOGUE_ZH;
  }
  if (locale === 'ja') {
    return PREDICTOR_DIALOGUE_JA;
  }
  return PREDICTOR_DIALOGUE;
}

function groveBase(locale: Locale): DialogueTree {
  if (locale === 'zh') {
    return GROVE_KEEPER_DIALOGUE_ZH;
  }
  if (locale === 'ja') {
    return GROVE_KEEPER_DIALOGUE_JA;
  }
  return GROVE_KEEPER_DIALOGUE;
}

export function buildRegistrarDialogue(ctx: NpcDialogueContext): DialogueTree {
  const base = pitRegistrarBase(ctx.locale);
  const greet = cloneNode(
    base.greet,
    appendParagraph(base.greet.body, registrarCallback(ctx)),
  );

  if (ctx.counsel.registrar === null) {
    const moralLabel =
      ctx.locale === 'zh'
        ? '坑该如何计数？'
        : ctx.locale === 'ja'
          ? '大穴はどう数える？'
          : 'How should the pit count?';
    greet.choices = [
      ...greet.choices,
      { id: 'moral', label: moralLabel, nextId: 'moral_count' },
    ];
  }

  const moralDone: DialogueNode =
    ctx.locale === 'zh'
      ? {
        id: 'moral_done',
        speaker: '登记员',
        body: '计数已定。去活，或去折叠——但别忘记你刚才的选择。',
        choices: [{ id: 'back', label: '返回…', nextId: 'greet' }],
      }
      : ctx.locale === 'ja'
        ? {
          id: 'moral_done',
          speaker: '大穴の登録係',
          body: '数え方は決まった。生きるか、折りたたむか——だが選んだことを忘れるな。',
          choices: [{ id: 'back', label: '戻る…', nextId: 'greet' }],
        }
        : {
          id: 'moral_done',
          speaker: 'Registrar of the Pit',
          body: 'The count is set. Go live, or go fold — but do not forget what you chose.',
          choices: [{ id: 'back', label: 'Another question…', nextId: 'greet' }],
        };

  return {
    ...base,
    greet,
    moral_count: moralRegistrarNode(ctx),
    moral_done: moralDone,
  };
}

export function buildPredictorDialogue(ctx: NpcDialogueContext): DialogueTree {
  const base = predictorBase(ctx.locale);
  const greet = cloneNode(
    base.greet,
    appendParagraph(base.greet.body, predictorCallback(ctx)),
  );

  if (ctx.counsel.predictor === null) {
    const moralLabel =
      ctx.locale === 'zh'
        ? '我该信什么？'
        : ctx.locale === 'ja'
          ? '何を信じる？'
          : 'What should I trust?';
    greet.choices = [
      ...greet.choices,
      { id: 'moral', label: moralLabel, nextId: 'moral_predict' },
    ];
  }

  const moralDone: DialogueNode =
    ctx.locale === 'zh'
      ? {
        id: 'moral_predict_done',
        speaker: '末代预测者',
        body: '好。天空不会奖励诚实——但预报条也许会少骗你一点。',
        choices: [{ id: 'back', label: '返回…', nextId: 'greet' }],
      }
      : ctx.locale === 'ja'
        ? {
          id: 'moral_predict_done',
          speaker: '末代の予測者',
          body: 'よい。空は正直さを報いない——だが予報ストリップは少しだけ嘘をつかなくなるかもしれない。',
          choices: [{ id: 'back', label: '戻る…', nextId: 'greet' }],
        }
        : {
          id: 'moral_predict_done',
          speaker: 'Last Predictor',
          body: 'Good. The sky will not reward honesty — but the forecast strip may lie a little less.',
          choices: [{ id: 'back', label: 'Another question…', nextId: 'greet' }],
        };

  const already = cloneNode(
    base.already_calibrated,
    appendParagraph(base.already_calibrated.body, predictorCallback(ctx)),
  );

  return {
    ...base,
    greet,
    already_calibrated: already,
    moral_predict: moralPredictorNode(ctx),
    moral_predict_done: moralDone,
  };
}

export function buildGroveDialogue(ctx: NpcDialogueContext): DialogueTree {
  const base = groveBase(ctx.locale);
  const greet = cloneNode(
    base.greet,
    appendParagraph(base.greet.body, groveCallback(ctx)),
  );

  if (ctx.counsel.grove === null) {
    const moralLabel =
      ctx.locale === 'zh'
        ? '该种下什么？'
        : ctx.locale === 'ja'
          ? '何を植える？'
          : 'What should I plant?';
    greet.choices = [
      ...greet.choices,
      { id: 'moral', label: moralLabel, nextId: 'moral_grove' },
    ];
  }

  const moralDone: DialogueNode =
    ctx.locale === 'zh'
      ? {
        id: 'moral_grove_done',
        speaker: '守林人',
        body: '种子已埋。恒纪元结束前，把它活成习惯。',
        choices: [{ id: 'back', label: '返回…', nextId: 'greet' }],
      }
      : ctx.locale === 'ja'
        ? {
          id: 'moral_grove_done',
          speaker: '林の守り人',
          body: '種は埋めた。紀元が終わる前に、それを習慣にせよ。',
          choices: [{ id: 'back', label: '戻る…', nextId: 'greet' }],
        }
        : {
          id: 'moral_grove_done',
          speaker: 'Grove Keeper',
          body: 'The seed is buried. Before the Era ends, turn it into habit.',
          choices: [{ id: 'back', label: 'Another question…', nextId: 'greet' }],
        };

  return {
    ...base,
    greet,
    moral_grove: moralGroveNode(ctx),
    moral_grove_done: moralDone,
  };
}
