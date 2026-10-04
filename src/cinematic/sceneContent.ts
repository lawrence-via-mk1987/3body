import type { Locale } from '../i18n/locale';
import type { EraPhase } from '../orbital/types';
import type { DeathReason } from '../survival/SurvivalSystem';
import type { NpcPosture } from '../world/HumanoidNpc';

export type CutsceneCameraMode = 'witness' | 'sky' | 'orbit';

export interface CutsceneBeat {
  phase: EraPhase;
  duration: number;
  subtitle: string;
  posture: NpcPosture;
  /** Camera framing; opening scene uses orbit + sky. */
  camera?: CutsceneCameraMode;
  /** Normalized 0–1 keys within the beat; phases crossfade for era storytelling. */
  phaseKeyframes?: { at: number; phase: EraPhase }[];
  /** Three-body diagram motion (opening only). */
  orbitMode?: 'chaos' | 'stable' | 'blend';
}

function openingChaosKeyframes(): CutsceneBeat['phaseKeyframes'] {
  return [
    { at: 0, phase: 'binary_chaos' },
    { at: 0.32, phase: 'tri_solar' },
    { at: 0.58, phase: 'flying_star' },
    { at: 0.82, phase: 'scorch' },
  ];
}

function openingStableBlendKeyframes(): CutsceneBeat['phaseKeyframes'] {
  return [
    { at: 0, phase: 'flying_star' },
    { at: 0.45, phase: 'eclipse_relief' },
    { at: 0.75, phase: 'stable_golden' },
    { at: 1, phase: 'stable_golden' },
  ];
}

function resolvePhaseAtKeyframe(
  keyframes: NonNullable<CutsceneBeat['phaseKeyframes']>,
  t: number,
): EraPhase {
  let phase = keyframes[0]!.phase;
  for (const key of keyframes) {
    if (t >= key.at) {
      phase = key.phase;
    }
  }
  return phase;
}

export function phaseForBeatProgress(beat: CutsceneBeat, elapsed: number): EraPhase {
  if (!beat.phaseKeyframes || beat.phaseKeyframes.length === 0) {
    return beat.phase;
  }
  const t = Math.min(1, Math.max(0, elapsed / beat.duration));
  return resolvePhaseAtKeyframe(beat.phaseKeyframes, t);
}

