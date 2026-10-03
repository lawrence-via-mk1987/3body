export type DialogueSideEffect =
  | 'fold_lesson'
  | 'mark_spoke'
  | 'predictor_calibrated'
  | 'predictor_mark_spoke'
  | 'grove_mark_spoke'
  | 'grove_hint_logged';

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
