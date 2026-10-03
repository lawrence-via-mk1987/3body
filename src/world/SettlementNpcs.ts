import * as THREE from 'three';
import type { EraKind } from '../orbital/types';
import type { Terrain } from './Terrain';
import { GROVE_KEEPER, LAST_PREDICTOR } from './landmarks';
import {
  applyNpcGlow,
  buildHumanoidNpc,
  GROVE_KEEPER_STYLE,
  PREDICTOR_STYLE,
} from './HumanoidNpc';

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
    const figure = buildHumanoidNpc(PREDICTOR_STYLE, (root) => {
      const dialMat = new THREE.MeshStandardMaterial({
        color: PREDICTOR_STYLE.accent,
        emissive: PREDICTOR_STYLE.accentEmissive,
        emissiveIntensity: 0.55,
        roughness: 0.35,
      });
      const dial = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 6, 24), dialMat);
      dial.rotation.x = Math.PI / 2;
      dial.position.set(0.48, 1.28, 0.28);
      root.add(dial);

      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.1, 6), dialMat);
      staff.position.set(0.52, 0.85, 0.22);
      staff.rotation.z = -0.15;
      root.add(staff);
    });
    this.predictorGroup.add(figure);
    this.predictorGroup.scale.setScalar(1.35);
    const y = terrain.getHeightAt(LAST_PREDICTOR.x, LAST_PREDICTOR.z);
    this.predictorGroup.position.set(LAST_PREDICTOR.x, y, LAST_PREDICTOR.z);
    this.predictorGroup.rotation.y = -0.6;
  }

  private buildGroveKeeper(terrain: Terrain): void {
    const figure = buildHumanoidNpc(GROVE_KEEPER_STYLE, (root) => {
      const vineMat = new THREE.MeshStandardMaterial({
        color: GROVE_KEEPER_STYLE.accent,
        emissive: GROVE_KEEPER_STYLE.accentEmissive,
        emissiveIntensity: 0.4,
        roughness: 0.9,
      });
      const vine = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.05, 6, 16), vineMat);
      vine.rotation.x = Math.PI / 2.3;
      vine.position.y = 1.35;
      root.add(vine);

      const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 5), vineMat);
      sprout.position.set(-0.42, 1.05, 0.15);
      sprout.rotation.z = 0.4;
      root.add(sprout);
    });
    this.groveKeeperGroup.add(figure);
    this.groveKeeperGroup.scale.setScalar(1.35);
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
