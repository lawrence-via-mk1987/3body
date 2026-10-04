import type { Locale } from './locale';

export interface LogCopy {
  title: string;
  body: string;
}

const ZH: Record<string, LogCopy> = {
  waystone: {
    title: '路石刻痕',
    body:
      '自上次恒纪元以来已是第四个循环。我们不再数太阳，开始数死者。地标：东——掩埋的掩体入口约在 (-2, 10)。西北——脱水大坑 (-42, 18)；在环带上用 F 读碑，用 E 脱水，勿站在石上。西南树林 (28, -32) 在恒纪元苏醒。东南山脊——破损的天文台穹顶。',
  },
  observatory: {
    title: '天文台碎片',
    body:
      '预测者唱了三声便沉寂。我们以为下一次乱纪元会像以往一样——若动作够快，尚可存活。飞星早来一日。我们的数字很美。我们的时机不是。',
  },
  shelter_ruin: {
    title: '坍塌掩体',
    body:
      '骨与泥编织的墙。一只孩子的碗仍端正立着。封门者盼望下一文明能在墙里找到水。我们留下碗。我们留下希望。',
  },
  dehydration_rows: {
    title: '大坑铭文',
    body:
      '一行又一行，身体像羊皮纸般折叠。我们告诉自己脱水不是死亡——是等待。问题是当太阳归来时，与之一同等待的是什么。',
  },
  cave_refuge: {
    title: '洞穴刻痕',
    body:
      '地表变成煎锅时我们向下挖。大地记住寒冷，比我们对仁慈的记忆更久。若天空变红，向下。若天空变黑，更快向下。',
  },
  traveler_stone: {
    title: '旅者之石',
    body:
      '勿信一颗太阳。勿信三颗。信地面的裂缝——只有世界忘记燃烧时，它们才会积水。我要去大坑。也许无法再度展开。',
  },
  grove_hope: {
    title: '树林碑',
    body:
      '恒纪元不是和平。是灾厄之间屏住的一口气。我们没有种下永久之物。我们种下的是：也许有人能活得够久，再次看见绿色。你正站在其中。忍耐。',
  },
  final_log: {
    title: '最终日志',
    body:
      '若你在温和阳光下活得够久读到这些，我们的循环便没有白费。三体天空会再变。存水。标坑。教下一位旅人仰望——并在地平线变红时学会移开目光。希望不是预测。是纪律。',
  },
};

export function getLogCopy(
  logId: string,
  enTitle: string,
  enBody: string,
  locale: Locale,
): LogCopy {
  if (locale === 'zh') {
    const zh = ZH[logId];
    if (zh) {
      return zh;
    }
  }
  return { title: enTitle, body: enBody };
}
