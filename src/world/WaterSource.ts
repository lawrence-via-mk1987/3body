import * as THREE from 'three';
import type { Terrain } from './Terrain';

const GROVE_X = 28;
const GROVE_Z = -32;
const INTERACT_RADIUS = 9;

export class WaterSource {
  readonly mesh: THREE.Mesh;
  private visible = false;

  constructor(terrain: Terrain) {
    const y = terrain.getHeightAt(GROVE_X, GROVE_Z);
    this.mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.6, 0.25, 16),
      new THREE.MeshStandardMaterial({
        color: '#4a88b8',
        emissive: '#1a4060',
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.85,
        roughness: 0.2,
      }),
    );
    this.mesh.position.set(GROVE_X, y + 0.15, GROVE_Z);
    this.mesh.visible = false;
  }

  setStableEraActive(active: boolean): void {
    this.visible = active;
    this.mesh.visible = active;
  }

  isNear(position: THREE.Vector3): boolean {
    if (!this.visible) {
      return false;
    }
    return Math.hypot(position.x - GROVE_X, position.z - GROVE_Z) <= INTERACT_RADIUS;
  }
}

export const WATER_REFILL_AMOUNT = 28;
