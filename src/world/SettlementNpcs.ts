import * as THREE from 'three';
import type { EraKind } from '../orbital/types';
import type { Terrain } from './Terrain';
import { GROVE_KEEPER, LAST_PREDICTOR } from './landmarks';

export class SettlementNpcs {
  readonly group = new THREE.Group();
  readonly predictorGroup = new THREE.Group();
  readonly groveKeeperGroup = new THREE.Group();

  constructor(terrain: Terrain) {
    this.buildPredictor(terrain);
    this.buildGroveKeeper(terrain);
    this.group.add(this.predictorGroup, this.groveKeeperGroup);
  }

  private buildPredictor(terrain: Terrain): void {
    const mat = new THREE.MeshStandardMaterial({
      color: '#4a5868',
      roughness: 0.85,
      emissive: '#1a2838',
      emissiveIntensity: 0.55,
    });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.52, 1.25, 4, 8), mat);
    body.position.y = 1;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), mat);
    head.position.y = 1.75;

    const dial = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.08, 6, 24),
      new THREE.MeshStandardMaterial({
        color: '#8ec8ff',
        emissive: '#4a88b8',
        emissiveIntensity: 0.5,
        roughness: 0.4,
      }),
    );
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0.55, 1.35, 0.35);

    const footRing = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.15, 24),
      new THREE.MeshBasicMaterial({
        color: '#8ec8ff',
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      }),
    );
    footRing.rotation.x = -Math.PI / 2;
    footRing.position.y = 0.05;

    this.predictorGroup.add(body, head, dial, footRing);
    this.predictorGroup.scale.setScalar(1.45);
    const y = terrain.getHeightAt(LAST_PREDICTOR.x, LAST_PREDICTOR.z);
    this.predictorGroup.position.set(LAST_PREDICTOR.x, y, LAST_PREDICTOR.z);
    this.predictorGroup.rotation.y = -0.6;
  }

  private buildGroveKeeper(terrain: Terrain): void {
    const mat = new THREE.MeshStandardMaterial({
      color: '#5a7048',
      roughness: 0.9,
      emissive: '#2a4020',
      emissiveIntensity: 0.25,
    });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.95, 4, 8), mat);
    body.position.y = 0.95;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), mat);
    head.position.y = 1.65;

    const vine = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.05, 6, 16),
      new THREE.MeshStandardMaterial({
        color: '#8ab86a',
        emissive: '#4a7840',
        emissiveIntensity: 0.35,
        roughness: 0.95,
      }),
    );
    vine.rotation.x = Math.PI / 2.4;
    vine.position.y = 1.35;

    const footRing = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1.1, 24),
      new THREE.MeshBasicMaterial({
        color: '#8ab86a',
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      }),
    );
    footRing.rotation.x = -Math.PI / 2;
    footRing.position.y = 0.05;

    this.groveKeeperGroup.add(body, head, vine, footRing);
    this.groveKeeperGroup.scale.setScalar(1.45);
    const y = terrain.getHeightAt(GROVE_KEEPER.x, GROVE_KEEPER.z);
    this.groveKeeperGroup.position.set(GROVE_KEEPER.x, y, GROVE_KEEPER.z);
    this.groveKeeperGroup.rotation.y = 2.2;
    this.groveKeeperGroup.visible = false;
  }

  update(era: EraKind, playerPosition: THREE.Vector3, pulseTime: number): void {
    const stable = era === 'stable';
    this.groveKeeperGroup.visible = stable;

    const nearPredictor = this.isNearPredictor(playerPosition);
    this.setGroupGlow(this.predictorGroup, nearPredictor, pulseTime, 0.35, 0.65);

    if (stable) {
      const nearKeeper = this.isNearGroveKeeper(playerPosition);
      this.setGroupGlow(this.groveKeeperGroup, nearKeeper, pulseTime, 0.3, 0.55);
    }
  }

  private setGroupGlow(
    group: THREE.Group,
    near: boolean,
    pulseTime: number,
    base: number,
    nearBoost: number,
  ): void {
    const intensity = near
      ? nearBoost + Math.sin(pulseTime * 3) * 0.1
      : base + Math.sin(pulseTime * 2) * 0.05;
    for (const child of group.children) {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = intensity;
      }
    }
  }

  isNearPredictor(position: THREE.Vector3): boolean {
    return Math.hypot(position.x - LAST_PREDICTOR.x, position.z - LAST_PREDICTOR.z)
      <= LAST_PREDICTOR.talkRadius;
  }

  isNearGroveKeeper(position: THREE.Vector3): boolean {
    return Math.hypot(position.x - GROVE_KEEPER.x, position.z - GROVE_KEEPER.z)
      <= GROVE_KEEPER.talkRadius;
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
