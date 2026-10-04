import * as THREE from 'three';
import { GROVE_SITE } from './Terrain';
import { applyGrovePoolWater, type GrovePoolWaterUniforms } from './grovePoolWater';

const GROVE_X = 28;
const GROVE_Z = -32;
const INTERACT_RADIUS = 9;

export interface PoolSkyReflection {
  top: THREE.Color;
  horizon: THREE.Color;
  sunDirection: THREE.Vector3;
  sunStrength: number;
}

/**
 * The grove pool. The basin is carved into the terrain; this is the water surface that fills
 * it during a Stable Era. Custom fresnel + sky tint on top of the scene environment map.
 */
export class WaterSource {
  readonly mesh: THREE.Mesh;
  private visible = false;
  private readonly material: THREE.MeshStandardMaterial;
  private readonly waterUniforms: GrovePoolWaterUniforms;

  constructor() {
    this.waterUniforms = {
      uTime: { value: 0 },
      uHorizon: { value: new THREE.Color('#e6bf84') },
      uTop: { value: new THREE.Color('#4f7e8a') },
      uSunDir: { value: new THREE.Vector3(0.3, 0.85, 0.2) },
      uSunStrength: { value: 0.6 },
      uRipple: { value: 0 },
    };
    this.material = new THREE.MeshStandardMaterial({
      color: '#1a4852',
      roughness: 0.035,
      metalness: 0.12,
      transparent: true,
      opacity: 0.94,
      envMapIntensity: 2.65,
    });
    applyGrovePoolWater(this.material, this.waterUniforms);
    this.mesh = new THREE.Mesh(new THREE.CircleGeometry(GROVE_SITE.poolRadius - 0.25, 56), this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(GROVE_X, GROVE_SITE.level - GROVE_SITE.poolDepth * 0.45, GROVE_Z);
    this.mesh.receiveShadow = true;
    this.mesh.visible = false;
  }

  setStableEraActive(active: boolean): void {
    this.visible = active;
    this.mesh.visible = active;
    this.waterUniforms.uRipple.value = active ? 1 : 0;
  }

  setSkyReflection(sky: PoolSkyReflection, delta: number): void {
    if (!this.visible) {
      return;
    }
    this.waterUniforms.uTime.value += delta;
    this.waterUniforms.uHorizon.value.copy(sky.horizon);
    this.waterUniforms.uTop.value.copy(sky.top);
    this.waterUniforms.uSunDir.value.copy(sky.sunDirection);
    this.waterUniforms.uSunStrength.value = sky.sunStrength;
    this.material.envMapIntensity = THREE.MathUtils.lerp(
      this.material.envMapIntensity,
      2.4 + sky.sunStrength * 0.55,
      Math.min(delta * 2, 1),
    );
    this.material.roughness = 0.028 + Math.sin(this.waterUniforms.uTime.value * 0.9) * 0.012;
  }

  isNear(position: THREE.Vector3): boolean {
    if (!this.visible) {
      return false;
    }
    return Math.hypot(position.x - GROVE_X, position.z - GROVE_Z) <= INTERACT_RADIUS;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

export const WATER_REFILL_AMOUNT = 28;