export function openingCutsceneBeats(locale: Locale): CutsceneBeat[] {
  if (locale === 'ja') {
    return [
      {
        phase: 'binary_chaos',
        duration: 14,
        posture: 'skyward',
        camera: 'orbit',
        phaseKeyframes: openingChaosKeyframes(),
        orbitMode: 'chaos',
        subtitle:
          '三体星に穏やかな朝はない。三つの太陽が引き合い、昼は約束を守らない。'
          + '君の文明は、空を見上げ、待つことを学んだ数多の文明の一つだ。',
      },
      {
        phase: 'flying_star',
        duration: 13,
        posture: 'upright',
        camera: 'sky',
        phaseKeyframes: [
          { at: 0, phase: 'flying_star' },
          { at: 0.5, phase: 'scorch' },
          { at: 1, phase: 'deep_cold' },
        ],
        orbitMode: 'chaos',
        subtitle:
          '乱紀元では空が人を殺す。人々は大穴に折りたたまれて待つ。待つことは生きることと同じではない。',
      },
      {
        phase: 'stable_golden',
        duration: 14,
        posture: 'tending',
        camera: 'orbit',
        phaseKeyframes: openingStableBlendKeyframes(),
        orbitMode: 'blend',
        subtitle:
          '時に空は燃えることを忘れる。それが恒紀元だ。終わる。そこから運び出すものこそ、意味のすべてだ。',
      },
      {
        phase: 'stable_golden',
        duration: 14,
        posture: 'upright',
        camera: 'witness',
        orbitMode: 'stable',
        subtitle:
          '君は次の試みだ。歩け。彼らが残した文字を読め。見上げよ——地平線が赤くなるときは目をそらすことを学べ。',
      },
    ];
  }
  if (locale === 'zh') {
    return [
      {
        phase: 'binary_chaos',
        duration: 14,
        posture: 'skyward',
        camera: 'orbit',
        phaseKeyframes: openingChaosKeyframes(),
        orbitMode: 'chaos',
        subtitle:
          '三体星没有温和的清晨。三颗太阳相互牵引，白昼从不守约。'
          + '你的文明是众多仰望天空、并学会等待的文明之一。',
      },
      {
        phase: 'flying_star',
        duration: 13,
        posture: 'upright',
        camera: 'sky',
        phaseKeyframes: [
          { at: 0, phase: 'flying_star' },
          { at: 0.5, phase: 'scorch' },
          { at: 1, phase: 'deep_cold' },
        ],
        orbitMode: 'chaos',
        subtitle:
          '乱纪元里，天空杀人。人们折入大坑等待。等待不等于活着。',
      },
      {
        phase: 'stable_golden',
        duration: 14,
        posture: 'tending',
        camera: 'orbit',
        phaseKeyframes: openingStableBlendKeyframes(),
        orbitMode: 'blend',
        subtitle:
          '有时天空忘记燃烧。那是恒纪元。它会结束。你带出去的东西，才是意义所在。',
      },
      {
        phase: 'stable_golden',
        duration: 14,
        posture: 'upright',
        camera: 'witness',
        orbitMode: 'stable',
        subtitle:
          '你是下一次尝试。行走。阅读他们留下的文字。仰望——并在地平线变红时学会移开目光。',
      },
    ];
  }
  return [
    {
      phase: 'binary_chaos',
      duration: 14,
      posture: 'skyward',
      camera: 'orbit',
      phaseKeyframes: openingChaosKeyframes(),
      orbitMode: 'chaos',
      subtitle:
        'Trisolaris has no gentle morning. Three suns pull, and the day does not keep its promise. '
        + 'Your civilization is one of many that looked up — and learned to wait.',
    },
    {
      phase: 'flying_star',
      duration: 13,
      posture: 'upright',
      camera: 'sky',
      phaseKeyframes: [
        { at: 0, phase: 'flying_star' },
        { at: 0.5, phase: 'scorch' },
        { at: 1, phase: 'deep_cold' },
      ],
      orbitMode: 'chaos',
      subtitle:
        'In a Chaotic Era the sky kills. People fold into the pit and wait. Waiting is not the same as living.',
    },
    {
      phase: 'stable_golden',
      duration: 14,
      posture: 'tending',
      camera: 'orbit',
      phaseKeyframes: openingStableBlendKeyframes(),
      orbitMode: 'blend',
      subtitle:
        'Sometimes the sky forgets to burn. That is a Stable Era. It ends. What you carry out of it is the whole point.',
    },
    {
      phase: 'stable_golden',
      duration: 14,
      posture: 'upright',
      camera: 'witness',
      orbitMode: 'stable',
      subtitle:
        'You are the next attempt. Walk. Read what they left. Look up — and look away when the horizon turns red.',
    },
  ];
}

export function deathCutsceneBeats(locale: Locale, reason: DeathReason): CutsceneBeat[] {
  const phase: EraPhase =
    reason === 'cold' ? 'deep_cold' : reason === 'thirst' ? 'scorch' : 'flying_star';
  const posture: NpcPosture = reason === 'cold' ? 'upright' : reason === 'thirst' ? 'tending' : 'upright';

  if (locale === 'ja') {
    const subtitle =
      reason === 'heat'
        ? '太陽がこの文明を奪った。数字は関係ない。空が先に来た。'
        : reason === 'cold'
          ? '次の夜明けより先に夜が来た。体はまだ朝を数えているうちに凍った。'
          : reason === 'thirst'
            ? '空より先に水が去った。文明は火より長くは空の瓶には耐えられない。'
            : 'このサイクルは止まった。荒原は次の文明のために場所を残している。';
    return [{ phase, duration: 11, posture, subtitle }];
  }

  if (locale === 'zh') {
    const subtitle =
      reason === 'heat'
        ? '太阳夺走了这一文明。数字无关紧要。天空先到。'
        : reason === 'cold'
          ? '黎明未来，夜先至。身体在仍指望早晨时冻住了。'
          : reason === 'thirst'
            ? '水比天空先离开。文明扛火的时间，长不过空罐。'
            : '这一循环停止了。荒原为下一文明留着位置。';
    return [{ phase, duration: 11, posture, subtitle }];
  }

  const subtitle =
    reason === 'heat'
      ? 'The suns took this civilization. The numbers did not matter. The sky arrived first.'
      : reason === 'cold'
        ? 'Night came before the next dawn. The body froze while it was still counting on morning.'
        : reason === 'thirst'
          ? 'The water left before the sky did. A civilization can survive fire longer than an empty jar.'
          : 'This cycle stopped. The wasteland keeps the place for the next one.';
  return [{ phase, duration: 11, posture, subtitle }];
}

