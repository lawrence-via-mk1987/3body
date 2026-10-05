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
    top: '#5a7088',
    horizon: '#9eb8cc',
    bottom: '#1a120c',
    fog: '#2a2018',
    fogDensity: 0.00028,
    ambient: 0.5,
    exposure: 0.9,
    bloom: 0.32,
    darkness: 0,
    cloudCover: 0.52,
    cloudBright: 0.88,
    cloudColor: '#e8eef4',
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
    this.sky.setSunScatterScale(cutscene ? 0 : this.getSunScatterScale());
    this.sky.setGodRayStrength(cutscene ? 0 : this.getGodRayStrength());
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
    this.accentSunLights();
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
    const phase = this.eraState.phase;
    let exposure = SKY_PALETTES[phase].exposure;
    if (phase === 'flying_star') {
      const t = this.eraState.getPhaseProgress();
      exposure += t * 0.26;
    } else if (phase === 'tri_solar') {
      exposure += 0.04;
    }
    return exposure;
  }

  getBloomTarget(): number {
    const phase = this.eraState.phase;
    let bloom = SKY_PALETTES[phase].bloom;
    if (phase === 'flying_star') {
      bloom += this.eraState.getPhaseProgress() * 0.42;
    }
    return bloom;
  }

  /** Lower threshold pulls more horizon energy into bloom during Flying Star. */
  getBloomThreshold(): number {
    if (this.eraState.phase === 'flying_star') {
      return THREE.MathUtils.lerp(1.02, 0.62, this.eraState.getPhaseProgress());
    }
    if (this.eraState.phase === 'tri_solar') {
      return 0.92;
    }
    return 1.05;
  }

  getSunScatterScale(): number {
    const phase = this.eraState.phase;
    if (phase === 'flying_star') {
      return 1.25 + this.eraState.getPhaseProgress() * 0.95;
    }
    if (phase === 'tri_solar') {
      return 1.18;
    }
    if (this.eraState.era === 'stable') {
      return 1.08;
    }
    return 1;
  }

  /** Sky-dome forward scatter / streaks toward the suns. */
  getGodRayStrength(): number {
    const phase = this.eraState.phase;
    if (this.eraState.era === 'stable') {
      return 0.42;
    }
    if (phase === 'flying_star') {
      return 0.82 + this.eraState.getPhaseProgress() * 0.55;
    }
    if (phase === 'tri_solar') {
      return 0.78;
    }
    if (phase === 'deep_cold' || phase === 'eclipse_relief') {
      return 0.22;
    }
    if (phase === 'scorch' || phase === 'binary_chaos') {
      return 0.62;
    }
    return 0.5;
  }

  getSolarGroundLighting(): {
    blend: number;
    suns: { direction: THREE.Vector3; color: THREE.Color; power: number }[];
  } {
    const phase = this.eraState.phase;
    let blend = 0;
    if (phase === 'tri_solar') {
      blend = 1;
    } else if (phase === 'flying_star') {
      blend = 0.55;
    } else if (phase === 'scorch' || phase === 'binary_chaos') {
      blend = 0.22;
    }
    const suns = this.suns.map((sun) => ({
      direction: sun.direction.clone(),
      color: sun.color.clone(),
      power: sun.active && sun.elevation > -0.05 ? sun.intensity : 0,
    }));
    return { blend, suns };
  }

  getPoolSkyReflection(): {
    top: THREE.Color;
    horizon: THREE.Color;
    sunDirection: THREE.Vector3;
    sunStrength: number;
  } {
    const palette = SKY_PALETTES[this.eraState.phase];
    const top = new THREE.Color(palette.top);
    const horizon = new THREE.Color(palette.horizon);
    let sunDirection = this.sunA.direction.clone();
    let sunStrength = this.sunA.active ? this.sunA.intensity : 0.4;
    if (this.eraState.era === 'stable') {
      horizon.set('#c9a86a');
      top.set('#4a7080');
    }
    for (const sun of this.suns) {
      if (sun.active && sun.intensity > sunStrength) {
        sunStrength = sun.intensity;
        sunDirection = sun.direction.clone();
      }
    }
    return { top, horizon, sunDirection, sunStrength };
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
    if (this.envTimer < 1.5) {
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
    const phase = this.eraState.phase;
    const stable = this.eraState.era === 'stable';
    const palette = SKY_PALETTES[phase];
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
    const fogTarget = stable && phase === 'stable_golden' ? 0 : palette.fogDensity;
    this.fog.density = THREE.MathUtils.lerp(
      this.fog.density,
      fogTarget,
      stable ? 0.08 : 0.04,
    );
    this.sky.setHorizonHazeStrength(stable ? 0.06 : 0.35);
    const tempBias = THREE.MathUtils.clamp(this.temperature.value / 3, -1, 1);
    // Environment lighting now carries part of the sky bounce, so the hemisphere is softer.
    // Hemisphere + fill are in physical units (divided by π in the BRDF), hence the scaling.
    const envShare = this.pmrem ? 0.85 : 1;
    this.ambient.intensity = Math.max(
      ORBITAL_CONFIG.minAmbientIntensity * envShare,
      (palette.ambient + tempBias * 0.08) * envShare,
    ) * 3.3;
    this.ambient.color.set(stable ? '#8898a8' : '#8a5a40');
    this.ambient.groundColor.set(
      this.temperature.value < 0 ? '#1a2434' : stable ? '#14100c' : '#2a1c14',
    );
    this.fill.intensity = (this.eraState.era === 'stable'
      ? 0.22
      : 0.12 + Math.max(this.temperature.value, 0) * 0.08) * 2.4;

    if (phase === 'tri_solar' || phase === 'flying_star') {
      const mix = new THREE.Color(0, 0, 0);
      let total = 0;
      for (const sun of this.suns) {
        if (!sun.active) {
          continue;
        }
        mix.add(sun.color.clone().multiplyScalar(sun.intensity));
        total += sun.intensity;
      }
      if (total > 0.01) {
        mix.multiplyScalar(1 / total);
        this.fill.color.copy(mix);
        this.ambient.color.lerp(mix, phase === 'tri_solar' ? 0.35 : 0.55);
      }
      if (phase === 'flying_star') {
        const t = this.eraState.getPhaseProgress();
        this.fill.intensity *= 1.15 + t * 0.45;
        this.ambient.intensity *= 1.05 + t * 0.12;
        this.fog.color.lerp(this.sunC.color, 0.22 + t * 0.35);
        this.scene.environmentIntensity = 0.75 + t * 0.35;
      } else {
        this.scene.environmentIntensity = 0.82;
      }
    } else {
      this.fill.color.set('#4a5f8c');
      this.scene.environmentIntensity = stable ? 0.58 : 0.72;
    }

    // Stable Era: the one sun is softer. More sky fill, a dimmer key, a wider penumbra.
    if (stable) {
      this.ambient.intensity *= 1.02;
      this.fill.intensity *= 1.05;
      this.ambient.color.set('#788898');
      if (phase !== 'tri_solar' && phase !== 'flying_star') {
        this.scene.environmentIntensity = 0.48;
      }
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

  /** Phase accents on top of SunBody base intensities (tri-solar keys, flying-star red dominance). */
  private accentSunLights(): void {
    const phase = this.eraState.phase;
    if (phase !== 'tri_solar' && phase !== 'flying_star') {
      return;
    }
    for (const sun of this.suns) {
      if (!sun.light || !sun.active) {
        continue;
      }
      if (phase === 'tri_solar') {
        sun.light.intensity *= sun.light.castShadow ? 1.06 : 1.42;
        if (!sun.light.castShadow) {
          sun.light.color.copy(sun.color);
        }
      } else if (phase === 'flying_star') {
        if (sun.id === 'sun_c') {
          sun.light.intensity *= 1.28;
          sun.light.color.copy(sun.color);
        } else {
          sun.light.intensity *= 0.48;
        }
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
