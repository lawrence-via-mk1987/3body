import * as THREE from 'three';
import type { EraKind } from '../orbital/types';
import type { Terrain } from './Terrain';
import { LAST_PREDICTOR } from './landmarks';

/** Ritual pendulum beside the Last Predictor — chaos swings fast; Stable Era nearly still. */
export class ObservatoryPendulum {
  readonly group = new THREE.Group();
  private readonly arm: THREE.Group;
  private time = 0;
  private forecastCalibrated = false;

  constructor(terrain: Terrain) {
    const x = LAST_PREDICTOR.x - 2.8;
    const z = LAST_PREDICTOR.z + 2.2;
    const ground = terrain.getHeightAt(x, z);

    const frameMat = new THREE.MeshStandardMaterial({ color: '#6a5848', roughness: 0.92 });
    const bobMat = new THREE.MeshStandardMaterial({
      color: '#8a7060',
      roughness: 0.75,
      metalness: 0.15,
      emissive: '#201810',
      emissiveIntensity: 0.12,
    });
    const cordMat = new THREE.MeshStandardMaterial({ color: '#3a3028', roughness: 0.95 });

    for (const side of [-1.1, 1.1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 3.4, 7), frameMat);
      post.position.set(side, ground + 1.7, 0);
      post.castShadow = true;
      this.group.add(post);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.16), frameMat);
    beam.position.set(0, ground + 3.35, 0);
    beam.castShadow = true;
    this.group.add(beam);

    this.arm = new THREE.Group();
    this.arm.position.set(0, ground + 3.28, 0);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.05, 6), cordMat);
    cord.position.y = -1.02;
    cord.castShadow = true;
    const bob = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), bobMat);
    bob.scale.set(0.85, 1.15, 0.75);
    bob.position.y = -2.05;
    bob.castShadow = true;
    this.arm.add(cord, bob);
    this.group.add(this.arm);
    this.group.position.set(x, 0, z);
  }

  setForecastCalibrated(calibrated: boolean): void {
    this.forecastCalibrated = calibrated;
  }

  update(delta: number, era: EraKind): void {
    this.time += delta;
    const stable = era === 'stable';
    let speed = stable ? 0.35 : 2.6 + Math.sin(this.time * 0.4) * 0.35;
    if (!stable && this.forecastCalibrated) {
      speed *= 0.72;
    }
    const amplitude = stable ? 0.045 : 0.62;
    this.arm.rotation.z = Math.sin(this.time * speed) * amplitude;
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else {
          mat.dispose();
        }
      }
    });
  }
}
