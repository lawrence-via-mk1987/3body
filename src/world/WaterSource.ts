import * as THREE from 'three';
import { GROVE_SITE } from './Terrain';

const GROVE_X = 28;
const GROVE_Z = -32;
const INTERACT_RADIUS = 9;

/**
 * The grove pool. The basin is carved into the terrain; this is the water surface that fills
 * it during a Stable Era. Low roughness so it mirrors the sky via the scene environment map.
 */
export class WaterSource {
  readonly mesh: THREE.Mesh;
  private visible = false;
  private time = 0;
  private readonly material: THREE.MeshStandardMaterial;

  constructor() {
    this.material = new THREE.MeshStandardMaterial({
      color: '#1a4852',
      roughness: 0.045,
      metalness: 0.08,
      transparent: true,
      opacity: 0.92,
      envMapIntensity: 2.1,
    });
    this.mesh = new THREE.Mesh(new THREE.CircleGeometry(GROVE_SITE.poolRadius - 0.25, 48), this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(GROVE_X, GROVE_SITE.level - GROVE_SITE.poolDepth * 0.45, GROVE_Z);
    this.mesh.receiveShadow = true;
    this.mesh.visible = false;
  }

  setStableEraActive(active: boolean): void {
    this.visible = active;
    this.mesh.visible = active;
  }

  /** Gentle breathing of the surface tone so still water does not read as a painted disc. */
  update(delta: number): void {
    if (!this.visible) {
      return;
    }
    this.time += delta;
    this.material.roughness = 0.06 + Math.sin(this.time * 0.8) * 0.02;
  }

  isNear(position: THREE.Vector3): boolean {
    if (!this.visible) {
      return false;
    }
    return Math.hypot(position.x - GROVE_X, position.z - GROVE_Z) <= INTERACT_RADIUS;
  }
}

export const WATER_REFILL_AMOUNT = 28;
