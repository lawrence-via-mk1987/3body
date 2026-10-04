import * as THREE from 'three';
import { buildForecast, summarizeForecast } from './ForecastModel';
import { EraStateMachine, type StableEraRoll } from './EraStateMachine';
import { SunPhaseController } from './SunPhaseController';
import { SunBody } from './SunBody';
import {
  computeSurfaceTemperature,
  describeTemperature,
} from './TemperatureField';
import { ORBITAL_CONFIG } from './config';
import { PHASE_LABELS } from './types';
import type { EraKind, EraPhase, EraTransition, ForecastEntry, TemperatureSample } from './types';
import type { Sky, SkySunInput } from '../world/Sky';
import type { RenderQuality } from '../platform/renderQuality';

interface SkyPalette {
  top: string;
  horizon: string;
  bottom: string;
  fog: string;
  fogDensity: number;
  ambient: number;
  /** Tone-mapping exposure target for this phase. */
  exposure: number;
  /** Desktop bloom strength target. */
  bloom: number;
  /** 0 = day, 1 = stars fully visible. */
  darkness: number;
  cloudCover: number;
  cloudBright: number;
  cloudColor: string;
  galaxy: number;
}

const SKY_PALETTES: Record<EraPhase, SkyPalette> = {
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
    fog: '#60301a',
    fogDensity: 0.0021,
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
    fogDensity: 0.0019,
    ambient: 0.62,
    exposure: 1.18,
    bloom: 0.8,
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
    fogDensity: 0.0017,
    ambient: 0.66,
    exposure: 1.3,
    bloom: 1.05,
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
    top: '#4f7e8a',
    horizon: '#e6bf84',
    bottom: '#6a5a44',
    fog: '#8e7f58',
    fogDensity: 0.0014,
    ambient: 0.62,
    exposure: 1.02,
    bloom: 0.4,
    darkness: 0,
    cloudCover: 0.72,
    cloudBright: 1.15,
    cloudColor: '#f4f8ff',
    galaxy: 0,
  },
};

