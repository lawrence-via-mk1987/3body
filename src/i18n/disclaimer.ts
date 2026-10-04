import type { Locale } from './locale';

export function getDisclaimerHtml(locale: Locale): string {
  if (locale === 'zh') {
    return '<strong>免责声明：</strong>本作品为受刘慈欣《三体》启发的同人游戏演示，非官方、非商业，与作者、'
      + '《地球往事》系列或任何权利人无关。';
  }
  if (locale === 'ja') {
    return '<strong>免責事項：</strong>本作品は劉慈欣『三体』に着想を得た同人ゲームデモです。'
      + '非公式・非商用であり、作者、『地球往事』シリーズ、またはいかなる権利者とも関係ありません。';
  }
  return '<strong>Disclaimer:</strong> This is a fan-inspired game inspired by the '
    + 'original <em>Three Body Problem</em> by Liu Cixin. Unofficial, '
    + 'non-commercial fan work — not affiliated with Liu Cixin, the '
    + '<em>Remembrance of Earth\'s Past</em> series, or any rights holders.';
}
