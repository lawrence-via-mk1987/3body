import { PHASE_LABELS, type EraPhase } from '../orbital/types';
import type { DialogueNode, DialogueTree } from './dialogueTypes';

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

export function buildPredictorCalibrationNode(currentPhase: EraPhase): DialogueNode {
  const options = shuffle([
    currentPhase,
    ...CALIBRATION_DISTRACTORS.filter((phase) => phase !== currentPhase),
  ]).slice(0, 4);

  return {
    id: 'calibrate',
    speaker: 'Last Predictor',
    body:
      'The observatory sang three notes and fell silent. Help me align one dial — '
      + 'read the sky as it is now, not as we wish it. Which phase burns above us?',
    choices: options.map((phase) => ({
      id: `pick_${phase}`,
      label: PHASE_LABELS[phase],
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
