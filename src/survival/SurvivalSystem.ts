import * as THREE from 'three';
import type { TemperatureSample } from '../orbital/types';
import { SURVIVAL_CONFIG } from './config';
import type { ShelterSample } from './ShelterZones';

export type SurvivalStatus =
  | 'active'
  | 'dehydrated'
  | 'dead';

export type DeathReason =
  | 'heat'
  | 'cold'
  | 'thirst'
  | 'unknown';

export interface SurvivalSnapshot {
  health: number;
  hydration: number;
  status: SurvivalStatus;
  effectiveTemperature: number;
  shelterLabel: string | null;
  statusMessage: string;
  nearPit: boolean;
}

export class SurvivalSystem {
  health: number = SURVIVAL_CONFIG.maxHealth;
  hydration: number = SURVIVAL_CONFIG.maxHydration;
  status: SurvivalStatus = 'active';
  deathReason: DeathReason = 'unknown';

  private dehydratedPrompt = false;

  update(
    delta: number,
    temperature: TemperatureSample,
    shelter: ShelterSample,
    nearPit: boolean,
    sprinting: boolean,
  ): void {
    if (this.status === 'dead') {
      return;
    }

    this.dehydratedPrompt = nearPit;

    if (this.status === 'dehydrated') {
      this.hydration = THREE.MathUtils.clamp(
        this.hydration + delta * 0.5,
        0,
        SURVIVAL_CONFIG.maxHydration,
      );
      return;
    }

    const effectiveTemperature = temperature.value + shelter.temperatureOffset;
    let hydrationDrain = SURVIVAL_CONFIG.baseHydrationDrain;

    if (effectiveTemperature > 1) {
      hydrationDrain *= SURVIVAL_CONFIG.heatHydrationMultiplier;
    }
    if (sprinting) {
      hydrationDrain *= SURVIVAL_CONFIG.sprintHydrationMultiplier;
    }

    this.hydration = THREE.MathUtils.clamp(
      this.hydration - hydrationDrain * delta,
      0,
      SURVIVAL_CONFIG.maxHydration,
    );

    if (this.hydration <= 0) {
      this.health = 0;
      this.status = 'dead';
      this.deathReason = 'thirst';
      return;
    }

    if (effectiveTemperature <= -2) {
      this.health -= SURVIVAL_CONFIG.coldDamagePerSec * delta;
    } else if (effectiveTemperature >= 3) {
      this.health -= SURVIVAL_CONFIG.lethalHeatDamagePerSec * delta;
    } else if (effectiveTemperature >= 2) {
      this.health -= SURVIVAL_CONFIG.heatDamagePerSec * delta;
    } else if (effectiveTemperature > 1) {
      this.health -= SURVIVAL_CONFIG.heatDamagePerSec * 0.35 * delta;
    }

    if (this.health <= 0) {
      this.health = 0;
      this.status = 'dead';
      this.deathReason = effectiveTemperature <= -1 ? 'cold' : 'heat';
    }
  }

  toggleDehydration(nearPit: boolean): boolean {
    if (this.status === 'dead') {
      return false;
    }

    if (this.status === 'dehydrated') {
      if (!nearPit) {
        return false;
      }
      this.status = 'active';
      this.hydration = Math.max(this.hydration, SURVIVAL_CONFIG.dehydrationRehydrateAmount);
      return true;
    }

    if (!nearPit) {
      return false;
    }

    this.status = 'dehydrated';
    return true;
  }

  getSnapshot(temperature: TemperatureSample, shelter: ShelterSample, nearPit: boolean): SurvivalSnapshot {
    const effectiveTemperature = temperature.value + shelter.temperatureOffset;

    let statusMessage = 'Look up. The suns are rising.';
    if (this.status === 'dehydrated') {
      statusMessage = 'Dehydrated — dormant and vulnerable. Press E at the pit to rehydrate.';
    } else if (nearPit) {
      statusMessage = 'Press E to dehydrate and wait out the chaos.';
    } else if (shelter.inShelter && shelter.label) {
      statusMessage = `Sheltered in ${shelter.label.toLowerCase()}.`;
    } else if (effectiveTemperature >= 2.5) {
      statusMessage = 'Seek shade or the underground shelter.';
    } else if (effectiveTemperature <= -1.5) {
      statusMessage = 'Find shelter before the cold takes you.';
    }

    return {
      health: this.health,
      hydration: this.hydration,
      status: this.status,
      effectiveTemperature,
      shelterLabel: shelter.label,
      statusMessage,
      nearPit,
    };
  }

  canShowDehydratePrompt(): boolean {
    return this.dehydratedPrompt;
  }

  reset(): void {
    this.health = SURVIVAL_CONFIG.maxHealth;
    this.hydration = SURVIVAL_CONFIG.maxHydration;
    this.status = 'active';
    this.deathReason = 'unknown';
  }

  getDeathMessage(): string {
    switch (this.deathReason) {
      case 'heat':
        return 'The suns claimed you. Your civilization ends in scorched silence.';
      case 'cold':
        return 'The chaotic night froze your body before the next dawn.';
      case 'thirst':
        return 'The wasteland drank the last of your water.';
      default:
        return 'Another cycle ends. The wasteland waits for the next civilization.';
    }
  }
}
