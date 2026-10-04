import type { Locale } from '../i18n/locale';
import type { DialogueNode, DialogueTree } from './dialogueTypes';
import type { CounselSnapshot } from './CounselChoices';
import type { StoryBeatId } from './storyContent';
import { GROVE_KEEPER_DIALOGUE, GROVE_KEEPER_DIALOGUE_ZH } from './groveKeeperDialogue';
import { PIT_REGISTRAR_DIALOGUE, PIT_REGISTRAR_DIALOGUE_ZH } from './pitRegistrarDialogue';
import { PREDICTOR_DIALOGUE, PREDICTOR_DIALOGUE_ZH } from './predictorDialogue';
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

export function buildRegistrarDialogue(ctx: NpcDialogueContext): DialogueTree {
  const base = ctx.locale === 'zh' ? PIT_REGISTRAR_DIALOGUE_ZH : PIT_REGISTRAR_DIALOGUE;
  const greet = cloneNode(
    base.greet,
    appendParagraph(base.greet.body, registrarCallback(ctx)),
  );

  if (ctx.counsel.registrar === null) {
    const moralLabel = ctx.locale === 'zh' ? '坑该如何计数？' : 'How should the pit count?';
    greet.choices = [
      ...greet.choices,
      { id: 'moral', label: moralLabel, nextId: 'moral_count' },
    ];
  }

  const moralDone: DialogueNode = ctx.locale === 'zh'
    ? {
      id: 'moral_done',
      speaker: '登记员',
      body: '计数已定。去活，或去折叠——但别忘记你刚才的选择。',
      choices: [{ id: 'back', label: '返回…', nextId: 'greet' }],
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
  const base = ctx.locale === 'zh' ? PREDICTOR_DIALOGUE_ZH : PREDICTOR_DIALOGUE;
  const greet = cloneNode(
    base.greet,
    appendParagraph(base.greet.body, predictorCallback(ctx)),
  );

  if (ctx.counsel.predictor === null) {
    const moralLabel = ctx.locale === 'zh' ? '我该信什么？' : 'What should I trust?';
    greet.choices = [
      ...greet.choices,
      { id: 'moral', label: moralLabel, nextId: 'moral_predict' },
    ];
  }

  const moralDone: DialogueNode = ctx.locale === 'zh'
    ? {
      id: 'moral_predict_done',
      speaker: '末代预测者',
      body: '好。天空不会奖励诚实——但预报条也许会少骗你一点。',
      choices: [{ id: 'back', label: '返回…', nextId: 'greet' }],
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
  const base = ctx.locale === 'zh' ? GROVE_KEEPER_DIALOGUE_ZH : GROVE_KEEPER_DIALOGUE;
  const greet = cloneNode(
    base.greet,
    appendParagraph(base.greet.body, groveCallback(ctx)),
  );

  if (ctx.counsel.grove === null) {
    const moralLabel = ctx.locale === 'zh' ? '该种下什么？' : 'What should I plant?';
    greet.choices = [
      ...greet.choices,
      { id: 'moral', label: moralLabel, nextId: 'moral_grove' },
    ];
  }

  const moralDone: DialogueNode = ctx.locale === 'zh'
    ? {
      id: 'moral_grove_done',
      speaker: '守林人',
      body: '种子已埋。恒纪元结束前，把它活成习惯。',
      choices: [{ id: 'back', label: '返回…', nextId: 'greet' }],
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
