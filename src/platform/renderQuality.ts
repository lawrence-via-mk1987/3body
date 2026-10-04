import type { DeviceProfile } from './deviceProfile';

export type QualityTier = 'phone' | 'tablet' | 'desktop';

export interface RenderQuality {
  tier: QualityTier;
  pixelRatioCap: number;
  shadowMapSize: number;
  /** Half-width of the sun shadow frustum around the player (world metres). */
  shadowRadius: number;
  terrainSegments: number;
  textureSize: number;
  anisotropy: number;
  bloom: boolean;
  /** Secondary suns contribute coloured directional light (no shadows). */
  secondarySunLights: boolean;
  /** Instanced grove blades. Short and brown in chaos, tall and green in a Stable Era. */
  grassBlades: number;
  /** Screen-space heat distortion. Needs the desktop post stack. */
  heatHaze: boolean;
  /** Cold-phase breath in front of the camera. Off on phones. */
  breath: boolean;
  /** Slow chaos arpeggio in procedural music beds; off on phones. */
  musicArpeggio: boolean;
}

export function resolveRenderQuality(profile: DeviceProfile): RenderQuality {
  if (profile.kind === 'mobile') {
    return {
      tier: 'phone',
      pixelRatioCap: 1.5,
      shadowMapSize: 1024,
      shadowRadius: 60,
      terrainSegments: 160,
      textureSize: 512,
      anisotropy: 4,
      bloom: false,
      secondarySunLights: true,
      grassBlades: 180,
      heatHaze: false,
      breath: false,
      musicArpeggio: false,
    };
  }
  if (profile.kind === 'tablet') {
    return {
      tier: 'tablet',
      pixelRatioCap: 1.75,
      shadowMapSize: 2048,
      shadowRadius: 75,
      terrainSegments: 224,
      textureSize: 1024,
      anisotropy: 8,
      bloom: false,
      secondarySunLights: true,
      grassBlades: 360,
      heatHaze: false,
      breath: true,
      musicArpeggio: true,
    };
  }
  return {
    tier: 'desktop',
    pixelRatioCap: 2,
    shadowMapSize: 2048,
    shadowRadius: 80,
    terrainSegments: 256,
    textureSize: 1024,
    anisotropy: 16,
    bloom: true,
    secondarySunLights: true,
    grassBlades: 700,
    heatHaze: true,
    breath: true,
    musicArpeggio: true,
  };
}
