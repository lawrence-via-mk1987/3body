import * as THREE from 'three';
import type { EraKind } from '../orbital/types';
import type { Terrain } from './Terrain';
import { GROVE_KEEPER, LAST_PREDICTOR, PIT_REGISTRAR } from './landmarks';

interface NpcSite {
  id: string;
  label: string;
  x: number;
  z: number;
  color: number;
  emissive: number;
}

const SITES: NpcSite[] = [
  { id: 'registrar', label: 'Registrar', x: PIT_REGISTRAR.x, z: PIT_REGISTRAR.z, color: 0xc28a5a, emissive: 0xffa060 },
  { id: 'predictor', label: 'Predictor', x: LAST_PREDICTOR.x, z: LAST_PREDICTOR.z, color: 0x6aa8d8, emissive: 0x8ec8ff },
  { id: 'grove', label: 'Grove Keeper', x: GROVE_KEEPER.x, z: GROVE_KEEPER.z, color: 0x7aa86a, emissive: 0xe8d8a0 },
];

function makeLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(8, 6, 5, 0.72)';
  ctx.roundRect(8, 8, 240, 48, 12);
  ctx.fill();
  ctx.fillStyle = '#f2e6d8';
  ctx.font = '22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(6, 1.5, 1);
  sprite.renderOrder = 10;
  return sprite;
}

export class NpcPresence {
  readonly group = new THREE.Group();
  private readonly markers: THREE.Group[] = [];
  private pulseTime = 0;

  constructor(terrain: Terrain) {
    for (const site of SITES) {
      const root = new THREE.Group();
      const y = terrain.getHeightAt(site.x, site.z);

      // A short stake beside the figure. The person is the landmark; the name is secondary.
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.05, 2.1, 6),
        new THREE.MeshStandardMaterial({
          color: site.color,
          emissive: site.emissive,
          emissiveIntensity: 0.35,
          roughness: 0.8,
        }),
      );
      pole.position.set(0.85, 1.05, 0);

      const finial = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 6),
        new THREE.MeshStandardMaterial({
          color: site.emissive,
          emissive: site.emissive,
          emissiveIntensity: 0.6,
        }),
      );
      finial.position.set(0.85, 2.12, 0);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.15, 1.4, 28),
        new THREE.MeshBasicMaterial({
          color: site.emissive,
          transparent: true,
          opacity: 0.28,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.06;

      const label = makeLabelSprite(site.label);
      label.scale.set(1.5, 0.38, 1);
      label.position.set(0.85, 2.45, 0);

      root.add(pole, finial, ring, label);
      root.position.set(site.x, y, site.z);
      root.userData.npcId = site.id;
      if (site.id === 'grove') {
        root.visible = false;
      }
      this.markers.push(root);
      this.group.add(root);
    }
  }

  update(delta: number, era: EraKind, playerX: number, playerZ: number): void {
    this.pulseTime += delta;
    const stable = era === 'stable';
    for (const marker of this.markers) {
      const id = marker.userData.npcId as string;
      if (id === 'grove') {
        marker.visible = stable;
      }
      if (!marker.visible) {
        continue;
      }
      const dist = Math.hypot(playerX - marker.position.x, playerZ - marker.position.z);
      const near = dist < 14;
      const pulse = 0.45 + Math.sin(this.pulseTime * (near ? 5 : 2.5)) * (near ? 0.25 : 0.12);
      for (const child of marker.children) {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
          if ('emissiveIntensity' in mat && mat.emissiveIntensity !== undefined) {
            mat.emissiveIntensity = pulse;
          }
          if (child.geometry.type === 'RingGeometry') {
            mat.opacity = near ? 0.55 : 0.3;
          }
        }
      }
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
      if (obj instanceof THREE.Sprite) {
        obj.material.map?.dispose();
        obj.material.dispose();
      }
    });
  }
}