export function victoryCutsceneBeats(locale: Locale, epilogueSpeech: string): CutsceneBeat[] {
  const parts = epilogueSpeech.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const body = parts[0] ?? epilogueSpeech;
  const tail = parts[1] ?? '';
  if (locale === 'zh') {
    return [
      {
        phase: 'stable_golden',
        duration: 12,
        posture: 'tending',
        subtitle: body,
      },
      ...(tail
        ? [{
          phase: 'stable_golden' as EraPhase,
          duration: 10,
          posture: 'upright' as NpcPosture,
          subtitle: tail,
        }]
        : []),
    ];
  }
  return [
    {
      phase: 'stable_golden',
      duration: 12,
      posture: 'tending',
      subtitle: body,
    },
    ...(tail
      ? [{
        phase: 'stable_golden' as EraPhase,
        duration: 10,
        posture: 'upright' as NpcPosture,
        subtitle: tail,
      }]
      : []),
  ];
}

/**
 * Short radio-style exchange (original copy, all locales). Themes: deep-space reply, silence, do not
 * respond again — not the TV drama script, names, or repeated “不要回答”.
 */
export function radioSilenceCutsceneBeats(locale: Locale): CutsceneBeat[] {
  if (locale === 'zh') {
    return [
      {
        phase: 'deep_cold',
        duration: 9,
        posture: 'upright',
        camera: 'witness',
        subtitle: '【监听·静噪】定向天线捕到不属于三日的脉动。译码器在恒纪元里一字一字吐出。',
      },
      {
        phase: 'eclipse_relief',
        duration: 10,
        posture: 'skyward',
        camera: 'sky',
        subtitle: '【译入·远星】“此界亦苦三体。若你方仍向深空呼喊——”',
      },
      {
        phase: 'deep_cold',
        duration: 11,
        posture: 'tending',
        camera: 'witness',
        subtitle: '【译入·远星】“请勿再次回应。回应即坐标。坐标会召来我们两界都无法收回的东西。”',
      },
      {
        phase: 'eclipse_relief',
        duration: 9,
        posture: 'upright',
        camera: 'witness',
        subtitle: '见证者：有人想救两个世界，有人想点燃两个世界。我只记下指令：此刻应静默。',
      },
      {
        phase: 'stable_golden',
        duration: 8,
        posture: 'skyward',
        camera: 'sky',
        subtitle: '【侧信道·残响】“……请勿……再次……” 然后只剩白噪声，像雪落在铁板上。',
      },
    ];
  }
  if (locale === 'ja') {
    return [
      {
        phase: 'deep_cold',
        duration: 9,
        posture: 'upright',
        camera: 'witness',
        subtitle: '【監聴·雑音】三つの太陽のものではない脈動。恒紀元の静けさの中、復号器が一語ずつ吐く。',
      },
      {
        phase: 'eclipse_relief',
        duration: 10,
        posture: 'skyward',
        camera: 'sky',
        subtitle: '【訳·遠星】「こちらの世界も三体の苦しみを知る。深空に叫び続けるなら——」',
      },
      {
        phase: 'deep_cold',
        duration: 11,
        posture: 'tending',
        camera: 'witness',
        subtitle: '【訳·遠星】「二度と応答するな。応答は座標。座標は両界が取り消せないものを呼ぶ。」',
      },
      {
        phase: 'eclipse_relief',
        duration: 9,
        posture: 'upright',
        camera: 'witness',
        subtitle: '証人：二つの世界を救う者も、燃やす者もいる。私は記録だけする：今は沈黙すべき時。',
      },
      {
        phase: 'stable_golden',
        duration: 8,
        posture: 'skyward',
        camera: 'sky',
        subtitle: '【側信道】「……二度と……応答……」 その後は白い雑音だけ。鉄板に雪が落ちるよう。',
      },
    ];
  }
  return [
    {
      phase: 'deep_cold',
      duration: 9,
      posture: 'upright',
      camera: 'witness',
      subtitle: '[Monitor — static] A pulse that does not belong to our three suns. In the calm, the decoder prints one word at a time.',
    },
    {
      phase: 'eclipse_relief',
      duration: 10,
      posture: 'skyward',
      camera: 'sky',
      subtitle: '[Translation — distant star] “We too know the pain of three suns. If you still shout into the deep —”',
    },
    {
      phase: 'deep_cold',
      duration: 11,
      posture: 'tending',
      camera: 'witness',
      subtitle: '[Translation — distant star] “Do not answer again. An answer is a coordinate. Coordinates call what neither world can recall.”',
    },
    {
      phase: 'eclipse_relief',
      duration: 9,
      posture: 'upright',
      camera: 'witness',
      subtitle: 'Witness: some would save two worlds; some would burn them. I only record the order: silence, now.',
    },
    {
      phase: 'stable_golden',
      duration: 8,
      posture: 'skyward',
      camera: 'sky',
      subtitle: '[Side channel — echo] “…do not… again…” Then white noise, like snow on iron.',
    },
  ];
}

