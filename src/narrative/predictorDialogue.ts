import type { Locale } from '../i18n/locale';
import { PHASE_LABELS, type EraPhase } from '../orbital/types';
import type { DialogueNode, DialogueTree } from './dialogueTypes';

const PHASE_LABELS_ZH: Record<EraPhase, string> = {
  deep_cold: '深寒',
  thaw: '解冻',
  scorch: '酷热',
  binary_chaos: '双星混沌',
  tri_solar: '三体',
  flying_star: '飞星',
  eclipse_relief: '食暂息',
  stable_golden: '恒纪元',
};

export const PHASE_LABELS_JA: Record<EraPhase, string> = {
  deep_cold: '深寒',
  thaw: '解氷',
  scorch: '灼熱',
  binary_chaos: '双星混沌',
  tri_solar: '三体',
  flying_star: '飛星',
  eclipse_relief: '食の休息',
  stable_golden: '恒紀元',
};

const CALIBRATION_DISTRACTORS: EraPhase[] = [
  'deep_cold',
  'thaw',
  'scorch',
  'binary_chaos',
  'tri_solar',
  'flying_star',
  'eclipse_relief',
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function buildPredictorCalibrationNode(currentPhase: EraPhase, locale: Locale): DialogueNode {
  const options = shuffle([
    currentPhase,
    ...CALIBRATION_DISTRACTORS.filter((phase) => phase !== currentPhase),
  ]).slice(0, 4);

  const labels =
    locale === 'zh' ? PHASE_LABELS_ZH : locale === 'ja' ? PHASE_LABELS_JA : PHASE_LABELS;

  if (locale === 'ja') {
    return {
      id: 'calibrate',
      speaker: '末代の予測者',
      body:
        '天文台は三声歌い、沈黙した。ダイヤル一枚を合わせてくれ——'
        + '望む空ではなく、今の空を読め。頭上はどの位相だ？',
      choices: options.map((phase) => ({
        id: `pick_${phase}`,
        label: labels[phase],
        nextId: phase === currentPhase ? 'calibrate_success' : 'calibrate_fail',
        sideEffect: phase === currentPhase ? 'predictor_calibrated' : undefined,
      })),
    };
  }

  if (locale === 'zh') {
    return {
      id: 'calibrate',
      speaker: '末代预测者',
      body:
        '天文台唱了三声便沉寂。帮我拨准一枚表盘——'
        + '按天空此刻的样子读，不要按我们愿望的样子。上方是哪一相位？',
      choices: options.map((phase) => ({
        id: `pick_${phase}`,
        label: labels[phase],
        nextId: phase === currentPhase ? 'calibrate_success' : 'calibrate_fail',
        sideEffect: phase === currentPhase ? 'predictor_calibrated' : undefined,
      })),
    };
  }

  return {
    id: 'calibrate',
    speaker: 'Last Predictor',
    body:
      'The observatory sang three notes and fell silent. Help me align one dial — '
      + 'read the sky as it is now, not as we wish it. Which phase burns above us?',
    choices: options.map((phase) => ({
      id: `pick_${phase}`,
      label: labels[phase],
      nextId: phase === currentPhase ? 'calibrate_success' : 'calibrate_fail',
      sideEffect: phase === currentPhase ? 'predictor_calibrated' : undefined,
    })),
  };
}

export const PREDICTOR_DIALOGUE: DialogueTree = {
  greet: {
    id: 'greet',
    speaker: 'Last Predictor',
    body:
      'Another traveler. The machine predicted beauty and delivered ash. '
      + 'I can still narrow the uncertainty cone — once — if you read the sky honestly.',
    choices: [
      { id: 'cal', label: 'Align the broken dials.', nextId: 'calibrate_dynamic' },
      { id: 'why', label: 'Why did forecasting fail?', nextId: 'why_fail' },
      { id: 'bye', label: 'I must keep moving.', nextId: 'farewell', sideEffect: 'predictor_mark_spoke' },
    ],
  },
  why_fail: {
    id: 'why_fail',
    speaker: 'Last Predictor',
    body:
      'We treated the suns like clocks. They are arguments. Three voices never agreeing. '
      + 'Our numbers were elegant. The flying star arrived one day early anyway.',
    choices: [
      { id: 'cal2', label: 'Try calibration.', nextId: 'calibrate_dynamic' },
      { id: 'bye2', label: 'Farewell.', nextId: 'farewell', sideEffect: 'predictor_mark_spoke' },
    ],
  },
  calibrate_success: {
    id: 'calibrate_success',
    speaker: 'Last Predictor',
    body:
      'The dial holds. Your forecast strip will lie less boldly — not truth, but narrower doubt. '
      + 'Teach the next civilization to look up, and to doubt their own certainty.',
    choices: [
      { id: 'done', label: 'Thank you.', nextId: 'farewell', sideEffect: 'predictor_mark_spoke' },
    ],
  },
  calibrate_fail: {
    id: 'calibrate_fail',
    speaker: 'Last Predictor',
    body:
      'No — the sky is not what you guessed. Look at your HUD: Era, Phase, Outlook. '
      + 'Try again while the dials still turn.',
    choices: [
      { id: 'retry', label: 'Try again.', nextId: 'calibrate_dynamic' },
      { id: 'leave', label: 'Leave for now.', nextId: 'farewell' },
    ],
  },
  already_calibrated: {
    id: 'already_calibrated',
    speaker: 'Last Predictor',
    body:
      'The cone is as narrow as I can make it. The rest is chaos you must endure with water, shelter, and the pit.',
    choices: [
      { id: 'ok', label: 'I remember.', nextId: 'farewell' },
    ],
  },
  farewell: {
    id: 'farewell',
    speaker: 'Last Predictor',
    body: 'Go. The suns are counting again.',
    choices: [],
  },
};

export const PREDICTOR_DIALOGUE_ZH: DialogueTree = {
  greet: {
    id: 'greet',
    speaker: '末代预测者',
    body:
      '又一位旅人。机器预测了美，交付了灰。'
      + '我仍能把不确定锥收窄一次——若你诚实读天。',
    choices: [
      { id: 'cal', label: '拨准破碎的表盘。', nextId: 'calibrate_dynamic' },
      { id: 'why', label: '预报为何失败？', nextId: 'why_fail' },
      { id: 'bye', label: '我得继续走。', nextId: 'farewell', sideEffect: 'predictor_mark_spoke' },
    ],
  },
  why_fail: {
    id: 'why_fail',
    speaker: '末代预测者',
    body:
      '我们把太阳当钟表。它们是争论——三颗声音永不同意。'
      + '我们的数字很优雅。飞星仍早来一日。',
    choices: [
      { id: 'cal2', label: '试试校准。', nextId: 'calibrate_dynamic' },
      { id: 'bye2', label: '再会。', nextId: 'farewell', sideEffect: 'predictor_mark_spoke' },
    ],
  },
  calibrate_success: {
    id: 'calibrate_success',
    speaker: '末代预测者',
    body:
      '表盘稳住了。你的预报条会少撒谎一些——不是真理，是更窄的怀疑。'
      + '教下一文明仰望，也教他们怀疑自己的确信。',
    choices: [
      { id: 'done', label: '多谢。', nextId: 'farewell', sideEffect: 'predictor_mark_spoke' },
    ],
  },
  calibrate_fail: {
    id: 'calibrate_fail',
    speaker: '末代预测者',
    body:
      '不——天空不是你猜的那样。看你的界面：时代、相位、展望。'
      + '表盘还在转时再试。',
    choices: [
      { id: 'retry', label: '再试。', nextId: 'calibrate_dynamic' },
      { id: 'leave', label: '先离开。', nextId: 'farewell' },
    ],
  },
  already_calibrated: {
    id: 'already_calibrated',
    speaker: '末代预测者',
    body: '锥已尽我所能地窄。其余是你必须用水、掩体与大坑忍耐的混沌。',
    choices: [
      { id: 'ok', label: '我记得。', nextId: 'farewell' },
    ],
  },
  farewell: {
    id: 'farewell',
    speaker: '末代预测者',
    body: '去吧。太阳又在计数了。',
    choices: [],
  },
};

export const PREDICTOR_DIALOGUE_JA: DialogueTree = {
  greet: {
    id: 'greet',
    speaker: '末代の予測者',
    body:
      'また旅人か。機械は美を予測し、灰を届けた。'
      + '空を正直に読めば、不確かさの錐を一度だけ狭められる。',
    choices: [
      { id: 'cal', label: '壊れたダイヤルを合わせる。', nextId: 'calibrate_dynamic' },
      { id: 'why', label: '予測はなぜ失敗した？', nextId: 'why_fail' },
      { id: 'bye', label: '行かなければ。', nextId: 'farewell', sideEffect: 'predictor_mark_spoke' },
    ],
  },
  why_fail: {
    id: 'why_fail',
    speaker: '末代の予測者',
    body:
      '太陽を時計のように扱った。彼らは争いだ。三つの声が決して一致しない。'
      + '数字は優雅だった。それでも飛星は一日早く来た。',
    choices: [
      { id: 'cal2', label: '合わせを試す。', nextId: 'calibrate_dynamic' },
      { id: 'bye2', label: 'さらば。', nextId: 'farewell', sideEffect: 'predictor_mark_spoke' },
    ],
  },
  calibrate_success: {
    id: 'calibrate_success',
    speaker: '末代の予測者',
    body:
      'ダイヤルは保つ。予報ストリップは以前ほど大胆に嘘をつかない——真理ではないが、より狭い疑いだ。'
      + '次の文明に見上げること、そして自分の確信を疑うことを教えよ。',
    choices: [
      { id: 'done', label: 'ありがとう。', nextId: 'farewell', sideEffect: 'predictor_mark_spoke' },
    ],
  },
  calibrate_fail: {
    id: 'calibrate_fail',
    speaker: '末代の予測者',
    body:
      '違う——空は君の当てたものではない。HUD を見よ：時代、位相、見通し。'
      + 'ダイヤルがまだ回るうちにもう一度。',
    choices: [
      { id: 'retry', label: '再試行。', nextId: 'calibrate_dynamic' },
      { id: 'leave', label: '今は去る。', nextId: 'farewell' },
    ],
  },
  already_calibrated: {
    id: 'already_calibrated',
    speaker: '末代の予測者',
    body: '錐はこれ以上狭められない。残りは水、掩蔽、大穴で耐える混沌だ。',
    choices: [
      { id: 'ok', label: '覚えている。', nextId: 'farewell' },
    ],
  },
  farewell: {
    id: 'farewell',
    speaker: '末代の予測者',
    body: '行け。太陽がまた数え始めた。',
    choices: [],
  },
};
