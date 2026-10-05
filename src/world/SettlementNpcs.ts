import * as THREE from 'three';
import type { EraKind } from '../orbital/types';
import type { Terrain } from './Terrain';
import { GROVE_KEEPER, LAST_PREDICTOR } from './landmarks';
import {
  applyNpcGlow,
  buildHumanoidNpc,
  stepHumanoidIdle,
  GROVE_KEEPER_STYLE,
  PREDICTOR_STYLE,
} from './HumanoidNpc';
import { addContactShadow } from './contactShadow';

export class SettlementNpcs {
  readonly group = new THREE.Group();
  readonly predictorGroup = new THREE.Group();
  readonly groveKeeperGroup = new THREE.Group();
  private proceduralPredictor: THREE.Object3D | null = null;

  constructor(terrain: Terrain) {
    this.buildPredictor(terrain);
    this.buildGroveKeeper(terrain);
    this.group.add(this.predictorGroup, this.groveKeeperGroup);
  }

  private buildPredictor(terrain: Terrain): void {
    const figure = buildHumanoidNpc(PREDICTOR_STYLE, 'skyward', (hands) => {
      const wood = new THREE.MeshStandardMaterial({ color: '#6a5038', roughness: 0.9 });
      const dialMat = new THREE.MeshStandardMaterial({
        color: '#b08a4a',
        emissive: PREDICTOR_STYLE.accentEmissive,
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.6,
      });
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.7, 7), wood);
      staff.position.y = -0.15;
      staff.castShadow = true;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 6, 20), dialMat);
      ring.position.y = 0.55;
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.01, 6, 16), dialMat);
      ring2.position.y = 0.55;
      ring2.rotation.x = 1.1;
      hands.right.add(staff, ring, ring2);
    });
    this.proceduralPredictor = figure;
    this.predictorGroup.add(figure);
    addContactShadow(this.predictorGroup, 0.62);
    const y = terrain.getHeightAt(LAST_PREDICTOR.x, LAST_PREDICTOR.z);
    this.predictorGroup.position.set(LAST_PREDICTOR.x, y, LAST_PREDICTOR.z);
    this.predictorGroup.rotation.y = -0.6;
  }

  private buildGroveKeeper(terrain: Terrain): void {
    const figure = buildHumanoidNpc(GROVE_KEEPER_STYLE, 'tending', (hands) => {
      const vineMat = new THREE.MeshStandardMaterial({
        color: '#6aaa48',
        emissive: GROVE_KEEPER_STYLE.accentEmissive,
        emissiveIntensity: 0.25,
        roughness: 0.85,
      });
      for (let i = 0; i < 4; i += 1) {
        const sprig = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.26, 5), vineMat);
        sprig.position.set((i - 1.5) * 0.035, -0.1, 0.02);
        sprig.rotation.z = (i - 1.5) * 0.18;
        hands.left.add(sprig);
      }
      const basket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.08, 0.1, 8, 1, true),
        new THREE.MeshStandardMaterial({ color: '#8a6840', roughness: 0.95, side: THREE.DoubleSide }),
      );
      basket.position.y = -0.08;
      hands.belt.add(basket);
    });
    this.groveKeeperGroup.add(figure);
    addContactShadow(this.groveKeeperGroup, 0.58);
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
    applyNpcGlow(group, intensity);
    stepHumanoidIdle(group, pulseTime);
  }

  swapPredictorMesh(heroRoot: THREE.Object3D): void {
    if (this.proceduralPredictor) {
      this.proceduralPredictor.visible = false;
    }
    heroRoot.position.set(0, 0, 0);
    heroRoot.rotation.set(0, 0, 0);
    this.predictorGroup.add(heroRoot);
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
