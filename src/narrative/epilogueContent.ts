import type { Locale } from '../i18n/locale';
import type { CounselSnapshot } from './CounselChoices';
import { epilogueStageMessage, getStageCopy } from './civilizationStages';

export function buildEpilogueBody(
  locale: Locale,
  counsel: Readonly<CounselSnapshot>,
  cycle: number,
  worldStage: number,
  stageAfterClear: number,
): string {
  if (locale === 'zh') {
    const base =
      `你在文明 #${cycle} 的温和阳光下读到了最终日志。`
      + '三体天空会再变——但希望不是预测，是带入下一乱纪元的纪律。';
    let tail = `${base} 存水、标坑、为下一位在发光标记处留下文字。`;
    if (counsel.grove === 'hope') {
      tail = `${base} 你曾播种希望：让下一位旅人记得，绿可以在灾厄之间返回。`;
    } else if (counsel.grove === 'caution') {
      tail = `${base} 你曾播种谨慎：存水、标坑、在红线升起前学会折叠。`;
    }
    return `${tail}\n\n${tierParagraph(locale, worldStage, cycle, stageAfterClear)}`;
  }

  const base =
    `You read the Final Log beneath a gentle sun in Civilization #${cycle}. `
    + 'The three-body sky will turn again — hope is not a prediction, but discipline carried forward.';
  let tail = `${base} Store water, mark the pit, leave words at the glowing markers for whoever unfolds next.`;
  if (counsel.grove === 'hope') {
    tail = `${base} You planted hope: remind the next traveler that green can return between catastrophes.`;
  } else if (counsel.grove === 'caution') {
    tail = `${base} You planted caution: store water, mark the pit, learn to fold before the horizon glows red.`;
  }
  return `${tail}\n\n${tierParagraph(locale, worldStage, cycle, stageAfterClear)}`;
}

function tierParagraph(
  locale: Locale,
  worldStage: number,
  cycle: number,
  stageAfterClear: number,
): string {
  const current = getStageCopy(locale, worldStage);
  const unlockedTier = stageAfterClear > worldStage ? stageAfterClear : null;
  const transition = epilogueStageMessage(locale, cycle, worldStage, unlockedTier);
  if (locale === 'zh') {
    return `本循环时代：「${current.name}」。${transition}`;
  }
  return `This cycle's age: ${current.name}. ${transition}`;
}
