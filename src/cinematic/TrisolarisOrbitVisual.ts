import * as THREE from 'three';
import {
  buildCelestialSunVisual,
  updateCelestialSunVisual,
  type CelestialSunPalette,
} from '../world/CelestialSunVisual';

const SUN_PALETTES: CelestialSunPalette[] = [
  { core: '#ffb27a', limb: '#ff6a2a', emissive: '#ff8a3d' },
  { core: '#fff2cc', limb: '#ffb860', emissive: '#ffe08a' },
  { core: '#ff5a3a', limb: '#8a1008', emissive: '#d62818' },
];

/** Semi-major axes of each star about the system barycenter (arbitrary units). */
const STAR_SEMI_MAJOR = [3.4, 2.9, 3.8];
const STAR_ECCENTRICITY = [0.38, 0.52, 0.44];
const STAR_MEAN_MOTION = [0.52, 0.71, 0.46];
const STAR_PHASE = [0.2, 2.15, 4.05];

/** Trisolaris orbits the barycenter inside the triple system — not the other way around. */
const PLANET_ORBIT_RADIUS = 1.05;
const PLANET_ORBIT_RATE = 0.28;

function keplerRadius(a: number, e: number, meanAnomaly: number): number {
  const E = meanAnomaly;
  return a * (1 - e * Math.cos(E));
}

function keplerAngle(e: number, meanAnomaly: number): number {
  const E = meanAnomaly;
  const sinE = Math.sin(E);
  const cosE = Math.cos(E);
  const sqrtTerm = Math.sqrt(Math.max(0.001, 1 - e * e));
  return Math.atan2(sqrtTerm * sinE, cosE - e);
}

/**
 * Stylized triple-star system for the intro:
 * - Three suns move on Kepler-like paths about the **barycenter** (origin).
 * - The planet is a small body on an inner orbit around that same center.
 */
export class TrisolarisOrbitVisual {
  readonly group = new THREE.Group();
  private readonly barycenter: THREE.Group;
  private readonly planet: THREE.Mesh;
  private readonly sunGroups: THREE.Group[] = [];
  private readonly starTrailRings: THREE.Mesh[] = [];
  private readonly planetOrbitRing: THREE.Mesh;
  private time = 0;
  private mode: 'chaos' | 'stable' | 'blend' = 'chaos';
  private stableBlend = 0;

  constructor() {
    this.group.name = 'trisolaris-orbit-visual';
    this.group.position.set(0, 24, 14);

    this.barycenter = new THREE.Group();
    this.barycenter.name = 'barycenter';
    const baryMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 6),
      new THREE.MeshBasicMaterial({ color: '#5a5048', transparent: true, opacity: 0.55 }),
    );
    this.barycenter.add(baryMarker);
    this.group.add(this.barycenter);

    for (let i = 0; i < 3; i += 1) {
      const a = STAR_SEMI_MAJOR[i]!;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(a * (1 - STAR_ECCENTRICITY[i]!) - 0.04, a * (1 + STAR_ECCENTRICITY[i]!) + 0.04, 80),
        new THREE.MeshBasicMaterial({
          color: '#5a5048',
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      this.starTrailRings.push(ring);
      this.barycenter.add(ring);
    }

    this.planetOrbitRing = new THREE.Mesh(
      new THREE.RingGeometry(PLANET_ORBIT_RADIUS - 0.025, PLANET_ORBIT_RADIUS + 0.025, 64),
      new THREE.MeshBasicMaterial({
        color: '#4a6878',
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      }),
    );
    this.planetOrbitRing.rotation.x = -Math.PI / 2;
    this.barycenter.add(this.planetOrbitRing);

    const planetMat = new THREE.MeshStandardMaterial({
      color: '#4a6a8a',
      emissive: '#1a2838',
      emissiveIntensity: 0.35,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.planet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 20), planetMat);
    this.planet.castShadow = true;
    this.barycenter.add(this.planet);

    for (let i = 0; i < 3; i += 1) {
      const sunGroup = buildCelestialSunVisual(SUN_PALETTES[i]!, 0.5 + i * 0.04);
      this.sunGroups.push(sunGroup);
      this.barycenter.add(sunGroup);
    }
  }

  setMode(mode: 'chaos' | 'stable' | 'blend', stableBlend = 0): void {
    this.mode = mode;
    this.stableBlend = THREE.MathUtils.clamp(stableBlend, 0, 1);
  }

  private starPosition(i: number, t: number, chaos: number): THREE.Vector3 {
    const a = STAR_SEMI_MAJOR[i]!;
    const e = STAR_ECCENTRICITY[i]! * (1 + chaos * 0.12);
    const n = STAR_MEAN_MOTION[i]! * (1 + chaos * 0.85);
    const M = STAR_PHASE[i]! + n * t + chaos * Math.sin(t * (1.15 + i * 0.31) + i) * 0.45;
    const r = keplerRadius(a, e, M);
    let theta = keplerAngle(e, M) + chaos * Math.sin(t * 0.85 + i * 1.9) * 0.25;

    const stable = 1 - chaos;
    if (stable > 0.001) {
      const clusterAngle = -0.55;
      const clusterR = a * 0.55;
      const stableTheta = clusterAngle + (i - 1) * 0.28;
      const stableX = Math.cos(stableTheta) * clusterR;
      const stableZ = Math.sin(stableTheta) * clusterR;
      const chaX = Math.cos(theta) * r;
      const chaZ = Math.sin(theta) * r;
      const x = THREE.MathUtils.lerp(chaX, stableX, stable);
      const z = THREE.MathUtils.lerp(chaZ, stableZ, stable);
      const y = THREE.MathUtils.lerp(
        Math.sin(t * 0.6 + i) * 0.22 * chaos,
        0.05 * (i - 1),
        stable,
      );
      return new THREE.Vector3(x, y, z);
    }

    const y = Math.sin(t * 0.55 + i * 2.1) * 0.28 * chaos;
    return new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
  }

  update(delta: number): void {
    this.time += delta;
    const chaos = this.mode === 'chaos' ? 1 : this.mode === 'stable' ? 0 : 1 - this.stableBlend;
    const stable = 1 - chaos;

    this.barycenter.rotation.y = Math.sin(this.time * 0.08) * 0.06 * chaos;

    const planetAngle = this.time * PLANET_ORBIT_RATE * (1 + chaos * 0.15);
    this.planet.position.set(
      Math.cos(planetAngle) * PLANET_ORBIT_RADIUS,
      Math.sin(this.time * 0.9) * 0.04,
      Math.sin(planetAngle) * PLANET_ORBIT_RADIUS,
    );
    this.planet.rotation.y += delta * (0.4 + chaos * 0.2);

    for (let i = 0; i < this.sunGroups.length; i += 1) {
      const sunGroup = this.sunGroups[i]!;
      const pos = this.starPosition(i, this.time, chaos);
      sunGroup.position.copy(pos);
      const intensity = THREE.MathUtils.lerp(1.15 + chaos * 0.85, 0.5, stable);
      updateCelestialSunVisual(sunGroup, intensity, this.time + i);
    }

    for (const ring of this.starTrailRings) {
      (ring.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(0.12, 0.06, stable);
    }
    (this.planetOrbitRing.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(0.35, 0.45, stable);
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const m = obj.material;
        if (Array.isArray(m)) {
          m.forEach((mat) => mat.dispose());
        } else {
          m.dispose();
        }
      }
      if (obj instanceof THREE.Sprite) {
        const mat = obj.material as THREE.SpriteMaterial;
        mat.map?.dispose();
        mat.dispose();
      }
    });
  }
}
