import * as THREE from 'three';
import type { Terrain } from './Terrain';
import { GROVE_SITE, OBSERVATORY_SITE, PIT_SITE } from './Terrain';
import { SPAWN_HINT } from './landmarks';
import { seededRandom } from './meshKit';

interface TreeSlot {
  x: number;
  z: number;
  ground: number;
  height: number;
  yaw: number;
  lean: number;
}

function pickTreeSlots(count: number, terrain: Terrain): TreeSlot[] {
  const rnd = seededRandom(8801);
  const slots: TreeSlot[] = [];
  const hubs = [
    { x: GROVE_SITE.x, z: GROVE_SITE.z, inner: GROVE_SITE.flatRadius + 2, outer: 28 },
    { x: SPAWN_HINT.x, z: SPAWN_HINT.z, inner: 6, outer: 22 },
    { x: PIT_SITE.x, z: PIT_SITE.z, inner: PIT_SITE.flatRadius + 1, outer: 24 },
    { x: OBSERVATORY_SITE.x, z: OBSERVATORY_SITE.z, inner: OBSERVATORY_SITE.flatRadius + 2, outer: 20 },
  ];
  let attempts = 0;
  while (slots.length < count && attempts < count * 40) {
    attempts += 1;
    const hub = hubs[Math.floor(rnd() * hubs.length)]!;
    const angle = rnd() * Math.PI * 2;
    const radius = hub.inner + rnd() * (hub.outer - hub.inner);
    const x = hub.x + Math.cos(angle) * radius;
    const z = hub.z + Math.sin(angle) * radius;
    if (Math.hypot(x - PIT_SITE.x, z - PIT_SITE.z) < PIT_SITE.floorRadius + 2) {
      continue;
    }
    if (Math.hypot(x - GROVE_SITE.x, z - GROVE_SITE.z) < GROVE_SITE.poolRadius + 1.2) {
      continue;
    }
    const tooClose = slots.some((s) => Math.hypot(s.x - x, s.z - z) < 5.5);
    if (tooClose) {
      continue;
    }
    slots.push({
      x,
      z,
      ground: terrain.getHeightAt(x, z),
      height: 2.1 + rnd() * 1.4,
      yaw: rnd() * Math.PI,
      lean: (rnd() - 0.5) * 0.12,
    });
  }
  return slots;
}

/**
 * Drought-tolerant scrub trees that fade in during Stable Eras — fills the wasteland
 * between landmarks without rebuilding geometry each era.
 */
export class StableScatterTrees {
  readonly group = new THREE.Group();
  private readonly trunk: THREE.InstancedMesh;
  private readonly canopy: THREE.InstancedMesh;
  private readonly slots: TreeSlot[];
  private grow = 0;

  constructor(terrain: Terrain, count: number) {
    this.slots = pickTreeSlots(count, terrain);
    const trunkGeo = new THREE.CylinderGeometry(0.11, 0.22, 1, 6, 2);
    const canopyGeo = new THREE.IcosahedronGeometry(0.75, 1);
    canopyGeo.scale(1.15, 0.72, 1.15);

    const bark = new THREE.MeshStandardMaterial({ color: '#4a3828', roughness: 0.95, transparent: true });
    const foliage = new THREE.MeshStandardMaterial({
      color: '#3d6a32',
      roughness: 0.88,
      emissive: '#142810',
      emissiveIntensity: 0.35,
      transparent: true,
    });

    this.trunk = new THREE.InstancedMesh(trunkGeo, bark, this.slots.length);
    this.canopy = new THREE.InstancedMesh(canopyGeo, foliage, this.slots.length);
    this.trunk.castShadow = true;
    this.canopy.castShadow = true;
    this.trunk.receiveShadow = true;
    this.canopy.receiveShadow = true;

    this.group.add(this.trunk, this.canopy);
    this.writeMatrices(0);
  }

  setStable(active: boolean, delta: number): void {
    this.grow = THREE.MathUtils.lerp(this.grow, active ? 1 : 0, Math.min(delta * 1.8, 1));
    this.writeMatrices(this.grow);
    const visible = this.grow > 0.03;
    this.trunk.visible = visible;
    this.canopy.visible = visible;
    const foliage = this.canopy.material as THREE.MeshStandardMaterial;
    foliage.emissiveIntensity = 0.08 + this.grow * 0.45;
    foliage.opacity = this.grow;
    (this.trunk.material as THREE.MeshStandardMaterial).opacity = this.grow;
  }

  private writeMatrices(g: number): void {
    const scale = 0.05 + g * 0.95;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.slots.length; i += 1) {
      const slot = this.slots[i]!;
      dummy.position.set(slot.x, slot.ground + slot.height * 0.5 * scale, slot.z);
      dummy.rotation.set(slot.lean * scale, slot.yaw, slot.lean * 0.4 * scale);
      dummy.scale.set(scale, slot.height * scale, scale);
      dummy.updateMatrix();
      this.trunk.setMatrixAt(i, dummy.matrix);

      dummy.position.set(slot.x, slot.ground + slot.height * 0.92 * scale, slot.z);
      dummy.rotation.set(0, slot.yaw, 0);
      const canopyScale = (0.85 + slot.height * 0.08) * scale;
      dummy.scale.set(canopyScale, canopyScale, canopyScale);
      dummy.updateMatrix();
      this.canopy.setMatrixAt(i, dummy.matrix);
    }
    this.trunk.instanceMatrix.needsUpdate = true;
    this.canopy.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.trunk.geometry.dispose();
    this.canopy.geometry.dispose();
    (this.trunk.material as THREE.Material).dispose();
    (this.canopy.material as THREE.Material).dispose();
  }
}
