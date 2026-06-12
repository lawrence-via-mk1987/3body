import * as THREE from 'three';
import { buildForecast, summarizeForecast } from './ForecastModel';
import { EraStateMachine } from './EraStateMachine';
import { SunPhaseController } from './SunPhaseController';
import { SunBody } from './SunBody';
import {
  computeSurfaceTemperature,
  describeTemperature,
} from './TemperatureField';
import { PHASE_LABELS } from './types';
import type { ForecastEntry, TemperatureSample } from './types';
import type { Sky } from '../world/Sky';

const SKY_PALETTES = {
  deep_cold: {
    top: '#0d1528',
    horizon: '#2a3d5c',
    bottom: '#121820',
    fog: '#1a2430',
    fogDensity: 0.003,
    ambient: 0.35,
  },
  thaw: {
    top: '#1a2238',
    horizon: '#6d4a35',
    bottom: '#2a1810',
    fog: '#3a2818',
    fogDensity: 0.0024,
    ambient: 0.45,
  },
  scorch: {
    top: '#3a2018',
    horizon: '#b04a28',
    bottom: '#4a2010',
    fog: '#5a2818',
    fogDensity: 0.002,
    ambient: 0.55,
  },
  binary_chaos: {
    top: '#2a1838',
    horizon: '#8a4030',
    bottom: '#301810',
    fog: '#4a2818',
    fogDensity: 0.0022,
    ambient: 0.5,
  },
  tri_solar: {
    top: '#4a1810',
    horizon: '#d84820',
    bottom: '#601808',
    fog: '#6a2010',
    fogDensity: 0.0018,
    ambient: 0.7,
  },
  flying_star: {
    top: '#5a1008',
    horizon: '#ff5020',
    bottom: '#701008',
    fog: '#8a1808',
    fogDensity: 0.0016,
    ambient: 0.75,
  },
  eclipse_relief: {
    top: '#121820',
    horizon: '#3a3038',
    bottom: '#181410',
    fog: '#222018',
    fogDensity: 0.0028,
    ambient: 0.3,
  },
  stable_golden: {
    top: '#4a6848',
    horizon: '#c8a060',
    bottom: '#5a4830',
    fog: '#6a5838',
    fogDensity: 0.0018,
    ambient: 0.62,
  },
} as const;

export class OrbitalDirector {
  private readonly eraState = new EraStateMachine();
  private readonly phaseController = new SunPhaseController();
  private readonly sunA = new SunBody('sun_a', true);
  private readonly sunB = new SunBody('sun_b', false);
  private readonly sunC = new SunBody('sun_c', false);
  private readonly suns = [this.sunA, this.sunB, this.sunC];

  private readonly ambient: THREE.HemisphereLight;
  private readonly fill: THREE.DirectionalLight;
  private forecast: ForecastEntry[] = [];
  private forecastSummary = 'Conditions uncertain';
  private forecastTimer = 0;
  private temperature: TemperatureSample = {
    value: -1,
    label: 'Bitter Cold',
    status: 'cold',
  };

  constructor(
    private readonly scene: THREE.Scene,
    private readonly sky: Sky,
    private readonly fog: THREE.FogExp2,
  ) {
    for (const sun of this.suns) {
      sun.addToScene(scene);
    }

    this.ambient = new THREE.HemisphereLight('#7a4d35', '#1a120d', 0.45);
    this.fill = new THREE.DirectionalLight('#4a5f8c', 0.2);
    this.fill.position.set(-60, 40, -80);
    scene.add(this.ambient);
    scene.add(this.fill);

    this.refreshForecast();
  }

  update(delta: number, anchor: THREE.Vector3): void {
    const phaseChanged = this.eraState.update(delta);
    if (phaseChanged) {
      this.refreshForecast();
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

    for (const sun of this.suns) {
      sun.updateTransform(anchor);
    }

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

  getEraLabel(): string {
    return this.eraState.era === 'stable' ? 'Stable' : 'Chaotic';
  }

  getPhaseLabel(): string {
    return PHASE_LABELS[this.eraState.phase];
  }

  getTemperature(): TemperatureSample {
    return this.temperature;
  }

  getForecastSummary(): string {
    return this.forecastSummary;
  }

  getForecast(): ForecastEntry[] {
    return this.forecast;
  }

  private refreshForecast(): void {
    this.forecast = buildForecast(
      this.eraState.phase,
      this.eraState.elapsedInPhase,
      this.eraState.phaseDuration,
    );
    this.forecastSummary = summarizeForecast(this.forecast);
  }

  private applyAtmosphere(): void {
    const palette = SKY_PALETTES[this.eraState.phase];
    this.sky.setPalette(palette.top, palette.horizon, palette.bottom);
    this.fog.color.set(palette.fog);
    this.fog.density = THREE.MathUtils.lerp(
      this.fog.density,
      palette.fogDensity,
      0.04,
    );

    const tempBias = THREE.MathUtils.clamp(this.temperature.value / 3, -1, 1);
    this.ambient.intensity = palette.ambient + tempBias * 0.08;
    this.ambient.color.set(this.eraState.era === 'stable' ? '#9ab07a' : '#7a4d35');
    this.ambient.groundColor.set(this.temperature.value < 0 ? '#141c28' : '#1a120d');
    this.fill.intensity = 0.12 + Math.max(this.temperature.value, 0) * 0.08;
  }

  dispose(): void {
    for (const sun of this.suns) {
      sun.dispose();
    }
    this.scene.remove(this.ambient);
    this.scene.remove(this.fill);
  }
}