/** Witness + sky framing when the distant-sky tablet is read (original fan beat; not VR/drama). */
export function distantSkyCutsceneBeats(locale: Locale): CutsceneBeat[] {
  if (locale === 'zh') {
    return [
      {
        phase: 'stable_golden',
        duration: 11,
        posture: 'skyward',
        camera: 'sky',
        subtitle:
          '见证者：摆锤教我们的不是答案，是问题。在乱纪元里它狂舞；在恒纪元里它几乎静止——像屏住的一口气。',
      },
      {
        phase: 'eclipse_relief',
        duration: 10,
        posture: 'upright',
        camera: 'sky',
        subtitle:
          '见证者：星图上有第二片天空——固定、温和、不属于这三颗太阳。我们不写它的名字。我们只承认：那里也有世界，也许也有眼睛。',
      },
    ];
  }
  if (locale === 'ja') {
    return [
      {
        phase: 'stable_golden',
        duration: 11,
        posture: 'skyward',
        camera: 'sky',
        subtitle:
          '証人：振り子が教えるのは答えではなく問いだ。乱紀元では狂おしく振れ、恒紀元では息を止めたようにほとんど止まる。',
      },
      {
        phase: 'eclipse_relief',
        duration: 10,
        posture: 'upright',
        camera: 'sky',
        subtitle:
          '証人：星図に第二の空がある——固定し、穏やかで、我らの三つの太陽のものではない。名は書かない。そこにも世界があり、目があるかもしれないとだけ認める。',
      },
    ];
  }
  return [
    {
      phase: 'stable_golden',
      duration: 11,
      posture: 'skyward',
      camera: 'sky',
      subtitle:
        'Witness: the pendulum does not teach answers — only questions. In chaos it thrashes; in a Stable Era it barely moves, like a held breath.',
    },
    {
      phase: 'eclipse_relief',
      duration: 10,
      posture: 'upright',
      camera: 'sky',
      subtitle:
        'Witness: our charts hold a second sky — fixed, gentle, not owned by these three suns. We do not write its name. We admit only that it has a world, and perhaps eyes of its own.',
    },
  ];
}

/**
 * End-of-cycle homage to “contact / do not answer / exodus / probes” themes from the novels —
 * told from Trisolaris with the Witness, not recreated drama scenes or named characters.
 */
