import * as THREE from 'three';
import type { Terrain } from './Terrain';
import { GROVE_LANDMARK, OBSERVATORY_LANDMARK, PIT_LANDMARK, SPAWN_HINT } from './landmarks';

const STONE = new THREE.MeshStandardMaterial({ color: '#5a4a3e', roughness: 0.95 });
const WOOD = new THREE.MeshStandardMaterial({ color: '#4a3828', roughness: 1 });
const EMBER = new THREE.MeshStandardMaterial({
  color: '#ff8844',
  emissive: '#ff6622',
  emissiveIntensity: 0.85,
  roughness: 0.6,
});

export class CivilizationProps {
  readonly group = new THREE.Group();

  constructor(
    private readonly terrain: Terrain,
    stage: number,
  ) {
    this.buildBaseClutter();
    if (stage >= 1) {
      this.buildPitAge();
    }
    if (stage >= 2) {
      this.buildObservatoryScaffold();
    }
    if (stage >= 3) {
      this.buildGrovePaths();
    }
    if (stage >= 4) {
      this.buildUnifiedRoads();
    }
  }

  private place(mesh: THREE.Object3D, x: number, z: number, yOff = 0): void {
    mesh.position.set(x, this.terrain.getHeightAt(x, z) + yOff, z);
    this.group.add(mesh);
  }

  private buildBaseClutter(): void {
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      const x = SPAWN_HINT.x + Math.cos(angle) * 12;
      const z = SPAWN_HINT.z + Math.sin(angle) * 10;
      const cairn = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 0.9, 6), STONE);
      this.place(cairn, x, z, 0.45);
    }

    const cart = new THREE.Group();
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.08, 6, 12), WOOD);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(-0.8, 0.45, 0);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1), WOOD);
    bed.position.y = 0.55;
    cart.add(wheel, bed);
    this.place(cart, 4, 18, 0);

    const signal = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.2, 4), EMBER);
    this.place(signal, -8, 14, 0.6);
  }

  private buildPitAge(): void {
    for (let i = 0; i < 4; i += 1) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.8, 6), WOOD);
      const angle = (i / 4) * Math.PI * 2 + 0.2;
      this.place(post, PIT_LANDMARK.x + Math.cos(angle) * 11, PIT_LANDMARK.z + Math.sin(angle) * 11, 1.4);
    }
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.9), new THREE.MeshStandardMaterial({
      color: '#8f6a4a',
      side: THREE.DoubleSide,
      roughness: 1,
    }));
    banner.position.y = 2.2;
    this.place(banner, PIT_LANDMARK.x - 8, PIT_LANDMARK.z + 12, 2.2);
  }

  private buildObservatoryScaffold(): void {
    for (let i = 0; i < 3; i += 1) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4, 0.25), WOOD);
      this.place(beam, OBSERVATORY_LANDMARK.x - 3 + i * 3, OBSERVATORY_LANDMARK.z + 4, 2);
    }
    const fire = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), EMBER);
    this.place(fire, OBSERVATORY_LANDMARK.x + 5, OBSERVATORY_LANDMARK.z - 2, 1.2);
  }

  private buildGrovePaths(): void {
    const steps = 5;
    for (let i = 0; i < steps; i += 1) {
      const t = i / steps;
      const x = THREE.MathUtils.lerp(SPAWN_HINT.x, GROVE_LANDMARK.x, t);
      const z = THREE.MathUtils.lerp(SPAWN_HINT.z, GROVE_LANDMARK.z, t);
      const slab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.8), STONE);
      this.place(slab, x, z, 0.06);
    }
    const hearth = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.12, 8, 20), EMBER);
    hearth.rotation.x = Math.PI / 2;
    this.place(hearth, GROVE_LANDMARK.x - 4, GROVE_LANDMARK.z + 3, 0.15);
  }

  private buildUnifiedRoads(): void {
    const hubs = [PIT_LANDMARK, OBSERVATORY_LANDMARK, GROVE_LANDMARK];
    for (const hub of hubs) {
      const lantern = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 3.5, 6),
        new THREE.MeshStandardMaterial({
          color: '#3a3028',
          emissive: '#c28a5a',
          emissiveIntensity: 0.5,
        }),
      );
      this.place(lantern, hub.x, hub.z, 1.75);
    }
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
