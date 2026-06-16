import * as THREE from 'three';
import type { Terrain } from './Terrain';

const RUIN_STONE = new THREE.MeshStandardMaterial({
  color: '#5a4a3e',
  roughness: 0.96,
  metalness: 0.02,
});

const RUIN_DARK = new THREE.MeshStandardMaterial({
  color: '#3a2d24',
  roughness: 1,
});

export class Ruins {
  readonly group = new THREE.Group();
  readonly groveGroup = new THREE.Group();

  constructor(private readonly terrain: Terrain) {
    this.buildObservatory();
    this.buildCollapsedShelter();
    this.buildDehydrationRows();
    this.buildGrove();
    this.buildWaystone();
  }

  setStableEraActive(active: boolean): void {
    for (const child of this.groveGroup.children) {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (child.userData.groveType === 'trunk') {
          material.color.set(active ? '#5a4a30' : '#3a3028');
        }
        if (child.userData.groveType === 'canopy') {
          material.color.set(active ? '#4a7a42' : '#2a2820');
          material.emissive.set(active ? '#1a3018' : '#000000');
          material.emissiveIntensity = active ? 0.2 : 0;
        }
        if (child.userData.groveType === 'grass') {
          material.opacity = active ? 0.85 : 0.15;
        }
      }
    }
  }

  private placeOnTerrain(mesh: THREE.Object3D, x: number, z: number, yOffset = 0): void {
    mesh.position.set(x, this.terrain.getHeightAt(x, z) + yOffset, z);
  }

  private buildObservatory(): void {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      RUIN_STONE,
    );
    this.placeOnTerrain(dome, 45, -35);
    dome.scale.set(1, 0.7, 1);
    dome.castShadow = true;
    dome.receiveShadow = true;

    const brokenArc = new THREE.Mesh(
      new THREE.TorusGeometry(3.8, 0.35, 8, 24, Math.PI * 1.2),
      RUIN_DARK,
    );
    brokenArc.rotation.x = Math.PI / 2;
    brokenArc.rotation.z = 0.4;
    this.placeOnTerrain(brokenArc, 45, -35, 2.2);

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 3.6, 8), RUIN_STONE);
    this.placeOnTerrain(pillar, 43, -33, 1.8);
    pillar.castShadow = true;

    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 0.8, 0.3, 12),
      new THREE.MeshStandardMaterial({
        color: '#6a8090',
        roughness: 0.2,
        metalness: 0.5,
        transparent: true,
        opacity: 0.55,
      }),
    );
    this.placeOnTerrain(lens, 45, -35, 0.35);

    this.group.add(dome, brokenArc, pillar, lens);
  }

  private buildCollapsedShelter(): void {
    const wallA = new THREE.Mesh(new THREE.BoxGeometry(5, 2.2, 0.5), RUIN_STONE);
    this.placeOnTerrain(wallA, 20, -15, 1.1);
    wallA.rotation.y = 0.5;
    wallA.castShadow = true;

    const wallB = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.6, 0.5), RUIN_DARK);
    this.placeOnTerrain(wallB, 22, -13, 0.8);
    wallB.rotation.y = -0.8;

    const debris = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0), RUIN_DARK);
    this.placeOnTerrain(debris, 19, -14, 0.6);

    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 0.2, 10),
      new THREE.MeshStandardMaterial({ color: '#7a6a58', roughness: 0.8 }),
    );
    this.placeOnTerrain(bowl, 21, -15, 0.12);

    this.group.add(wallA, wallB, debris, bowl);
  }

  private buildDehydrationRows(): void {
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 7 + (i % 2) * 1.5;
      const x = -42 + Math.cos(angle) * radius;
      const z = 18 + Math.sin(angle) * radius;
      const form = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.25, 1.1, 4, 8),
        new THREE.MeshStandardMaterial({
          color: '#4a3a30',
          roughness: 1,
        }),
      );
      form.scale.set(1, 0.35, 1);
      this.placeOnTerrain(form, x, z, 0.2);
      form.rotation.y = angle;
      this.group.add(form);
    }
  }

  private buildGrove(): void {
    const placements = [
      { x: 24, z: -30 },
      { x: 30, z: -34 },
      { x: 34, z: -28 },
      { x: 28, z: -36 },
    ];

    for (const spot of placements) {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.28, 2.4, 6),
        new THREE.MeshStandardMaterial({ color: '#3a3028', roughness: 1 }),
      );
      trunk.userData.groveType = 'trunk';
      this.placeOnTerrain(trunk, spot.x, spot.z, 1.2);
      trunk.castShadow = true;

      const canopy = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 8, 8),
        new THREE.MeshStandardMaterial({
          color: '#2a2820',
          roughness: 0.9,
          emissive: '#000000',
        }),
      );
      canopy.userData.groveType = 'canopy';
      this.placeOnTerrain(canopy, spot.x, spot.z, 2.8);

      this.groveGroup.add(trunk, canopy);
    }

    const grassPatch = new THREE.Mesh(
      new THREE.CircleGeometry(9, 32),
      new THREE.MeshStandardMaterial({
        color: '#3a6a38',
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      }),
    );
    grassPatch.userData.groveType = 'grass';
    grassPatch.rotation.x = -Math.PI / 2;
    this.placeOnTerrain(grassPatch, 28, -32, 0.08);

    this.groveGroup.add(grassPatch);
    this.group.add(this.groveGroup);
  }

  private buildWaystone(): void {
    const stone = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 0.6), RUIN_STONE);
    this.placeOnTerrain(stone, 8, 22, 1.2);
    stone.rotation.y = -0.3;
    stone.castShadow = true;

    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 1), RUIN_DARK);
    this.placeOnTerrain(slab, 8, 22, 0.1);

    this.group.add(stone, slab);
  }
}