function colorDistance(a: THREE.Color, b: THREE.Color): number {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

export interface OrbitalRenderOptions {
  renderer: THREE.WebGLRenderer;
  quality: RenderQuality;
}

export class OrbitalDirector {
  private readonly eraState: EraStateMachine;
  private readonly phaseController = new SunPhaseController();
  private readonly sunA: SunBody;
  private readonly sunB: SunBody;
  private readonly sunC: SunBody;
  private readonly suns: SunBody[];

  private readonly ambient: THREE.HemisphereLight;
  private readonly fill: THREE.DirectionalLight;
  private readonly pmrem: THREE.PMREMGenerator | null;
  private readonly envScene: THREE.Scene | null;
  private envTexture: THREE.Texture | null = null;
  private envTimer = 99;
  private readonly envBakedPalette = { top: new THREE.Color(), horizon: new THREE.Color() };
  private envBakedSunEnergy = -1;
  private pmremRebakeMinSec = 1.5;
  private readonly skySunInputs: SkySunInput[];
  private forecast: ForecastEntry[] = [];
  private forecastSummary = 'Conditions uncertain';
  private forecastTimer = 0;
  private temperature: TemperatureSample = {
    value: -1,
    label: 'Bitter Cold',
    status: 'cold',
  };
  private pendingTransition: EraTransition | null = null;
  private presentation: 'world' | 'cutscene' = 'world';

  constructor(
    private readonly scene: THREE.Scene,
    private readonly sky: Sky,
    private readonly fog: THREE.FogExp2,
    stableRoll: () => StableEraRoll = () => ({ chance: ORBITAL_CONFIG.stableEraChance, force: false }),
    onChaoticPhaseEnded?: () => void,
    onStableEntered?: () => void,
    private readonly forecastConfidenceBonus: () => number = () => 0,
    renderOptions?: OrbitalRenderOptions,
  ) {
    this.eraState = new EraStateMachine(stableRoll, onChaoticPhaseEnded, onStableEntered);

    const quality = renderOptions?.quality;
    this.pmremRebakeMinSec = quality?.pmremRebakeMinSec ?? 1.5;
    this.sunA = new SunBody('sun_a', {
      castShadow: true,
      emitLight: true,
      shadowMapSize: quality?.shadowMapSize,
      shadowRadius: quality?.shadowRadius,
    });
    const secondary = quality?.secondarySunLights ?? true;
    this.sunB = new SunBody('sun_b', { castShadow: false, emitLight: secondary });
    this.sunC = new SunBody('sun_c', { castShadow: false, emitLight: secondary });
    this.suns = [this.sunA, this.sunB, this.sunC];
    for (const sun of this.suns) {
      sun.addToScene(scene);
    }
    this.skySunInputs = this.suns.map((sun) => ({
      direction: sun.direction,
      color: sun.color,
      intensity: 0,
      apparentScale: 1,
    }));

    this.ambient = new THREE.HemisphereLight('#7a4d35', '#1a120d', 0.45);
    this.fill = new THREE.DirectionalLight('#4a5f8c', 0.2);
    this.fill.position.set(-60, 40, -80);
    scene.add(this.ambient);
    scene.add(this.fill);

    if (renderOptions) {
      this.pmrem = new THREE.PMREMGenerator(renderOptions.renderer);
      this.pmrem.compileEquirectangularShader();
      this.envScene = new THREE.Scene();
      // Shares the live sky material so the environment follows palette + sun glow.
      const envDome = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), this.sky.mesh.material);
      this.envScene.add(envDome);
      scene.environmentIntensity = 0.75;
    } else {
      this.pmrem = null;
      this.envScene = null;
    }

    this.refreshForecast();
  }

  update(delta: number, anchor: THREE.Vector3): void {
    const eraBefore = this.eraState.era;
    const phaseChanged = this.eraState.update(delta);

    if (phaseChanged) {
      this.refreshForecast();
      this.pendingTransition = {
        enteredStable: eraBefore !== 'stable' && this.eraState.era === 'stable',
        leftStable: eraBefore === 'stable' && this.eraState.era === 'chaotic',
        phaseChanged: true,
      };
    }

    this.forecastTimer += delta;
    if (this.forecastTimer >= 8) {
      this.forecastTimer = 0;
      this.refreshForecast();
    }

    this.phaseController.update(
      this.eraState.phase,
      this.eraState.getPhaseProgress(),
      this.eraState.elapsedInPhase,
      this.sunA,
      this.sunB,
      this.sunC,
    );

    const cutscene = this.presentation === 'cutscene';
    for (const sun of this.suns) {
      if (cutscene) {
        sun.mesh.visible = false;
        sun.glow.visible = false;
        sun.glowOuter.visible = false;
        sun.glowCorona.visible = false;
        if (sun.light) {
          sun.light.intensity = 0;
        }
      } else {
        sun.updateTransform(anchor);
      }
    }
    let sunEnergy = 0;
    for (let i = 0; i < this.suns.length; i += 1) {
      const sun = this.suns[i]!;
      const input = this.skySunInputs[i]!;
      const visible = !cutscene && sun.active && sun.elevation > -0.12;
      input.intensity = visible ? sun.intensity : 0;
      input.apparentScale = sun.apparentScale;
      sunEnergy += input.intensity;
    }
    this.sky.setSuns(this.skySunInputs);
    this.sky.setSunScatterScale(cutscene ? 0 : 1);
    const palette = SKY_PALETTES[this.eraState.phase];
    this.sky.setDarkness(Math.max(palette.darkness - sunEnergy * 0.35, 0));

    this.updateEnvironment(delta, sunEnergy);

    const snapshots = this.suns.map((sun) => sun.getSnapshot());
    const value = computeSurfaceTemperature(
      snapshots,
      this.eraState.era,
      this.eraState.phase,
      this.eraState.elapsedInPhase,
    );
    const description = describeTemperature(value);
    this.temperature = { value, ...description };

    this.applyAtmosphere();
  }

  getEraKind(): EraKind {
    return this.eraState.era;
  }

  getPhase(): EraPhase {
    return this.eraState.phase;
  }

  getEraLabel(): string {
    return this.eraState.era === 'stable' ? 'Stable' : 'Chaotic';
  }

  getPhaseLabel(): string {
    return PHASE_LABELS[this.eraState.phase];
  }

  getTemperature(): TemperatureSample {
    return this.temperature;
  }

  getExposureTarget(): number {
    return SKY_PALETTES[this.eraState.phase].exposure;
  }

  getBloomTarget(): number {
    return SKY_PALETTES[this.eraState.phase].bloom;
  }

  /**
   * Re-bake the sky into a PMREM environment when the palette or sun energy has
   * drifted enough. Cheap (6 small faces) and throttled to a couple of seconds.
   */
  private updateEnvironment(delta: number, sunEnergy: number): void {
    if (!this.pmrem || !this.envScene) {
      return;
    }
    this.envTimer += delta;
    if (this.envTimer < this.pmremRebakeMinSec) {
      return;
    }
    const palette = this.sky.getCurrentPalette();
    const drift = colorDistance(this.envBakedPalette.top, palette.top)
      + colorDistance(this.envBakedPalette.horizon, palette.horizon);
    const energyDrift = Math.abs(sunEnergy - this.envBakedSunEnergy);
    if (this.envTexture && drift < 0.04 && energyDrift < 0.35) {
      this.envTimer = 0;
      return;
    }
    this.envTimer = 0;
    const previous = this.envTexture;
    this.envTexture = this.pmrem.fromScene(this.envScene, 0, 0.1, 900).texture;
    this.scene.environment = this.envTexture;
    previous?.dispose();
    this.envBakedPalette.top.copy(palette.top);
    this.envBakedPalette.horizon.copy(palette.horizon);
    this.envBakedSunEnergy = sunEnergy;
  }

  getForecastSummary(): string {
    return this.forecastSummary;
  }

  getForecast(): ForecastEntry[] {
    return this.forecast;
  }

  reset(): void {
    this.eraState.reset();
    this.forecastTimer = 0;
    this.pendingTransition = null;
    this.refreshForecast();
  }

  getEraSnapshot() {
    return this.eraState.getSnapshot();
  }

  restoreEraSnapshot(snapshot: ReturnType<EraStateMachine['getSnapshot']>): void {
    this.eraState.applySnapshot(snapshot);
    this.forecastTimer = 0;
    this.pendingTransition = null;
    this.refreshForecast();
  }

  refreshForecastNow(): void {
    this.refreshForecast();
  }

  /** Debug/QA only: jump straight into a phase mid-way through its duration. */
  /** Hide world-scale sun disks during intro/epilogue diagram shots. */
  setPresentation(mode: 'world' | 'cutscene'): void {
    this.presentation = mode;
  }

  debugSetPhase(phase: EraPhase): void {
    const era: EraKind = phase === 'stable_golden' ? 'stable' : 'chaotic';
    this.eraState.applySnapshot({
      era,
      phase,
      elapsedInPhase: 12,
      phaseDuration: 24,
      dangerousCooldown: 0,
    });
    this.pendingTransition = {
      enteredStable: era === 'stable',
      leftStable: false,
      phaseChanged: true,
    };
    this.refreshForecast();
  }

  private refreshForecast(): void {
    this.forecast = buildForecast(
      this.eraState.phase,
      this.eraState.elapsedInPhase,
      this.eraState.phaseDuration,
      this.forecastConfidenceBonus(),
    );
    this.forecastSummary = summarizeForecast(this.forecast);
  }

  private applyAtmosphere(): void {
    const palette = SKY_PALETTES[this.eraState.phase];
    this.sky.setPalette(palette.top, palette.horizon, palette.bottom);
    if (this.presentation === 'world') {
      this.sky.setClouds({
        cover: palette.cloudCover,
        brightness: palette.cloudBright,
        color: palette.cloudColor,
      });
      this.sky.setGalaxyStrength(palette.galaxy);
    }
    this.fog.color.set(palette.fog);
    this.fog.density = THREE.MathUtils.lerp(
      this.fog.density,
      palette.fogDensity,
      0.04,
    );

    const tempBias = THREE.MathUtils.clamp(this.temperature.value / 3, -1, 1);
    // Environment lighting now carries part of the sky bounce, so the hemisphere is softer.
    // Hemisphere + fill are in physical units (divided by π in the BRDF), hence the scaling.
    const envShare = this.pmrem ? 0.85 : 1;
    this.ambient.intensity = Math.max(
      ORBITAL_CONFIG.minAmbientIntensity * envShare,
      (palette.ambient + tempBias * 0.08) * envShare,
    ) * 3.3;
    this.ambient.color.set(this.eraState.era === 'stable' ? '#b8ae86' : '#8a5a40');
    this.ambient.groundColor.set(this.temperature.value < 0 ? '#1a2434' : '#2a1c14');
    this.fill.intensity = (this.eraState.era === 'stable'
      ? 0.22
      : 0.12 + Math.max(this.temperature.value, 0) * 0.08) * 2.4;

    // Stable Era: the one sun is softer. More sky fill, a dimmer key, a wider penumbra.
    const stable = this.eraState.era === 'stable';
    if (stable) {
      this.ambient.intensity *= 1.3;
      this.fill.intensity *= 1.5;
    }
    for (const sun of this.suns) {
      if (!sun.light) {
        continue;
      }
      if (stable) {
        sun.light.intensity *= 0.7;
      }
      if (sun.light.castShadow) {
        sun.light.shadow.radius = stable ? 4 : 2.5;
      }
    }
  }

  consumeTransition(): EraTransition | null {
    const transition = this.pendingTransition;
    this.pendingTransition = null;
    return transition;
  }

  dispose(): void {
    for (const sun of this.suns) {
      sun.dispose();
    }
    this.scene.remove(this.ambient);
    this.scene.remove(this.fill);
    this.envTexture?.dispose();
    this.scene.environment = null;
    this.pmrem?.dispose();
    if (this.envScene) {
      for (const child of this.envScene.children) {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      }
    }
  }
}
