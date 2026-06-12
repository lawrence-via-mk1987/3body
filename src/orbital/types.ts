export type EraKind = 'chaotic' | 'stable';

export type EraPhase =
  | 'deep_cold'
  | 'thaw'
  | 'scorch'
  | 'binary_chaos'
  | 'tri_solar'
  | 'flying_star'
  | 'eclipse_relief'
  | 'stable_golden';

export type SunId = 'sun_a' | 'sun_b' | 'sun_c';

export interface SunSnapshot {
  id: SunId;
  azimuth: number;
  elevation: number;
  apparentScale: number;
  intensity: number;
  active: boolean;
}

export interface ForecastEntry {
  timeOffset: number;
  phase: EraPhase;
  confidence: number;
  temperatureRange: [number, number];
}

export interface TemperatureSample {
  value: number;
  label: string;
  status: 'freezing' | 'cold' | 'safe' | 'warm' | 'heat' | 'lethal';
}

export const PHASE_LABELS: Record<EraPhase, string> = {
  deep_cold: 'Deep Cold',
  thaw: 'Thaw',
  scorch: 'Scorch',
  binary_chaos: 'Binary Chaos',
  tri_solar: 'Tri-Solar',
  flying_star: 'Flying Star',
  eclipse_relief: 'Eclipse Relief',
  stable_golden: 'Stable Era',
};

export const CHAOTIC_PHASES: EraPhase[] = [
  'deep_cold',
  'thaw',
  'scorch',
  'binary_chaos',
  'tri_solar',
  'flying_star',
  'eclipse_relief',
];
