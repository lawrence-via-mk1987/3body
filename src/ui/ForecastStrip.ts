import type { ForecastEntry } from '../orbital/types';
import { PHASE_LABELS } from '../orbital/types';

const SHORT: Partial<Record<ForecastEntry['phase'], string>> = {
  deep_cold: 'Cold',
  thaw: 'Thaw',
  scorch: 'Heat',
  binary_chaos: 'Binary',
  tri_solar: 'Tri',
  flying_star: 'Fly',
  eclipse_relief: 'Eclipse',
  stable_golden: 'Stable',
};

function dangerClass(entry: ForecastEntry): string {
  const [, max] = entry.temperatureRange;
  const [min] = entry.temperatureRange;
  if (max >= 2.5) return 'danger-heat';
  if (min <= -2) return 'danger-cold';
  return 'neutral';
}

export class ForecastStrip {
  constructor(private readonly container: HTMLElement) {}

  render(entries: ForecastEntry[]): void {
    this.container.innerHTML = entries.map((entry) => {
      const label = SHORT[entry.phase] ?? PHASE_LABELS[entry.phase];
      const confidence = Math.round(entry.confidence * 100);
      return `<div class="forecast-slot ${dangerClass(entry)}">
        <span class="forecast-time">+${entry.timeOffset}s</span>
        <span class="forecast-phase">${label}</span>
        <span class="forecast-conf">${confidence}%</span>
      </div>`;
    }).join('');
  }
}
