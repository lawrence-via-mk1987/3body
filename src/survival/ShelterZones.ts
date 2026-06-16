import * as THREE from 'three';
import { SURVIVAL_CONFIG } from './config';
import type { Terrain } from '../world/Terrain';

export interface ShelterSample {
  inShelter: boolean;
  undergroundDepth: number;
  temperatureOffset: number;
  label: string | null;
}

const ROCK_SHELTERS = [
  { x: -18, z: -8, radius: 7, label: 'Rock shadow' },
  { x: 24, z: 12, radius: 6, label: 'Boulder lee' },
];

const CAVE_BOUNDS = {
  minX: -16,
  maxX: -4,
  minZ: 2,
  maxZ: 16,
  depthBelowSurface: 2.8,
};

export class ShelterZones {
  constructor(private readonly terrain: Terrain) {}

  sample(position: THREE.Vector3): ShelterSample {
    const groundY = this.terrain.getHeightAt(position.x, position.z);
    let temperatureOffset = 0;
    let inShelter = false;
    let undergroundDepth = 0;
    let label: string | null = null;

    const pitDx = position.x - SURVIVAL_CONFIG.pitCenterX;
    const pitDz = position.z - SURVIVAL_CONFIG.pitCenterZ;
    const pitDistance = Math.hypot(pitDx, pitDz);
    if (pitDistance <= SURVIVAL_CONFIG.pitInteractionRadius) {
      inShelter = true;
      temperatureOffset -= 1.5;
      label = 'Dehydration pit';
    }

    for (const rock of ROCK_SHELTERS) {
      const distance = Math.hypot(position.x - rock.x, position.z - rock.z);
      if (distance <= rock.radius) {
        inShelter = true;
        temperatureOffset -= 1.2;
        label = label ?? rock.label;
      }
    }

    if (
      position.x >= CAVE_BOUNDS.minX
      && position.x <= CAVE_BOUNDS.maxX
      && position.z >= CAVE_BOUNDS.minZ
      && position.z <= CAVE_BOUNDS.maxZ
      && position.y < groundY - 0.8
    ) {
      inShelter = true;
      undergroundDepth = Math.max(0, groundY - position.y);
      temperatureOffset -= 1.5 + undergroundDepth * 0.3;
      label = 'Underground shelter';
    }

    return {
      inShelter,
      undergroundDepth,
      temperatureOffset,
      label,
    };
  }

  isNearDehydrationPit(position: THREE.Vector3): boolean {
    const pitDx = position.x - SURVIVAL_CONFIG.pitCenterX;
    const pitDz = position.z - SURVIVAL_CONFIG.pitCenterZ;
    return Math.hypot(pitDx, pitDz) <= SURVIVAL_CONFIG.pitInteractionRadius;
  }

  getCaveBounds() {
    return CAVE_BOUNDS;
  }
}
