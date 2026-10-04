import type { Locale } from '../i18n/locale';

export type StoryBeatId =
  | 'letter_witness'
  | 'letter_waystone'
  | 'letter_fold'
  | 'letter_stable'
  | 'letter_predictor'
  | 'letter_threads'
  | 'letter_grove_call'
  | 'letter_final'
  | 'letter_death';

export interface StoryBeatCopy {
  id: StoryBeatId;
  eyebrow: string;
  title: string;
  body: string;
  journalTitle: string;
}

const BEATS: Record<Locale, StoryBeatCopy[]> = {
  en: [
    {
      id: 'letter_witness',
      eyebrow: 'Letter I · prior cycle',
      title: 'To whoever unfolds next',
      body:
        'If you are reading this with lungs full of air, I am already folded or ash. '
        + 'I was a sage who stopped predicting and started listening. The sky is not evil — it is indifferent. '
        + 'Find the waystone east. Calibrate the broken observatory. Endure until gold returns. '
        + 'Leave a record for the cycle after yours.',
      journalTitle: 'Letter I — To whoever unfolds next',
    },
    {
      id: 'letter_waystone',
      eyebrow: 'Letter II · map',
      title: 'You found the waystone',
      body:
        'Good. The dead marked pit, grove, and dome so the living would not wander blind. '
        + 'Northwest pit for folding. Southeast observatory for truth you can tolerate. '
        + 'Southwest grove only wakes in a Stable Era. The story is not in one tablet — it is in the path between them.',
      journalTitle: 'Letter II — The waystone path',
    },
    {
      id: 'letter_fold',
      eyebrow: 'Letter III · pit',
      title: 'You chose to fold',
      body:
        'Dehydration is not surrender. It is refusing to feed the suns your boiling blood. '
        + 'I folded beside strangers who became parchment family. Wake when the forecast softens. '
        + 'If you never fold, you are brave — or you are lucky. Luck runs out on Trisolaris.',
      journalTitle: 'Letter III — On folding',
    },
    {
      id: 'letter_stable',
      eyebrow: 'Letter IV · 恒纪元',
      title: 'The sky forgives — briefly',
      body:
        'Stable Era. Your heart will lie and say it will last. It will not. '
        + 'Drink at the grove. Speak to the keeper. Read what requires gentle sun. '
        + 'I planted no trees — I planted the idea that someone else might see green. You are seeing it.',
      journalTitle: 'Letter IV — Stable Era',
    },
    {
      id: 'letter_predictor',
      eyebrow: 'Letter V · observatory',
      title: 'The dials hold — for now',
      body:
        'The Last Predictor and I disagreed: he thought numbers could tame three suns. '
        + 'We settled on narrower doubt. Use the forecast strip. It will still lie — but less boldly. '
        + 'When the horizon turns red, trust shelter over pride.',
      journalTitle: 'Letter V — Narrower doubt',
    },
    {
      id: 'letter_threads',
      eyebrow: 'Letter VI · memory',
      title: 'Threads of other cycles',
      body:
        'Three tablets recovered — and already a pattern: every civilization wrote the same warning in different hands. '
        + 'Heat. Thirst. Hope. You are not repeating their mistakes from ignorance — only from being alive under the same sky.',
      journalTitle: 'Letter VI — Threads',
    },
    {
      id: 'letter_grove_call',
      eyebrow: 'Letter VII · grove',
      title: 'Before the last tablet',
      body:
        'The Final Log is not hidden to punish you. It is hidden because only a Stable Era makes its words bearable. '
        + 'Find the pool shimmer. Find the keeper. Two tablets wake only now: the Grove hope and the Final Log. '
        + 'When you read it, carry one sentence into the next Chaotic Era.',
      journalTitle: 'Letter VII — Grove call',
    },
    {
      id: 'letter_final',
      eyebrow: 'Letter VIII · discipline',
      title: 'Hope carried forward',
      body:
        'You read the Final Log beneath a gentle sun. That is the whole victory of this cycle. '
        + 'The three-body sky will turn again. Store water. Mark the pit. Teach the next traveler to look up — and away when the horizon glows red.',
      journalTitle: 'Letter VIII — Final Log read',
    },
    {
      id: 'letter_death',
      eyebrow: 'Letter · unfinished',
      title: 'This cycle ends unfolded',
      body:
        'The sky took this body, but not what you learned. Discovered texts and letters stay in your journal across cycles. '
        + 'Begin again. The Registrar still counts. The Predictor still waits. The grove still remembers green between catastrophes.',
      journalTitle: 'Letter — Cycle ended',
    },
  ],
  zh: [
    {
      id: 'letter_witness',
      eyebrow: '信 I · 上一循环',
      title: '致下一个展开者',
      body:
        '若你仍舒展地读着这些字，我或已折叠，或已成灰。我曾是智者，后来不再预测，只学会倾听。天空并非邪恶——只是冷漠。'
        + '向东找路石，校准破碎的天文台，忍耐至金色回归，并为再下一个循环留下记录。',
      journalTitle: '信 I — 致下一个展开者',
    },
    {
      id: 'letter_waystone',
      eyebrow: '信 II · 路',
      title: '你找到了路石',
      body:
        '好。死者标出坑、林与圆顶，免得生者盲走。西北坑可折叠，东南台可观天，西南林仅在恒纪元苏醒。'
        + '故事不在一块石碑上——而在它们之间的路上。',
      journalTitle: '信 II — 路石之径',
    },
    {
      id: 'letter_fold',
      eyebrow: '信 III · 坑',
      title: '你选择了折叠',
      body:
        '脱水不是投降，是拒绝把沸腾的血献给太阳。我在陌生人旁折叠，他们成了纸上的族亲。预报缓和时再醒来。'
        + '若从不折叠，你是勇敢——或幸运。在三体星上，幸运会用完。',
      journalTitle: '信 III — 论折叠',
    },
    {
      id: 'letter_stable',
      eyebrow: '信 IV · 恒纪元',
      title: '天空暂时仁慈',
      body:
        '恒纪元。心会欺骗你说它将持续——它不会。在林边饮水，与守林人交谈，读需要温和阳光的文字。'
        + '我未种树——我种下的是：也许有人再见绿色。',
      journalTitle: '信 IV — 恒纪元',
    },
    {
      id: 'letter_predictor',
      eyebrow: '信 V · 天文台',
      title: '表盘暂时稳住',
      body:
        '末代预测者与我争执：他信数字能驯服三颗太阳。我们折中为更窄的怀疑。看预报条——它仍说谎，但不再那么大胆。'
        + '地平线变红时，信掩体，别信骄傲。',
      journalTitle: '信 V — 更窄的怀疑',
    },
    {
      id: 'letter_threads',
      eyebrow: '信 VI · 记忆',
      title: '他循环的线',
      body:
        '已找回三块碑文——模式已现：每个文明用不同的手写下同一警告。热、渴、希望。'
        + '你不是因无知重复他们的错误——只因在同一片天空下活着。',
      journalTitle: '信 VI — 线索',
    },
    {
      id: 'letter_grove_call',
      eyebrow: '信 VII · 林',
      title: '最后一块碑之前',
      body:
        '最终日志并非为惩罚而藏——只因唯有恒纪元才读得下去。找池边微光，找守林人。'
        + '此刻仅两块碑苏醒：林中之希望与最终日志。读完后，把一句话带进下一个乱纪元。',
      journalTitle: '信 VII — 林之召唤',
    },
    {
      id: 'letter_final',
      eyebrow: '信 VIII · 纪律',
      title: '希望被携带',
      body:
        '你在温和阳光下读到了最终日志——这便是本循环的全部胜利。三体天空会再变。存水、标坑、'
        + '教下一位旅人抬头——并在地平线发红时懂得移开目光。',
      journalTitle: '信 VIII — 最终日志',
    },
    {
      id: 'letter_death',
      eyebrow: '信 · 未竟',
      title: '本循环在此展开中结束',
      body:
        '天空带走了这具身体，却带不走你所学。已发现的文字与信件留在日志中跨越循环。'
        + '再始。登记员仍在计数，预测者仍在等待，林仍记得灾厄之间的绿。',
      journalTitle: '信 — 循环终结',
    },
  ],
  ja: [
    {
      id: 'letter_witness',
      eyebrow: '手紙 I · 前のサイクル',
      title: '次に展開する者へ',
      body:
        '肺いっぱいに空気を吸いながらこれを読んでいるなら、私はすでに折りたたまれているか灰だ。'
        + '私は予測をやめ、聴くことを学んだ賢者だった。空は邪悪ではない——無関心だ。'
        + '東の道標を探せ。壊れた天文台を合わせよ。金色が戻るまで耐えよ。'
        + 'その次のサイクルのために記録を残せ。',
      journalTitle: '手紙 I — 次に展開する者へ',
    },
    {
      id: 'letter_waystone',
      eyebrow: '手紙 II · 地図',
      title: '道標を見つけた',
      body:
        'よい。死者は穴、林、ドームを標し、生者が盲目にさ迷わぬようにした。'
        + '北西の穴で折りたたむ。南東の天文台で耐えられる真実を。南西の林は恒紀元でのみ目を覚ます。'
        + '物語は一枚の碑にあるのではない——それらを結ぶ道にある。',
      journalTitle: '手紙 II — 道標の道',
    },
    {
      id: 'letter_fold',
      eyebrow: '手紙 III · 穴',
      title: '折りたたむを選んだ',
      body:
        '脱水は降伏ではない。太陽に沸騰する血を捧げないことだ。'
        + '私は見知らぬ者の傍で折りたたまれ、彼らは羊皮紙の家族になった。予報が和らぐまで眠れ。'
        + '一度も折りたたまないなら勇敢だ——あるいは運がいい。三体星では運は尽きる。',
      journalTitle: '手紙 III — 折りたたむことについて',
    },
    {
      id: 'letter_stable',
      eyebrow: '手紙 IV · 恒紀元',
      title: '空が一時許す',
      body:
        '恒紀元。心は続くと嘘をつく——続かない。'
        + '林で水を飲め。守り人と話せ。穏やかな太陽を要する文字を読め。'
        + '私は木を植えなかった——誰かが再び緑を見るかもしれないという考えを植えた。君はそれを見ている。',
      journalTitle: '手紙 IV — 恒紀元',
    },
    {
      id: 'letter_predictor',
      eyebrow: '手紙 V · 天文台',
      title: 'ダイヤルは——今のところ——保つ',
      body:
        '末代の予測者と私は争った。彼は数字が三つの太陽を飼いならすと信じた。'
        + '私たちはより狭い疑いで折り合った。予報ストリップを使え——まだ嘘をつくが、以前ほど大胆ではない。'
        + '地平線が赤くなるとき、誇りより掩蔽を信じよ。',
      journalTitle: '手紙 V — より狭い疑い',
    },
    {
      id: 'letter_threads',
      eyebrow: '手紙 VI · 記憶',
      title: '他サイクルの糸',
      body:
        '三つの碑を回収した——すでに型が見える。各文明が異なる手で同じ警告を書いた。'
        + '熱。渇き。希望。無知から彼らの過ちを繰り返しているのではない——同じ空の下で生きているだけだ。',
      journalTitle: '手紙 VI — 糸',
    },
    {
      id: 'letter_grove_call',
      eyebrow: '手紙 VII · 林',
      title: '最後の碑の前に',
      body:
        '最終ログは罰するために隠されているのではない。穏やかな太陽の下でしかその言葉に耐えられないからだ。'
        + '池のきらめきを探せ。守り人を探せ。今だけ二つの碑が目を覚ます：林の希望と最終ログ。'
        + '読んだら、一文を次の乱紀元へ運べ。',
      journalTitle: '手紙 VII — 林の呼び声',
    },
    {
      id: 'letter_final',
      eyebrow: '手紙 VIII · 規律',
      title: '希望を運び去る',
      body:
        '穏やかな太陽の下で最終ログを読んだ。それがこのサイクルの勝利のすべてだ。'
        + '三体の空は再び変わる。水を蓄えよ。穴を標せ。次の旅人に見上げることを教え——地平線が赤く光るときは目をそらすことを。',
      journalTitle: '手紙 VIII — 最終ログを読んだ',
    },
    {
      id: 'letter_death',
      eyebrow: '手紙 · 未完',
      title: 'このサイクルは展開したまま終わる',
      body:
        '空はこの体を奪ったが、学んだことまでは奪わない。発見した文字と手紙はサイクルを越えて手記に残る。'
        + '再び始めよ。登録係はまだ数え、予測者はまだ待ち、林は災厄のあいだの緑を覚えている。',
      journalTitle: '手紙 — サイクル終了',
    },
  ],
};

