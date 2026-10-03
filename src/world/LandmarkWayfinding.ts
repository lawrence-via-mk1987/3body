import * as THREE from 'three';
import type { EraKind } from '../orbital/types';
import type { Terrain } from './Terrain';
import {
  GROVE_LANDMARK,
  OBSERVATORY_LANDMARK,
  PIT_LANDMARK,
  PIT_REGISTRAR,
  SPAWN_HINT,
} from './landmarks';

export class LandmarkWayfinding {
  readonly group = new THREE.Group();
  readonly registrarGroup = new THREE.Group();

  private readonly pitBeacon: THREE.Mesh;
  private readonly groveBeacon: THREE.Mesh;
  private readonly pitRingPulse: THREE.Mesh;
  private readonly trailPit: THREE.InstancedMesh;
  private readonly trailGrove: THREE.InstancedMesh;
  private readonly trailObservatory: THREE.InstancedMesh;
  private readonly observatoryBeacon: THREE.Mesh;
  private readonly grovePoolGlow: THREE.Mesh;
  private pulseTime = 0;

  constructor(private readonly terrain: Terrain) {
    const pitY = terrain.getHeightAt(PIT_LANDMARK.x, PIT_LANDMARK.z);
    const groveY = terrain.getHeightAt(GROVE_LANDMARK.x, GROVE_LANDMARK.z);

    this.pitBeacon = this.createBeacon(0xc28a5a, 0xffa060, 42);
    this.pitBeacon.position.set(PIT_LANDMARK.x, pitY, PIT_LANDMARK.z);
    this.group.add(this.pitBeacon);

    this.groveBeacon = this.createBeacon(0x6a9a58, 0xe8d8a0, 38);
    this.groveBeacon.position.set(GROVE_LANDMARK.x, groveY, GROVE_LANDMARK.z);
    this.group.add(this.groveBeacon);

    this.pitRingPulse = new THREE.Mesh(
      new THREE.TorusGeometry(10.5, 0.14, 8, 64),
      new THREE.MeshBasicMaterial({
        color: '#c28a5a',
        transparent: true,
        opacity: 0.35,
      }),
    );
    this.pitRingPulse.rotation.x = Math.PI / 2;
    this.pitRingPulse.position.set(PIT_LANDMARK.x, pitY + 0.12, PIT_LANDMARK.z);
    this.group.add(this.pitRingPulse);

    this.grovePoolGlow = new THREE.Mesh(
      new THREE.RingGeometry(2.2, 3.4, 32),
      new THREE.MeshBasicMaterial({
        color: '#8ec8ff',
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      }),
    );
    this.grovePoolGlow.rotation.x = -Math.PI / 2;
    this.grovePoolGlow.position.set(GROVE_LANDMARK.x, groveY + 0.2, GROVE_LANDMARK.z);
    this.group.add(this.grovePoolGlow);

    const observatoryY = terrain.getHeightAt(OBSERVATORY_LANDMARK.x, OBSERVATORY_LANDMARK.z);
    this.observatoryBeacon = this.createBeacon(0x5a88b8, 0x8ec8ff, 36);
    this.observatoryBeacon.position.set(OBSERVATORY_LANDMARK.x, observatoryY, OBSERVATORY_LANDMARK.z);
    this.group.add(this.observatoryBeacon);

    this.trailPit = this.buildTrail(SPAWN_HINT, PIT_LANDMARK, 0xb8956a, 18);
    this.trailGrove = this.buildTrail(SPAWN_HINT, GROVE_LANDMARK, 0x7aa86a, 22);
    this.trailObservatory = this.buildTrail(SPAWN_HINT, OBSERVATORY_LANDMARK, 0x6aa8d8, 16);
    this.group.add(this.trailPit, this.trailGrove, this.trailObservatory);

    this.buildRegistrar();
    this.group.add(this.registrarGroup);
  }

