import * as THREE from 'three';
import type { Terrain } from './Terrain';
import type { ShelterZones } from '../survival/ShelterZones';

export class CaveShelter {
  readonly group = new THREE.Group();

  constructor(terrain: Terrain, shelterZones: ShelterZones) {
    const bounds = shelterZones.getCaveBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const groundY = terrain.getHeightAt(centerX, centerZ);
    const floorY = groundY - bounds.depthBelowSurface;

    const chamberMaterial = new THREE.MeshStandardMaterial({
      color: '#3a2d24',
      roughness: 1,
      side: THREE.DoubleSide,
    });
    const entranceMaterial = new THREE.MeshStandardMaterial({
      color: '#4a382c',
      roughness: 0.96,
    });

    const chamber = new THREE.Mesh(
      new THREE.BoxGeometry(bounds.maxX - bounds.minX, 3.2, bounds.maxZ - bounds.minZ),
      chamberMaterial,
    );
    chamber.position.set(centerX, floorY + 1.4, centerZ);
    chamber.receiveShadow = true;

    const entrance = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 2.2, 3.5),
      entranceMaterial,
    );
    entrance.position.set(bounds.maxX + 1.5, groundY - 0.4, centerZ);
    entrance.rotation.y = -0.35;
    entrance.castShadow = true;
    entrance.receiveShadow = true;

    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8),
      new THREE.MeshStandardMaterial({
        color: '#8a7a62',
        emissive: '#3a3020',
        emissiveIntensity: 0.35,
      }),
    );
    marker.position.set(bounds.maxX + 2.8, groundY + 0.8, centerZ);

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 0.7),
      new THREE.MeshBasicMaterial({
        color: '#d8c7a8',
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      }),
    );
    sign.position.set(bounds.maxX + 2.8, groundY + 2.2, centerZ);
    sign.rotation.y = -0.8;

    this.group.add(chamber, entrance, marker, sign);
  }
}