export interface StoryObjectiveContext {
  hasWaystone: boolean;
  predictorCalibrated: boolean;
  enteredStableThisRun: boolean;
  hasFinalLog: boolean;
  logCount: number;
}

export function getStoryBeat(locale: Locale, id: StoryBeatId): StoryBeatCopy | null {
  return BEATS[locale]?.find((beat) => beat.id === id) ?? BEATS.en.find((beat) => beat.id === id) ?? null;
}

export function witnessBeatForCycle(locale: Locale, cycle: number): StoryBeatCopy | null {
  const base = getStoryBeat(locale, 'letter_witness');
  if (!base) {
    return null;
  }
  if (locale === 'zh') {
    return {
      ...base,
      body:
        `你是文明 #${cycle} 的展开者。若你仍舒展地读着这些字，我或已折叠，或已成灰。`
        + '我曾是智者，后来不再预测，只学会倾听。天空并非邪恶——只是冷漠。'
        + '向东找路石，校准破碎的天文台，忍耐至金色回归，并为再下一个循环留下记录。',
    };
  }
  if (locale === 'ja') {
    return {
      ...base,
      body:
        `君は文明 #${cycle} として展開する。肺いっぱいに空気を吸いながらこれを読んでいるなら、私はすでに折りたたまれているか灰だ。`
        + '私は予測をやめ、聴くことを学んだ賢者だった。空は邪悪ではない——無関心だ。'
        + '東の道標を探せ。壊れた天文台を合わせよ。金色が戻るまで耐えよ。その次のサイクルのために記録を残せ。',
    };
  }
  return {
    ...base,
    body:
      `You unfold as Civilization #${cycle}. If you are reading this with lungs full of air, I am already folded or ash. `
      + 'I was a sage who stopped predicting and started listening. The sky is not evil — it is indifferent. '
      + 'Find the waystone east. Calibrate the broken observatory. Endure until gold returns. '
      + 'Leave a record for the cycle after yours.',
  };
}

