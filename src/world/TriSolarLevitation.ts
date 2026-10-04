import * as THREE from 'three';
import type { EraPhase } from '../orbital/types';
import type { Terrain } from './Terrain';
import { GROVE_LANDMARK, OBSERVATORY_LANDMARK, PIT_LANDMARK, SPAWN_HINT } from './landmarks';
import { seededRandom } from './meshKit';

interface DebrisSlot {
  x: number;
  z: number;
  baseY: number;
  size: number;
  spin: number;
  lift: number;
  wobble: number;
  kind: 0 | 1;
  /** Extra pull during Flying Star (horizon skim). */
  flyingBias: number;
}

function buildDebris(count: number, terrain: Terrain): DebrisSlot[] {
  const rnd = seededRandom(9201);
  const hubs = [SPAWN_HINT, PIT_LANDMARK, GROVE_LANDMARK, OBSERVATORY_LANDMARK];
  const slots: DebrisSlot[] = [];
  let attempts = 0;
  while (slots.length < count && attempts < count * 30) {
    attempts += 1;
    const hub = hubs[Math.floor(rnd() * hubs.length)]!;
    const angle = rnd() * Math.PI * 2;
    const dist = 3 + rnd() * 26;
    const x = hub.x + Math.cos(angle) * dist;
    const z = hub.z + Math.sin(angle) * dist;
    const baseY = terrain.getHeightAt(x, z) + 0.05 + rnd() * 0.35;
    slots.push({
      x,
      z,
      baseY,
      size: 0.18 + rnd() * 0.42,
      spin: (rnd() - 0.5) * 2.4,
      lift: 6 + rnd() * 22,
      wobble: rnd() * Math.PI * 2,
      kind: rnd() > 0.72 ? 1 : 0,
      flyingBias: rnd(),
    });
  }
  return slots;
}

type LevitationMode = 'off' | 'tri_solar' | 'flying_star';

/**
 * During Tri-Solar and Flying Star, loose stones and hide scraps lift off the ground.
 * Flying Star uses a stronger pull and higher ceiling. Visual only.
 */
export class TriSolarLevitation {
  readonly group = new THREE.Group();
  private readonly stones: THREE.InstancedMesh;
  private readonly hides: THREE.InstancedMesh;
  private readonly slots: DebrisSlot[];
  private intensity = 0;
  private targetMode: LevitationMode = 'off';
  private time = 0;
  private stoneIndices: number[] = [];
  private hideIndices: number[] = [];

  constructor(terrain: Terrain, count: number) {
    this.slots = buildDebris(count, terrain);
    for (let i = 0; i < this.slots.length; i += 1) {
      if (this.slots[i]!.kind === 1) {
        this.hideIndices.push(i);
      } else {
        this.stoneIndices.push(i);
      }
    }

    const stoneGeo = new THREE.DodecahedronGeometry(1, 0);
    const stoneMat = new THREE.MeshStandardMaterial({ color: '#9a9088', roughness: 0.95, metalness: 0, transparent: true });
    this.stones = new THREE.InstancedMesh(stoneGeo, stoneMat, Math.max(1, this.stoneIndices.length));

    const hideGeo = new THREE.PlaneGeometry(0.55, 0.35);
    const hideMat = new THREE.MeshStandardMaterial({
      color: '#8a7358',
      roughness: 0.9,
      side: THREE.DoubleSide,
      transparent: true,
    });
    this.hides = new THREE.InstancedMesh(hideGeo, hideMat, Math.max(1, this.hideIndices.length));

    this.group.add(this.stones, this.hides);
    this.applyMatrices(0, 'off');
    this.group.visible = false;
  }

  update(delta: number, phase: EraPhase): void {
    this.targetMode = phase === 'flying_star' ? 'flying_star' : phase === 'tri_solar' ? 'tri_solar' : 'off';
    const targetIntensity = this.targetMode === 'off' ? 0 : 1;
    this.time += delta;
    this.intensity = THREE.MathUtils.lerp(
      this.intensity,
      targetIntensity,
      Math.min(delta * (targetIntensity > this.intensity ? 1.4 : 2.8), 1),
    );
    const activeMode: LevitationMode = this.intensity > 0.02 ? this.targetMode : 'off';
    this.applyMatrices(this.intensity, activeMode);
    this.group.visible = this.intensity > 0.02;
    const fade = this.intensity;
    for (const mesh of [this.stones, this.hides]) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = fade;
      mat.transparent = fade < 0.98;
    }
  }

  private applyMatrices(intensity: number, mode: LevitationMode): void {
    const dummy = new THREE.Object3D();
    let si = 0;
    for (const index of this.stoneIndices) {
      this.writeMatrix(dummy, this.slots[index]!, intensity, mode);
      this.stones.setMatrixAt(si, dummy.matrix);
      si += 1;
    }
    if (si > 0) {
      this.stones.count = si;
      this.stones.instanceMatrix.needsUpdate = true;
    }

    let hi = 0;
    for (const index of this.hideIndices) {
      this.writeMatrix(dummy, this.slots[index]!, intensity, mode, true);
      this.hides.setMatrixAt(hi, dummy.matrix);
      hi += 1;
    }
    if (hi > 0) {
      this.hides.count = hi;
      this.hides.instanceMatrix.needsUpdate = true;
    }
  }

  private writeMatrix(
    dummy: THREE.Object3D,
    slot: DebrisSlot,
    intensity: number,
    mode: LevitationMode,
    flat = false,
  ): void {
    const flying = mode === 'flying_star';
    const liftMul = flying ? 2.35 + slot.flyingBias * 0.85 : 1;
    const speedMul = flying ? 2.1 : 1;
    const rise = slot.lift * intensity * liftMul;
    const wobble = Math.sin(this.time * 1.6 * speedMul + slot.wobble) * (flying ? 0.65 : 0.35) * intensity;
    const drift = flying ? Math.sin(this.time * 0.9 + slot.wobble) * 1.2 * intensity : 0;
    dummy.position.set(
      slot.x + wobble + drift,
      slot.baseY + rise + (flying ? Math.sin(this.time * 1.1 + slot.flyingBias * 6) * 1.5 * intensity : 0),
      slot.z + wobble * 0.6,
    );
    dummy.rotation.set(
      slot.spin * this.time * intensity * speedMul,
      slot.spin * 0.7 * this.time * speedMul,
      flat ? slot.spin * 0.4 * speedMul : slot.spin * 0.3 * this.time,
    );
    const s = slot.size * (0.35 + intensity * (flying ? 0.85 : 0.65));
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
  }

  dispose(): void {
    this.stones.geometry.dispose();
    this.hides.geometry.dispose();
    (this.stones.material as THREE.Material).dispose();
    (this.hides.material as THREE.Material).dispose();
  }
}
