import * as THREE from 'three';
import type { Terrain } from './Terrain';
import { PIT_SITE } from './Terrain';
import { PIT_LANDMARK } from './landmarks';
import { seededRandom } from './meshKit';

interface HerdMember {
  herd: number;
  offsetX: number;
  offsetZ: number;
  phase: number;
}

interface HerdState {
  angle: number;
  speed: number;
  radius: number;
}

/**
 * Pack animals grazing the pit rim during Stable Eras — larger and calmer than skitters.
 */
export class StablePitHerds {
  readonly group = new THREE.Group();
  private readonly bodies: THREE.InstancedMesh;
  private readonly heads: THREE.InstancedMesh;
  private readonly members: HerdMember[];
  private readonly herds: HerdState[];
  private blend = 0;
  private time = 0;

  constructor(terrain: Terrain, herdCount: number, membersPerHerd: number) {
    const rnd = seededRandom(9301);
    this.herds = [];
    for (let h = 0; h < herdCount; h += 1) {
      this.herds.push({
        angle: rnd() * Math.PI * 2,
        speed: 0.08 + rnd() * 0.06,
        radius: PIT_SITE.rimRadius + 2.2 + rnd() * 3.5,
      });
    }

    this.members = [];
    for (let h = 0; h < herdCount; h += 1) {
      for (let m = 0; m < membersPerHerd; m += 1) {
        this.members.push({
          herd: h,
          offsetX: (rnd() - 0.5) * 2.8,
          offsetZ: (rnd() - 0.5) * 2.8,
          phase: rnd() * Math.PI * 2,
        });
      }
    }

    const bodyGeo = new THREE.BoxGeometry(0.55, 0.38, 0.28);
    const headGeo = new THREE.BoxGeometry(0.22, 0.2, 0.34);
    headGeo.translate(0.32, 0.06, 0);
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#6a5844', roughness: 0.88 });
    const headMat = new THREE.MeshStandardMaterial({ color: '#7a6850', roughness: 0.85 });

    this.bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, this.members.length);
    this.heads = new THREE.InstancedMesh(headGeo, headMat, this.members.length);
    this.bodies.castShadow = true;
    this.heads.castShadow = true;

    this.group.add(this.bodies, this.heads);
    this.writeMatrices(0, terrain);
  }

  setStable(active: boolean, delta: number, terrain: Terrain): void {
    this.time += delta;
    this.blend = THREE.MathUtils.lerp(this.blend, active ? 1 : 0, Math.min(delta * 1.6, 1));
    if (this.blend > 0.02) {
      for (const herd of this.herds) {
        herd.angle += delta * herd.speed;
      }
      this.writeMatrices(this.blend, terrain);
    }
    const visible = this.blend > 0.04;
    this.bodies.visible = visible;
    this.heads.visible = visible;
    for (const mesh of [this.bodies, this.heads]) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = this.blend;
      mat.transparent = this.blend < 0.98;
    }
  }

  private writeMatrices(blend: number, terrain: Terrain): void {
    const dummy = new THREE.Object3D();
    const { x: cx, z: cz } = PIT_LANDMARK;
    for (let i = 0; i < this.members.length; i += 1) {
      const member = this.members[i]!;
      const herd = this.herds[member.herd]!;
      const hx = cx + Math.cos(herd.angle) * herd.radius;
      const hz = cz + Math.sin(herd.angle) * herd.radius;
      const yaw = herd.angle + Math.PI / 2;
      const cos = Math.cos(yaw);
      const sin = Math.sin(yaw);
      const lx = member.offsetX * cos - member.offsetZ * sin;
      const lz = member.offsetX * sin + member.offsetZ * cos;
      const x = hx + lx;
      const z = hz + lz;
      const ground = terrain.getHeightAt(x, z);
      const bob = Math.sin(this.time * 2 + member.phase) * 0.03 * blend;
      dummy.position.set(x, ground + 0.28 + bob, z);
      dummy.rotation.y = yaw + Math.sin(this.time * 0.6 + member.phase) * 0.08;
      dummy.scale.setScalar(0.85 + blend * 0.15);
      dummy.updateMatrix();
      this.bodies.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, ground + 0.34 + bob, z);
      dummy.rotation.y = dummy.rotation.y;
      dummy.updateMatrix();
      this.heads.setMatrixAt(i, dummy.matrix);
    }
    this.bodies.instanceMatrix.needsUpdate = true;
    this.heads.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.bodies.geometry.dispose();
    this.heads.geometry.dispose();
    (this.bodies.material as THREE.Material).dispose();
    (this.heads.material as THREE.Material).dispose();
  }
}
