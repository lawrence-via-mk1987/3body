import type { EraPhase } from './types';

export interface SkyPaletteData {
  top: string;
  horizon: string;
  bottom: string;
  fog: string;
  fogDensity: number;
  ambient: number;
  exposure: number;
  bloom: number;
  darkness: number;
  cloudCover: number;
  cloudBright: number;
  cloudColor: string;
  galaxy: number;
}

/** Authoritative era sky/fog/post tuning — shared by web runtime and Unity export. */
export const SKY_PALETTES: Record<EraPhase, SkyPaletteData> = {
  deep_cold: {
    top: '#0c1426',
    horizon: '#34435e',
    bottom: '#161c2a',
    fog: '#1f2a3a',
    fogDensity: 0.0026,
    ambient: 0.38,
    exposure: 0.95,
    bloom: 0.25,
    darkness: 0.85,
    cloudCover: 0.22,
    cloudBright: 0.75,
    cloudColor: '#9aa8bc',
    galaxy: 0.55,
  },
  thaw: {
    top: '#182036',
    horizon: '#7a5238',
    bottom: '#2a1a12',
    fog: '#3c2a1a',
    fogDensity: 0.0024,
    ambient: 0.45,
    exposure: 1.1,
    bloom: 0.45,
    darkness: 0.25,
    cloudCover: 0.28,
    cloudBright: 0.9,
    cloudColor: '#dce4ef',
    galaxy: 0.12,
  },
  scorch: {
    top: '#3a1e14',
    horizon: '#c05228',
    bottom: '#4a2010',
    fog: '#4a2818',
    fogDensity: 0.00165,
    ambient: 0.52,
    exposure: 1.12,
    bloom: 0.6,
    darkness: 0,
    cloudCover: 0.08,
    cloudBright: 0.85,
    cloudColor: '#ffd8b0',
    galaxy: 0,
  },
  binary_chaos: {
    top: '#2a1838',
    horizon: '#944432',
    bottom: '#301810',
    fog: '#4e2a1a',
    fogDensity: 0.0022,
    ambient: 0.5,
    exposure: 1.12,
    bloom: 0.55,
    darkness: 0.05,
    cloudCover: 0.18,
    cloudBright: 0.88,
    cloudColor: '#e8c8b0',
    galaxy: 0.05,
  },
  tri_solar: {
    top: '#4e1a10',
    horizon: '#e85224',
    bottom: '#661a08',
    fog: '#74260f',
    fogDensity: 0.00185,
    ambient: 0.64,
    exposure: 1.2,
    bloom: 0.88,
    darkness: 0,
    cloudCover: 0.12,
    cloudBright: 0.95,
    cloudColor: '#ffe0c8',
    galaxy: 0,
  },
  flying_star: {
    top: '#5c1008',
    horizon: '#ff5a22',
    bottom: '#761008',
    fog: '#92200a',
    fogDensity: 0.0016,
    ambient: 0.68,
    exposure: 1.34,
    bloom: 1.22,
    darkness: 0,
    cloudCover: 0.05,
    cloudBright: 1.05,
    cloudColor: '#ffc8a8',
    galaxy: 0,
  },
  eclipse_relief: {
    top: '#0e141c',
    horizon: '#3a3038',
    bottom: '#181410',
    fog: '#201e18',
    fogDensity: 0.003,
    ambient: 0.3,
    exposure: 0.9,
    bloom: 0.2,
    darkness: 0.7,
    cloudCover: 0.38,
    cloudBright: 0.65,
    cloudColor: '#788090',
    galaxy: 0.35,
  },
  stable_golden: {
    top: '#6a9ec4',
    horizon: '#c8dce8',
    bottom: '#2a2018',
    fog: '#2a2018',
    fogDensity: 0.00028,
    ambient: 0.5,
    exposure: 1.05,
    bloom: 0.18,
    darkness: 0,
    cloudCover: 0.24,
    cloudBright: 0.72,
    cloudColor: '#e8eef4',
    galaxy: 0,
  },
};
