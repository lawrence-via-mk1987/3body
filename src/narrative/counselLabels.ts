import type { Locale } from '../i18n/locale';
import type { CounselSnapshot } from './CounselChoices';

export function formatCounselHudLine(locale: Locale, snapshot: CounselSnapshot): string | null {
  const parts: string[] = [];
  if (snapshot.registrar === 'survivors') {
    parts.push(
      locale === 'zh'
        ? '登记官：数幸存者 → 恒纪元略易'
        : locale === 'ja'
          ? '登録官：生存者を数える → 恒紀元やや易'
          : 'Registrar: count survivors → slightly easier Stable Eras',
    );
  } else if (snapshot.registrar === 'memorial') {
    parts.push(
      locale === 'zh'
        ? '登记官：记亡者 → 长乱后或得怜悯恒纪元'
        : locale === 'ja'
          ? '登録官：死者を記す → 長い乱後に憐れみの恒紀元'
          : 'Registrar: memorialize → pity Stable after long chaos',
    );
  }
  if (snapshot.predictor === 'numbers') {
    parts.push(
      locale === 'zh'
        ? '预测者：信数字 → 预报略准'
        : locale === 'ja'
          ? '予測者：数を信じる → 予報やや正確'
          : 'Predictor: trust numbers → forecast nudge',
    );
  } else if (snapshot.predictor === 'endurance') {
    parts.push(
      locale === 'zh'
        ? '预测者：信忍耐 → 长乱后或得怜悯恒纪元'
        : locale === 'ja'
          ? '予測者：忍耐を信じる → 長い乱後に憐れみの恒紀元'
          : 'Predictor: trust endurance → pity Stable sooner',
    );
  }
  if (snapshot.grove === 'hope') {
    parts.push(
      locale === 'zh'
        ? '守林人：植希望 → 结语偏绿'
        : locale === 'ja'
          ? '守林人：希望を植える → エピローグは緑'
          : 'Grove: plant hope → greener epilogue',
    );
  } else if (snapshot.grove === 'caution') {
    parts.push(
      locale === 'zh'
        ? '守林人：存谨慎 → 结语偏水与戒'
        : locale === 'ja'
          ? '守林人：慎重さ → エピローグは水と戒'
          : 'Grove: plant caution → water-wise epilogue',
    );
  }
  if (parts.length === 0) {
    return null;
  }
  const prefix =
    locale === 'zh' ? '文明咨询 · ' : locale === 'ja' ? '文明の助言 · ' : 'Civilization counsel · ';
  return prefix + parts.join(' · ');
}

export function formatCounselJournalHeading(locale: Locale): string {
  if (locale === 'zh') {
    return '文明咨询（影响天空与结语）';
  }
  if (locale === 'ja') {
    return '文明の助言（空とエピローグへ）';
  }
  return 'Civilization counsel (sky & epilogue)';
}
