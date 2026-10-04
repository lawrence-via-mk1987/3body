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

export const GROVE_KEEPER_DIALOGUE_ZH: DialogueTree = {
  greet: {
    id: 'greet',
    speaker: '守林人',
    body:
      '你展开得够久，看见了绿色。呼吸——但别信天空会一直仁慈。'
      + '池中有凝露；石碑上有先前循环的教训。',
    choices: [
      { id: 'water', label: '水在哪里？', nextId: 'water_hint' },
      { id: 'final', label: '最终日志在哪？', nextId: 'final_hint', sideEffect: 'grove_hint_logged' },
      { id: 'hope', label: '希望合理吗？', nextId: 'hope', sideEffect: 'grove_hint_logged' },
      { id: 'bye', label: '我会忍耐。', nextId: 'farewell', sideEffect: 'grove_mark_spoke' },
    ],
  },
  water_hint: {
    id: 'water_hint',
    speaker: '守林人',
    body:
      '跟着我脚边的微光环向池边——在我东南。站在蓝色光晕里按 R。'
      + '趁恒纪元饮水；裂缝很快会再次口渴。',
    choices: [
      { id: 'final2', label: '最终日志呢？', nextId: 'final_hint', sideEffect: 'grove_hint_logged' },
      { id: 'back', label: '再问一事…', nextId: 'greet' },
      { id: 'bye2', label: '多谢。', nextId: 'farewell', sideEffect: 'grove_mark_spoke' },
    ],
  },
  final_hint: {
    id: 'final_hint',
    speaker: '守林人',
    body:
      '两块碑只在温和阳光下苏醒：树林碑与最终日志——靠近时按 F。'
      + '最终石在池下坡几步，未读时会发光。',
    choices: [
      { id: 'water2', label: '再提醒我关于水。', nextId: 'water_hint' },
      { id: 'back2', label: '再问一事…', nextId: 'greet' },
      { id: 'bye3', label: '我去读它们。', nextId: 'farewell', sideEffect: 'grove_mark_spoke' },
    ],
  },
  hope: {
    id: 'hope',
    speaker: '守林人',
    body:
      '希望不是预测。是纪律——存水、标坑、为下一位旅人留下文字。'
      + '我们没有种下永久之物。我们种下的是：也许有人能再次看见绿色。你正站在其中。',
    choices: [
      { id: 'final3', label: '最终日志在哪？', nextId: 'final_hint', sideEffect: 'grove_hint_logged' },
      { id: 'bye4', label: '我明白了。', nextId: 'farewell', sideEffect: 'grove_mark_spoke' },
    ],
  },
  dormant: {
    id: 'dormant',
    speaker: '守林人',
    body: '乱纪元里树林沉睡——我只是赭尘中的一个形。等横幅说恒纪元再来。',
    choices: [],
  },
  farewell: {
    id: 'farewell',
    speaker: '守林人',
    body: '趁天空仁慈，屏住呼吸。',
    choices: [],
  },
};

export const GROVE_KEEPER_DIALOGUE_JA: DialogueTree = {
  greet: {
    id: 'greet',
    speaker: '林の守り人',
    body:
      '緑を見るほど長く展開した。息を——だが空が優しさを保つと信じるな。'
      + '池には凝露がある。石碑には先のサイクルの学びがある。',
    choices: [
      { id: 'water', label: '水はどこ？', nextId: 'water_hint' },
      { id: 'final', label: '最終ログはどこ？', nextId: 'final_hint', sideEffect: 'grove_hint_logged' },
      { id: 'hope', label: '希望は合理か？', nextId: 'hope', sideEffect: 'grove_hint_logged' },
      { id: 'bye', label: '耐える。', nextId: 'farewell', sideEffect: 'grove_mark_spoke' },
    ],
  },
  water_hint: {
    id: 'water_hint',
    speaker: '林の守り人',
    body:
      '足元のきらめく輪に従い池へ——私の南東。青い光の中に立ち R を押せ。'
      + '恒紀元が続くうちに飲め。すぐに再び亀裂が渇く。',
    choices: [
      { id: 'final2', label: '最終ログは？', nextId: 'final_hint', sideEffect: 'grove_hint_logged' },
      { id: 'back', label: 'もう一つ…', nextId: 'greet' },
      { id: 'bye2', label: 'ありがとう。', nextId: 'farewell', sideEffect: 'grove_mark_spoke' },
    ],
  },
  final_hint: {
    id: 'final_hint',
    speaker: '林の守り人',
    body:
      '二つの碑だけが穏やかな太陽の下で目を覚ます：林の碑と最終ログ——近づけば F で読める。'
      + '最後の石は池の下流数歩、未読なら光る。',
    choices: [
      { id: 'water2', label: '水について思い出させて。', nextId: 'water_hint' },
      { id: 'back2', label: 'もう一つ…', nextId: 'greet' },
      { id: 'bye3', label: '読みに行く。', nextId: 'farewell', sideEffect: 'grove_mark_spoke' },
    ],
  },
  hope: {
    id: 'hope',
    speaker: '林の守り人',
    body:
      '希望は予測ではない。規律だ——水を蓄え、穴を標し、次の旅人に言葉を残せ。'
      + '永久のものは植えなかった。誰かが再び緑を見るかもしれない、という考えを植えた。君はその中に立っている。',
    choices: [
      { id: 'final3', label: '最終ログはどこ？', nextId: 'final_hint', sideEffect: 'grove_hint_logged' },
      { id: 'bye4', label: '分かった。', nextId: 'farewell', sideEffect: 'grove_mark_spoke' },
    ],
  },
  dormant: {
    id: 'dormant',
    speaker: '林の守り人',
    body: '乱紀元では林は眠る——私は赭色の塵の中の形にすぎない。バナーが恒紀元と言うまで戻れ。',
    choices: [],
  },
  farewell: {
    id: 'farewell',
    speaker: '林の守り人',
    body: '空が優しいうちに息を止めよ。',
    choices: [],
  },
};
