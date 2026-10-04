import * as THREE from 'three';
import type { Terrain } from './Terrain';
import { GROVE_SITE } from './Terrain';
import { PIT_LANDMARK, SPAWN_HINT } from './landmarks';
import { seededRandom } from './meshKit';

interface Critter {
  homeX: number;
  homeZ: number;
  angle: number;
  radius: number;
  speed: number;
}

interface Bird {
  centerX: number;
  centerZ: number;
  radius: number;
  height: number;
  angle: number;
  speed: number;
  wing: number;
}

function buildCritters(count: number): Critter[] {
  const rnd = seededRandom(9103);
  const out: Critter[] = [];
  const seeds = [
    { x: GROVE_SITE.x, z: GROVE_SITE.z, r: 11 },
    { x: PIT_LANDMARK.x, z: PIT_LANDMARK.z, r: 14 },
    { x: SPAWN_HINT.x, z: SPAWN_HINT.z, r: 10 },
  ];
  for (let i = 0; i < count; i += 1) {
    const hub = seeds[i % seeds.length]!;
    const a = rnd() * Math.PI * 2;
    const dist = 4 + rnd() * hub.r;
    out.push({
      homeX: hub.x + Math.cos(a) * dist,
      homeZ: hub.z + Math.sin(a) * dist,
      angle: rnd() * Math.PI * 2,
      radius: 1.2 + rnd() * 2.4,
      speed: 0.35 + rnd() * 0.55,
    });
  }
  return out;
}

function buildBirds(count: number): Bird[] {
  const rnd = seededRandom(9107);
  const out: Bird[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = rnd() * Math.PI * 2;
    const radius = GROVE_SITE.poolRadius + 4 + rnd() * 14;
    out.push({
      centerX: GROVE_SITE.x,
      centerZ: GROVE_SITE.z,
      radius,
      height: 3.5 + rnd() * 5,
      angle,
      speed: 0.25 + rnd() * 0.35,
      wing: rnd() * Math.PI * 2,
    });
  }
  return out;
}

/** Small ground skitters and distant birds — only lively during Stable Eras. */
export class StableWildlife {
  readonly group = new THREE.Group();
  private readonly critters: THREE.InstancedMesh;
  private readonly birds: THREE.InstancedMesh;
  private readonly critterState: Critter[];
  private readonly birdState: Bird[];
  private blend = 0;
  private time = 0;

  constructor(terrain: Terrain, critterCount: number, birdCount: number) {
    this.critterState = buildCritters(critterCount);
    this.birdState = buildBirds(birdCount);

    const critterGeo = new THREE.CapsuleGeometry(0.12, 0.22, 4, 6);
    const critterMat = new THREE.MeshStandardMaterial({ color: '#7a6a52', roughness: 0.85 });
    this.critters = new THREE.InstancedMesh(critterGeo, critterMat, this.critterState.length);
    this.critters.castShadow = false;

    const birdGeo = new THREE.ConeGeometry(0.14, 0.32, 4);
    birdGeo.rotateX(Math.PI / 2);
    const birdMat = new THREE.MeshStandardMaterial({
      color: '#c8b898',
      roughness: 0.7,
      emissive: '#302818',
      emissiveIntensity: 0.2,
    });
    this.birds = new THREE.InstancedMesh(birdGeo, birdMat, this.birdState.length);

    this.group.add(this.critters, this.birds);
    this.applyBlend(0, terrain);
  }

  setStable(active: boolean, delta: number, terrain: Terrain): void {
    this.time += delta;
    this.blend = THREE.MathUtils.lerp(this.blend, active ? 1 : 0, Math.min(delta * 2.2, 1));
    if (this.blend > 0.02) {
      this.tickCritters(delta, terrain);
      this.tickBirds(delta, terrain);
    }
    this.applyBlend(this.blend, terrain);
  }

  private tickCritters(delta: number, terrain: Terrain): void {
    for (let i = 0; i < this.critterState.length; i += 1) {
      const c = this.critterState[i]!;
      c.angle += delta * c.speed;
      const x = c.homeX + Math.cos(c.angle) * c.radius;
      const z = c.homeZ + Math.sin(c.angle) * c.radius;
      const y = terrain.getHeightAt(x, z) + 0.18;
      const dummy = new THREE.Object3D();
      dummy.position.set(x, y, z);
      dummy.rotation.y = c.angle + Math.PI / 2;
      dummy.updateMatrix();
      this.critters.setMatrixAt(i, dummy.matrix);
    }
    this.critters.instanceMatrix.needsUpdate = true;
  }

  private tickBirds(delta: number, terrain: Terrain): void {
    for (let i = 0; i < this.birdState.length; i += 1) {
      const b = this.birdState[i]!;
      b.angle += delta * b.speed;
      b.wing += delta * 9;
      const x = b.centerX + Math.cos(b.angle) * b.radius;
      const z = b.centerZ + Math.sin(b.angle) * b.radius;
      const ground = terrain.getHeightAt(x, z);
      const y = ground + b.height + Math.sin(b.wing) * 0.12;
      const dummy = new THREE.Object3D();
      dummy.position.set(x, y, z);
      dummy.rotation.y = b.angle + Math.PI / 2;
      dummy.rotation.z = Math.sin(b.wing) * 0.35;
      dummy.updateMatrix();
      this.birds.setMatrixAt(i, dummy.matrix);
    }
    this.birds.instanceMatrix.needsUpdate = true;
  }

  private applyBlend(g: number, _terrain: Terrain): void {
    const visible = g > 0.04;
    this.critters.visible = visible;
    this.birds.visible = visible;
    for (const mesh of [this.critters, this.birds]) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = g;
      mat.transparent = g < 0.98;
    }
  }

  dispose(): void {
    this.critters.geometry.dispose();
    this.birds.geometry.dispose();
    (this.critters.material as THREE.Material).dispose();
    (this.birds.material as THREE.Material).dispose();
  }
}
