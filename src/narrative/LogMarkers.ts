import * as THREE from 'three';
import type { Terrain } from '../world/Terrain';
import { TEXT_LOGS, type TextLog } from './logs';
import type { LogDiscovery } from './LogDiscovery';

export interface NearbyLog {
  log: TextLog;
  distance: number;
  discovered: boolean;
}

export class LogMarkers {
  readonly group = new THREE.Group();
  private readonly markers = new Map<string, THREE.Mesh>();

  constructor(
    terrain: Terrain,
    private readonly discovery: LogDiscovery,
  ) {
    for (const log of TEXT_LOGS) {
      const marker = this.createMarker(log, terrain);
      this.markers.set(log.id, marker);
      this.group.add(marker);
    }
  }

  private createMarker(log: TextLog, terrain: Terrain): THREE.Mesh {
    const y = terrain.getHeightAt(log.position.x, log.position.z);
    const geometry = new THREE.BoxGeometry(0.55, 0.9, 0.12);
    const material = new THREE.MeshStandardMaterial({
      color: '#8a7a62',
      emissive: '#2a2018',
      emissiveIntensity: 0.25,
      roughness: 0.85,
    });

    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(log.position.x, y + 0.55, log.position.z);
    marker.rotation.y = Math.random() * Math.PI;
    marker.castShadow = true;
    marker.receiveShadow = true;
    marker.userData.logId = log.id;

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 10),
      new THREE.MeshBasicMaterial({
        color: '#d8b878',
        transparent: true,
        opacity: 0.55,
      }),
    );
    glow.position.y = 0.55;
    marker.add(glow);

    return marker;
  }

  update(position: THREE.Vector3, stableEraActive: boolean): NearbyLog | null {
    let nearest: NearbyLog | null = null;

    for (const log of TEXT_LOGS) {
      const marker = this.markers.get(log.id);
      if (!marker) {
        continue;
      }

      const hiddenByEra = log.requiresStableEra && !stableEraActive;
      marker.visible = !hiddenByEra;

      const dx = position.x - log.position.x;
      const dz = position.z - log.position.z;
      const distance = Math.hypot(dx, dz);
      const discovered = this.discovery.isDiscovered(log.id);
      const glow = marker.children[0] as THREE.Mesh;
      const glowMaterial = glow.material as THREE.MeshBasicMaterial;

      if (hiddenByEra) {
        continue;
      }

      glowMaterial.opacity = discovered ? 0.25 : 0.75;
      (marker.material as THREE.MeshStandardMaterial).emissiveIntensity = discovered ? 0.15 : 0.45;

      if (distance <= log.interactionRadius) {
        if (!nearest || distance < nearest.distance) {
          nearest = { log, distance, discovered };
        }
      }
    }

    return nearest;
  }
}
