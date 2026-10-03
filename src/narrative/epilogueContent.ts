import type { Locale } from '../i18n/locale';
import type { CounselSnapshot } from './CounselChoices';

export function buildEpilogueBody(locale: Locale, counsel: Readonly<CounselSnapshot>, cycle: number): string {
  if (locale === 'zh') {
    const base =
      `你在文明 #${cycle} 的温和阳光下读到了最终日志。`
      + '三体天空会再变——但希望不是预测，是带入下一乱纪元的纪律。';
    if (counsel.grove === 'hope') {
      return `${base} 你曾播种希望：让下一位旅人记得，绿可以在灾厄之间返回。`;
    }
    if (counsel.grove === 'caution') {
      return `${base} 你曾播种谨慎：存水、标坑、在红线升起前学会折叠。`;
    }
    return `${base} 存水、标坑、为下一位在发光标记处留下文字。`;
  }

  const base =
    `You read the Final Log beneath a gentle sun in Civilization #${cycle}. `
    + 'The three-body sky will turn again — hope is not a prediction, but discipline carried forward.';
  if (counsel.grove === 'hope') {
    return `${base} You planted hope: remind the next traveler that green can return between catastrophes.`;
  }
  if (counsel.grove === 'caution') {
    return `${base} You planted caution: store water, mark the pit, learn to fold before the horizon glows red.`;
  }
  return `${base} Store water, mark the pit, leave words at the glowing markers for whoever unfolds next.`;
}
