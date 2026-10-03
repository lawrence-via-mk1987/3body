import type { DialogueTree } from './dialogueTypes';

export const GROVE_KEEPER_DIALOGUE: DialogueTree = {
  greet: {
    id: 'greet',
    speaker: 'Grove Keeper',
    body:
      'You unfolded long enough to see green. Breathe — but do not trust the sky to stay kind. '
      + 'The pool holds condensate; the tablets hold what prior cycles learned.',
    choices: [
      { id: 'water', label: 'Where is the water?', nextId: 'water_hint' },
      { id: 'final', label: 'Where is the Final Log?', nextId: 'final_hint', sideEffect: 'grove_hint_logged' },
      { id: 'hope', label: 'Is hope rational?', nextId: 'hope', sideEffect: 'grove_hint_logged' },
      { id: 'bye', label: 'I will endure.', nextId: 'farewell', sideEffect: 'grove_mark_spoke' },
    ],
  },
  water_hint: {
    id: 'water_hint',
    speaker: 'Grove Keeper',
    body:
      'Follow the shimmer ring around the pool — southeast of my feet. Stand in the blue glow and press R. '
      + 'Drink while the Stable Era lasts; the cracks will thirst again soon.',
    choices: [
      { id: 'final2', label: 'And the Final Log?', nextId: 'final_hint', sideEffect: 'grove_hint_logged' },
      { id: 'back', label: 'Another question…', nextId: 'greet' },
      { id: 'bye2', label: 'Thank you.', nextId: 'farewell', sideEffect: 'grove_mark_spoke' },
    ],
  },
  final_hint: {
    id: 'final_hint',
    speaker: 'Grove Keeper',
    body:
      'Two tablets wake only under gentle sun: the Grove Tablet and The Final Log — both marked with F when you stand close. '
      + 'The final stone lies a few steps downslope from the pool, glowing when unread.',
    choices: [
      { id: 'water2', label: 'Remind me about water.', nextId: 'water_hint' },
      { id: 'back2', label: 'Another question…', nextId: 'greet' },
      { id: 'bye3', label: 'I will read them.', nextId: 'farewell', sideEffect: 'grove_mark_spoke' },
    ],
  },
  hope: {
    id: 'hope',
    speaker: 'Grove Keeper',
    body:
      'Hope is not a prediction. It is a discipline — store water, mark the pit, leave words for the next traveler. '
      + 'We planted nothing permanent. We planted the idea that someone else might see green again. You are standing in it.',
    choices: [
      { id: 'final3', label: 'Where is the Final Log?', nextId: 'final_hint', sideEffect: 'grove_hint_logged' },
      { id: 'bye4', label: 'I understand.', nextId: 'farewell', sideEffect: 'grove_mark_spoke' },
    ],
  },
  dormant: {
    id: 'dormant',
    speaker: 'Grove Keeper',
    body:
      'The grove sleeps in Chaotic Eras — I am only a shape in ochre dust. Return when the banner says Stable Era.',
    choices: [],
  },
  farewell: {
    id: 'farewell',
    speaker: 'Grove Keeper',
    body: 'Hold your breath while the sky is kind.',
    choices: [],
  },
};
