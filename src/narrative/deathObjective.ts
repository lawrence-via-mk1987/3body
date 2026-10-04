import type { Locale } from '../i18n/locale';

export function buildDeathObjective(
  locale: Locale,
  options: {
    hasFinalLog: boolean;
    forecastCalibrated: boolean;
    logsFound: number;
    logsTotal: number;
  },
): string {
  if (options.hasFinalLog) {
    if (locale === 'zh') {
      return '本循环找到了最终日志。已发现的文字会留在日志中跨越新循环——若愿意，可再走一次。';
    }
    if (locale === 'ja') {
      return 'このサイクルは最終ログを見つけた。発見した文字は新しいサイクルを越えて手記に残る——望むなら再び歩け。';
    }
    return 'This cycle found the Final Log. Discovered texts stay in your journal across new cycles — walk again if you wish.';
  }

  const parts: string[] = [];
  if (locale === 'zh') {
    parts.push('下一循环：沿琥珀信标至脱水大坑 (−42, 18)；恒纪元中绿色小径指向西南林 (28, −32) 与最终日志。');
  } else if (locale === 'ja') {
    parts.push(
      '次のサイクル：琥珀のビーコンを辿り脱水の大穴 (−42, 18) へ。恒紀元では緑の道が南西の林 (28, −32) と最終ログへ現れる。',
    );
  } else {
    parts.push(
      'Next cycle: follow amber beacons to the dehydration pit (−42, 18); green trails appear in Stable Era toward the grove (28, −32) and Final Log.',
    );
  }

  if (!options.forecastCalibrated) {
    if (locale === 'zh') {
      parts.push('前往东南天文台（末代预测者，T）以校准预报条。');
    } else if (locale === 'ja') {
      parts.push('南東の天文台（末代の予測者、T）で予報ストリップを研ぎ澄ませよ。');
    } else {
      parts.push('Visit the southeast observatory (Last Predictor, T) to sharpen your forecast strip.');
    }
  }

  if (options.logsFound < options.logsTotal) {
    if (locale === 'zh') {
      parts.push(`你仍知晓 ${options.logsFound} / ${options.logsTotal} 块碑文——荒原中还有更多发光石碑。`);
    } else if (locale === 'ja') {
      parts.push(`まだ ${options.logsFound} / ${options.logsTotal} のログを知っている——荒原にはもっと光る碑がある。`);
    } else {
      parts.push(`You still know ${options.logsFound} / ${options.logsTotal} logs — more tablets glow in the wastes.`);
    }
  }

  return parts.join(' ');
}