export function getUnlockedBeats(locale: Locale, ids: readonly StoryBeatId[]): StoryBeatCopy[] {
  const beats = BEATS[locale] ?? BEATS.en;
  const map = new Map(beats.map((beat) => [beat.id, beat]));
  return ids.map((id) => map.get(id)).filter((beat): beat is StoryBeatCopy => Boolean(beat));
}

export function resolveStoryObjective(locale: Locale, ctx: StoryObjectiveContext): string {
  if (locale === 'zh') {
    if (!ctx.hasWaystone) {
      return '章节：向东找到路石（F 阅读）';
    }
    if (!ctx.predictorCalibrated) {
      return '章节：东南天文台校准预报（T 与预测者）';
    }
    if (!ctx.enteredStableThisRun) {
      return '章节：在乱纪元中忍耐，等待恒纪元';
    }
    if (!ctx.hasFinalLog) {
      return '章节：恒纪元中前往西南林，找到最终日志';
    }
    return '章节：你已读完最终日志——把希望带入下一循环';
  }

  if (locale === 'ja') {
    if (!ctx.hasWaystone) {
      return '章：東の道標を探す（F で読む）';
    }
    if (!ctx.predictorCalibrated) {
      return '章：南東の天文台で予報を合わせる（T — 予測者）';
    }
    if (!ctx.enteredStableThisRun) {
      return '章：乱紀元を耐え、恒紀元を待つ';
    }
    if (!ctx.hasFinalLog) {
      return '章：恒紀元に南西の林へ行き、最終ログを見つける';
    }
    return '章：最終ログを読んだ——希望を次のサイクルへ運べ';
  }

  if (!ctx.hasWaystone) {
    return 'Chapter: Find the waystone to the east (F to read)';
  }
  if (!ctx.predictorCalibrated) {
    return 'Chapter: Calibrate the forecast at the observatory (T — Predictor)';
  }
  if (!ctx.enteredStableThisRun) {
    return 'Chapter: Endure the Chaotic Era until gold returns';
  }
  if (!ctx.hasFinalLog) {
    return 'Chapter: In Stable Era, reach the grove and the Final Log';
  }
  return 'Chapter: Final Log read — carry hope into the next cycle';
}
