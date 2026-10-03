import type { DialogueTree } from './dialogueTypes';

export const PIT_REGISTRAR_DIALOGUE: DialogueTree = {
  greet: {
    id: 'greet',
    speaker: 'Registrar of the Pit',
    body:
      'You smell of open sky. Good — that means you are still unfolded. '
      + 'I keep the count of those who chose to wait. The stone tablets are for reading with F. '
      + 'The ring beneath your feet is for dehydrating with E — never on the stone itself.',
    choices: [
      { id: 'flying', label: 'How do I survive a flying star?', nextId: 'flying_star' },
      { id: 'fold', label: 'Should I fold with the rows?', nextId: 'fold_rows', sideEffect: 'fold_lesson' },
      { id: 'bye', label: 'I will endure.', nextId: 'farewell', sideEffect: 'mark_spoke' },
    ],
  },
  flying_star: {
    id: 'flying_star',
    speaker: 'Registrar of the Pit',
    body:
      'When the horizon glows red and one sun swallows the sky, surface death comes quickly. '
      + 'Stand on the ring, press E, and let your body become parchment. You cannot act while folded — '
      + 'but heat cannot claim what has no water left to boil. Wake when the forecast softens.',
    choices: [
      { id: 'back', label: 'Another question…', nextId: 'greet' },
      { id: 'bye2', label: 'Thank you.', nextId: 'farewell', sideEffect: 'mark_spoke' },
    ],
  },
  fold_rows: {
    id: 'fold_rows',
    speaker: 'Registrar of the Pit',
    body:
      'The rows are not a command — they are a memory. Civilizations fold together so none must watch the others burn. '
      + 'If your hydration is failing and the pit beacon burns amber, joining the ring is wisdom, not defeat.',
    choices: [
      { id: 'back2', label: 'Another question…', nextId: 'greet' },
      { id: 'bye3', label: 'I understand.', nextId: 'farewell', sideEffect: 'mark_spoke' },
    ],
  },
  farewell: {
    id: 'farewell',
    speaker: 'Registrar of the Pit',
    body: 'Go. The suns are counting again.',
    choices: [],
  },
};
