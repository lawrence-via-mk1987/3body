import * as THREE from 'three';
import type { Terrain } from './Terrain';
import type { LandmarkMaterials } from './landmarkMaterials';
import {
  GROVE_LANDMARK,
  OBSERVATORY_LANDMARK,
  PIT_LANDMARK,
} from './landmarks';
import { seededRandom } from './meshKit';

/**
 * Instanced rocks, pit banners, and dehydration-row bundles — fewer draw calls than meshKit loops.
 */
export class SetDressing {
  readonly group = new THREE.Group();

  constructor(terrain: Terrain, mats: LandmarkMaterials) {
    this.group.name = 'SetDressing';
    this.buildScatterRocks(terrain, mats);
    this.buildBanners(terrain, mats);
    this.buildDehydrationBundles(terrain, mats);
  }

  private buildScatterRocks(terrain: Terrain, mats: LandmarkMaterials): void {
    const geo = new THREE.DodecahedronGeometry(1, 0);
    const material = mats.stone.clone();
    material.roughness = 0.92;
    const count = 52;
    const mesh = new THREE.InstancedMesh(geo, material, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const dummy = new THREE.Object3D();
    const rnd = seededRandom(8801);
    let i = 0;
    const clusters = [
      { cx: PIT_LANDMARK.x, cz: PIT_LANDMARK.z, r: 14, n: 22 },
      { cx: OBSERVATORY_LANDMARK.x, cz: OBSERVATORY_LANDMARK.z, r: 16, n: 18 },
      { cx: GROVE_LANDMARK.x, cz: GROVE_LANDMARK.z, r: 11, n: 12 },
    ];
    for (const cluster of clusters) {
      for (let k = 0; k < cluster.n && i < count; k += 1, i += 1) {
        const a = rnd() * Math.PI * 2;
        const r = cluster.r * (0.45 + rnd() * 0.55);
        const x = cluster.cx + Math.cos(a) * r;
        const z = cluster.cz + Math.sin(a) * r;
        const y = terrain.getHeightAt(x, z);
        const s = 0.18 + rnd() * 0.42;
        dummy.position.set(x, y + s * 0.35, z);
        dummy.rotation.set(rnd() * 0.4, rnd() * Math.PI, rnd() * 0.35);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
    }
    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  private buildBanners(terrain: Terrain, mats: LandmarkMaterials): void {
    const poleGeo = new THREE.CylinderGeometry(0.05, 0.06, 3.4, 6);
    const clothGeo = new THREE.PlaneGeometry(1.1, 1.65);
    const poleMat = mats.wood.clone();
    const clothMat = new THREE.MeshStandardMaterial({
      color: '#9a3030',
      roughness: 0.88,
      side: THREE.DoubleSide,
      emissive: '#4a1010',
      emissiveIntensity: 0.12,
    });
    clothMat.userData.banner = true;
    const placements = [
      { x: PIT_LANDMARK.x - 8, z: PIT_LANDMARK.z + 11, yaw: 0.5 },
      { x: PIT_LANDMARK.x + 12, z: PIT_LANDMARK.z - 4, yaw: -1.2 },
      { x: OBSERVATORY_LANDMARK.x - 7, z: OBSERVATORY_LANDMARK.z + 9, yaw: 2.1 },
      { x: OBSERVATORY_LANDMARK.x + 10, z: OBSERVATORY_LANDMARK.z - 6, yaw: -0.4 },
    ];
    const poleMesh = new THREE.InstancedMesh(poleGeo, poleMat, placements.length);
    const bannerMesh = new THREE.InstancedMesh(clothGeo, clothMat, placements.length);
    poleMesh.castShadow = true;
    bannerMesh.castShadow = true;
    const dummy = new THREE.Object3D();
    placements.forEach((p, idx) => {
      const y = terrain.getHeightAt(p.x, p.z);
      dummy.position.set(p.x, y + 1.7, p.z);
      dummy.rotation.set(0, p.yaw, 0);
      dummy.updateMatrix();
      poleMesh.setMatrixAt(idx, dummy.matrix);
      dummy.position.set(p.x + Math.sin(p.yaw) * 0.35, y + 2.55, p.z + Math.cos(p.yaw) * 0.35);
      dummy.rotation.set(0, p.yaw + Math.PI / 2, 0.08);
      dummy.updateMatrix();
      bannerMesh.setMatrixAt(idx, dummy.matrix);
    });
    poleMesh.instanceMatrix.needsUpdate = true;
    bannerMesh.instanceMatrix.needsUpdate = true;
    this.group.add(poleMesh, bannerMesh);
  }

  private buildDehydrationBundles(terrain: Terrain, mats: LandmarkMaterials): void {
    const geo = new THREE.CapsuleGeometry(0.22, 0.55, 4, 8);
    const material = mats.charcoal.clone();
    material.roughness = 0.95;
    const count = 24;
    const mesh = new THREE.InstancedMesh(geo, material, count);
    mesh.castShadow = true;
    const { x, z } = PIT_LANDMARK;
    const floorY = terrain.getHeightAt(x, z) - 2.8;
    const rnd = seededRandom(902);
    const dummy = new THREE.Object3D();
    let i = 0;
    for (let row = -1; row <= 1; row += 1) {
      for (let col = -2; col <= 1; col += 1) {
        if (i >= count) {
          break;
        }
        const px = x + col * 1.85 + (rnd() - 0.5) * 0.25;
        const pz = z + row * 2.15 + (rnd() - 0.5) * 0.25;
        const py = floorY + 0.22;
        dummy.position.set(px, py, pz);
        dummy.rotation.set(0.15 + rnd() * 0.2, rnd() * Math.PI, 0.1);
        dummy.scale.set(0.85 + rnd() * 0.35, 1, 0.85 + rnd() * 0.25);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        i += 1;
      }
    }
    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
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
