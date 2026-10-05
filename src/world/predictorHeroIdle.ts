import * as THREE from 'three';
import { applyHumanoidPosture, stepHumanoidIdle } from './HumanoidNpc';

/** Skyward rest pose for rigged predictor glTF (matches procedural Last Predictor). */
export function applyPredictorHeroIdleBases(root: THREE.Object3D): void {
  root.userData.idleSeed ??= 0.37;
  applyHumanoidPosture(root, 'skyward');
}

export function stepPredictorHeroIdle(
  root: THREE.Object3D,
  pulseTime: number,
  mixer: THREE.AnimationMixer | null,
  delta: number,
): void {
  if (mixer) {
    mixer.update(delta);
    return;
  }
  if (root.getObjectByName('body')) {
    stepHumanoidIdle(root, pulseTime);
  } else {
    root.rotation.y = Math.sin(pulseTime * 0.4) * 0.04;
    root.position.y = Math.sin(pulseTime * 1.2) * 0.006;
  }
}
