export type DialogueSideEffect =
  | 'fold_lesson'
  | 'mark_spoke'
  | 'predictor_calibrated'
  | 'predictor_mark_spoke'
  | 'grove_mark_spoke'
  | 'grove_hint_logged'
  | 'counsel_registrar_survivors'
  | 'counsel_registrar_memorial'
  | 'counsel_predictor_numbers'
  | 'counsel_predictor_endurance'
  | 'counsel_grove_hope'
  | 'counsel_grove_caution';

export interface DialogueChoice {
  id: string;
  label: string;
  nextId: string;
  sideEffect?: DialogueSideEffect;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  body: string;
  choices: DialogueChoice[];
}

export type DialogueTree = Record<string, DialogueNode>;