  private createBeacon(color: number, emissive: number, height: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.55, height, 8, 1, true),
      new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.72,
        roughness: 0.85,
        side: THREE.DoubleSide,
      }),
    );
    mesh.position.y = height * 0.5;
    return mesh;
  }

  private buildTrail(
    from: { x: number; z: number },
    to: { x: number; z: number },
    color: number,
    count: number,
  ): THREE.InstancedMesh {
    const geometry = new THREE.ConeGeometry(0.35, 0.9, 4);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.15,
      roughness: 0.9,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i += 1) {
      const t = (i + 1) / (count + 1);
      const x = THREE.MathUtils.lerp(from.x, to.x, t);
      const z = THREE.MathUtils.lerp(from.z, to.z, t);
      const y = this.terrain.getHeightAt(x, z) + 0.35;
      dummy.position.set(x, y, z);
      dummy.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }

  private buildRegistrar(): void {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: '#6a5040',
      roughness: 0.95,
      emissive: '#3a2010',
      emissiveIntensity: 0.2,
    });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.1, 4, 8), bodyMat);
    body.position.y = 1.05;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), bodyMat);
    head.position.y = 1.85;

    const shawl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.7, 0.15, 8),
      new THREE.MeshStandardMaterial({ color: '#8f6a4a', roughness: 1 }),
    );
    shawl.position.y = 1.45;

    this.registrarGroup.add(body, head, shawl);
    const regY = this.terrain.getHeightAt(PIT_REGISTRAR.x, PIT_REGISTRAR.z);
    this.registrarGroup.position.set(PIT_REGISTRAR.x, regY, PIT_REGISTRAR.z);
    this.registrarGroup.rotation.y = Math.atan2(
      PIT_LANDMARK.x - PIT_REGISTRAR.x,
      PIT_LANDMARK.z - PIT_REGISTRAR.z,
    );
  }

  update(
    delta: number,
    era: EraKind,
    playerPosition: THREE.Vector3,
    nearPit: boolean,
    grovePoolVisible: boolean,
    forecastCalibrated: boolean,
  ): void {
    this.pulseTime += delta;

    const pitPulse = 0.28 + Math.sin(this.pulseTime * 3.2) * 0.12;
    const pitMat = this.pitRingPulse.material as THREE.MeshBasicMaterial;
    pitMat.opacity = nearPit ? 0.55 + Math.sin(this.pulseTime * 5) * 0.2 : pitPulse + 0.15;
    const pitScale = nearPit ? 1.04 + Math.sin(this.pulseTime * 4) * 0.03 : 1;
    this.pitRingPulse.scale.set(pitScale, pitScale, pitScale);

    const pitBeaconMat = this.pitBeacon.material as THREE.MeshStandardMaterial;
    pitBeaconMat.emissiveIntensity = era === 'stable' ? 0.25 : 0.55 + Math.sin(this.pulseTime * 2) * 0.15;
    pitBeaconMat.opacity = era === 'stable' ? 0.35 : 0.78;

    const groveActive = era === 'stable';
    const groveBeaconMat = this.groveBeacon.material as THREE.MeshStandardMaterial;
    groveBeaconMat.emissiveIntensity = groveActive ? 0.65 + Math.sin(this.pulseTime * 2.5) * 0.2 : 0.08;
    groveBeaconMat.opacity = groveActive ? 0.82 : 0.18;
    this.groveBeacon.visible = true;

    this.trailPit.visible = era !== 'stable' || playerPosition.distanceTo(this.pitBeacon.position) > 35;
    this.trailGrove.visible = groveActive;

    const showObservatoryGuide = era !== 'stable' && !forecastCalibrated;
    this.trailObservatory.visible = showObservatoryGuide;
    const obsMat = this.observatoryBeacon.material as THREE.MeshStandardMaterial;
    obsMat.emissiveIntensity = showObservatoryGuide
      ? 0.5 + Math.sin(this.pulseTime * 2.2) * 0.18
      : 0.12;
    obsMat.opacity = showObservatoryGuide ? 0.7 : 0.22;

    const glowMat = this.grovePoolGlow.material as THREE.MeshBasicMaterial;
    glowMat.opacity = grovePoolVisible
      ? 0.35 + Math.sin(this.pulseTime * 4) * 0.15
      : 0;
    this.grovePoolGlow.visible = grovePoolVisible;

    const nearRegistrar = Math.hypot(
      playerPosition.x - PIT_REGISTRAR.x,
      playerPosition.z - PIT_REGISTRAR.z,
    ) < PIT_REGISTRAR.talkRadius + 4;
    for (const part of this.registrarGroup.children) {
      const mat = (part as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = nearRegistrar ? 0.45 : 0.2;
      }
    }
  }

  isNearRegistrar(position: THREE.Vector3): boolean {
    return Math.hypot(position.x - PIT_REGISTRAR.x, position.z - PIT_REGISTRAR.z)
      <= PIT_REGISTRAR.talkRadius;
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