export function exodusContactCutsceneBeats(locale: Locale): CutsceneBeat[] {
  if (locale === 'zh') {
    return [
      {
        phase: 'eclipse_relief',
        duration: 12,
        posture: 'skyward',
        camera: 'sky',
        subtitle:
          '见证者：深空回传了第一行字——来自那颗苍白稳星上的声息。不是宣战，是恳求：不要再呼唤。沉默是唯一的慈悲。',
      },
      {
        phase: 'deep_cold',
        duration: 11,
        posture: 'upright',
        camera: 'witness',
        subtitle:
          '见证者：另一道声息更冷——“他们早已回答。”在我们仍与三日争辩时，决定已下：向彼方投种，也向此间回望。',
      },
      {
        phase: 'flying_star',
        duration: 13,
        posture: 'skyward',
        camera: 'sky',
        phaseKeyframes: [
          { at: 0, phase: 'flying_star' },
          { at: 0.55, phase: 'tri_solar' },
          { at: 1, phase: 'flying_star' },
        ],
        subtitle:
          '见证者：并非一艘船——是无数尘粒，被抛向那颗不属于我们的太阳。它们不问许可。它们只问时间。',
      },
      {
        phase: 'binary_chaos',
        duration: 12,
        posture: 'tending',
        camera: 'orbit',
        orbitMode: 'chaos',
        subtitle:
          '见证者：更小的眼已在“之间”睁开——比光更轻，比秘密更重。它们会量度你们的天空，直到三体与彼界再无距离。',
      },
    ];
  }
  if (locale === 'ja') {
    return [
      {
        phase: 'eclipse_relief',
        duration: 12,
        posture: 'skyward',
        camera: 'sky',
        subtitle:
          '証人：深空から最初の一行が返った——あの淡い固定星の声。宣戦ではなく懇請：もう呼びかけるな。沈黙だけが慈悲だ。',
      },
      {
        phase: 'deep_cold',
        duration: 11,
        posture: 'upright',
        camera: 'witness',
        subtitle:
          '証人：もう一つの声はより冷たい——「彼らはすでに答えた。」我らが三つの太陽と争う間に、彼方へ種を投げ、こちらを見返す決断は下されていた。',
      },
      {
        phase: 'flying_star',
        duration: 13,
        posture: 'skyward',
        camera: 'sky',
        phaseKeyframes: [
          { at: 0, phase: 'flying_star' },
          { at: 0.55, phase: 'tri_solar' },
          { at: 1, phase: 'flying_star' },
        ],
        subtitle:
          '証人：船一隻ではない——無数の塵が、我らの太陽ではない星へ投げられた。許可を求めない。時間だけを求める。',
      },
      {
        phase: 'binary_chaos',
        duration: 12,
        posture: 'tending',
        camera: 'orbit',
        orbitMode: 'chaos',
        subtitle:
          '証人：より小さな目が「あいだ」で開いた——光より軽く、秘密より重い。三体と彼界の距離がなくなるまで、あなた方の空を測り続ける。',
      },
    ];
  }
  return [
    {
      phase: 'eclipse_relief',
      duration: 12,
      posture: 'skyward',
      camera: 'sky',
      subtitle:
        'Witness: the deep returned its first line — a voice from the pale fixed star. Not a declaration of war, a plea: do not call again. Silence is the only mercy.',
    },
    {
      phase: 'deep_cold',
      duration: 11,
      posture: 'upright',
      camera: 'witness',
      subtitle:
        'Witness: a colder voice followed — “They already answered.” While we still argued with three suns, the decision was made: throw seed toward that world, and look back at our own.',
    },
    {
      phase: 'flying_star',
      duration: 13,
      posture: 'skyward',
      camera: 'sky',
      phaseKeyframes: [
        { at: 0, phase: 'flying_star' },
        { at: 0.55, phase: 'tri_solar' },
        { at: 1, phase: 'flying_star' },
      ],
      subtitle:
        'Witness: not one ship — countless motes cast toward the star that is not ours. They ask no permission. They ask only for time.',
    },
    {
      phase: 'binary_chaos',
      duration: 12,
      posture: 'tending',
      camera: 'orbit',
      orbitMode: 'chaos',
      subtitle:
        'Witness: smaller eyes have opened in the between — lighter than light, heavier than secrets. They will measure your sky until Trisolaris and that other world have no distance left.',
    },
  ];
}

export function distantSkyOmen(locale: Locale): string {
  if (locale === 'zh') {
    return '预兆：远方有一颗不随三日起舞的星——存水，并记住它。';
  }
  if (locale === 'ja') {
    return '前兆：三つの太陽と共に踊らない遠い星——水を蓄え、それを覚えよ。';
  }
  return 'Omen: a distant star does not dance with our three suns — store water, and remember it.';
}
