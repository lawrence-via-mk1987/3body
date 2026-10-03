export function buildDeathObjective(options: {
  hasFinalLog: boolean;
  forecastCalibrated: boolean;
  logsFound: number;
  logsTotal: number;
}): string {
  if (options.hasFinalLog) {
    return 'This cycle found the Final Log. Discovered texts stay in your journal across new cycles — walk again if you wish.';
  }

  const parts: string[] = [
    'Next cycle: follow amber beacons to the dehydration pit (−42, 18); green trails appear in Stable Era toward the grove (28, −32) and Final Log.',
  ];

  if (!options.forecastCalibrated) {
    parts.push('Visit the southeast observatory (Last Predictor, T) to sharpen your forecast strip.');
  }

  if (options.logsFound < options.logsTotal) {
    parts.push(`You still know ${options.logsFound} / ${options.logsTotal} logs — more tablets glow in the wastes.`);
  }

  return parts.join(' ');
}
