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

export const PIT_REGISTRAR_DIALOGUE_ZH: DialogueTree = {
  greet: {
    id: 'greet',
    speaker: '登记员',
    body:
      '你身上是开阔天空的味道。好——说明你还未折叠。'
      + '我数着选择等待的人。石碑用 F 阅读。'
      + '脚下环带用 E 脱水——绝不要站在石上。',
    choices: [
      { id: 'flying', label: '飞星来时如何活？', nextId: 'flying_star' },
      { id: 'fold', label: '我该与行列一同折叠吗？', nextId: 'fold_rows', sideEffect: 'fold_lesson' },
      { id: 'bye', label: '我会忍耐。', nextId: 'farewell', sideEffect: 'mark_spoke' },
    ],
  },
  flying_star: {
    id: 'flying_star',
    speaker: '登记员',
    body:
      '当地平线变红、一颗太阳吞没天空，地表之死来得很快。'
      + '站在环带上按 E，让身体变成羊皮纸。折叠时你无法行动——'
      + '但热无法夺走已无水可沸之物。预报缓和后再醒来。',
    choices: [
      { id: 'back', label: '再问一事…', nextId: 'greet' },
      { id: 'bye2', label: '多谢。', nextId: 'farewell', sideEffect: 'mark_spoke' },
    ],
  },
  fold_rows: {
    id: 'fold_rows',
    speaker: '登记员',
    body:
      '行列不是命令——是记忆。文明一同折叠，便无人必须看别人燃烧。'
      + '若水分将尽且坑边信标呈琥珀色，加入环带是智慧，不是失败。',
    choices: [
      { id: 'back2', label: '再问一事…', nextId: 'greet' },
      { id: 'bye3', label: '我明白了。', nextId: 'farewell', sideEffect: 'mark_spoke' },
    ],
  },
  farewell: {
    id: 'farewell',
    speaker: '登记员',
    body: '去吧。太阳又在计数了。',
    choices: [],
  },
};

export const PIT_REGISTRAR_DIALOGUE_JA: DialogueTree = {
  greet: {
    id: 'greet',
    speaker: '大穴の登録係',
    body:
      '開いた空の匂いがする。よい——まだ展開しているということだ。'
      + '待つことを選んだ者の数を記している。石碑は F で読め。'
      + '足元の輪は E で脱水——決して石の上に立つな。',
    choices: [
      { id: 'flying', label: '飛星のときどう生き延びる？', nextId: 'flying_star' },
      { id: 'fold', label: '列と一緒に折りたたむべき？', nextId: 'fold_rows', sideEffect: 'fold_lesson' },
      { id: 'bye', label: '耐える。', nextId: 'farewell', sideEffect: 'mark_spoke' },
    ],
  },
  flying_star: {
    id: 'flying_star',
    speaker: '大穴の登録係',
    body:
      '地平線が赤く光り、一つの太陽が空を飲み込むとき、地表の死は速い。'
      + '輪の上に立ち E を押し、体を羊皮紙にせよ。折りたたみ中は動けない——'
      + 'しかし熱は、もはや沸騰する水のないものを奪えない。予報が和らぐまで眠れ。',
    choices: [
      { id: 'back', label: 'もう一つ…', nextId: 'greet' },
      { id: 'bye2', label: 'ありがとう。', nextId: 'farewell', sideEffect: 'mark_spoke' },
    ],
  },
  fold_rows: {
    id: 'fold_rows',
    speaker: '大穴の登録係',
    body:
      '列は命令ではない——記憶だ。文明は共に折りたたみ、誰も他者が燃えるのを見なくて済む。'
      + '水分が尽きかけ、穴のビーコンが琥珀色なら、輪に加わるのは知恵であり、敗北ではない。',
    choices: [
      { id: 'back2', label: 'もう一つ…', nextId: 'greet' },
      { id: 'bye3', label: '分かった。', nextId: 'farewell', sideEffect: 'mark_spoke' },
    ],
  },
  farewell: {
    id: 'farewell',
    speaker: '大穴の登録係',
    body: '行け。太陽がまた数え始めた。',
    choices: [],
  },
};
