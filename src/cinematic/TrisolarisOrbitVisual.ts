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

/** Stylized three-body diagram: planet + three suns on independent orbits. */
export class TrisolarisOrbitVisual {
  readonly group = new THREE.Group();
  private readonly planet: THREE.Mesh;
  private readonly sunGroups: THREE.Group[] = [];
  private readonly orbitRadii = [2.2, 3.1, 4.0];
  private readonly orbitSpeed = [0.85, -1.1, 0.65];
  private time = 0;
  private mode: 'chaos' | 'stable' | 'blend' = 'chaos';
  private stableBlend = 0;

  constructor() {
    this.group.name = 'trisolaris-orbit-visual';
    this.group.position.set(0, 24, 14);

    const planetMat = new THREE.MeshStandardMaterial({
      color: '#4a6a8a',
      emissive: '#1a2838',
      emissiveIntensity: 0.35,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.planet = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 24), planetMat);
    this.planet.castShadow = true;
    this.group.add(this.planet);

    for (let i = 0; i < 3; i += 1) {
      const sunGroup = buildCelestialSunVisual(SUN_PALETTES[i]!, 0.42 + i * 0.05);
      this.sunGroups.push(sunGroup);
      this.group.add(sunGroup);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(this.orbitRadii[i]! - 0.02, this.orbitRadii[i]! + 0.02, 72),
        new THREE.MeshBasicMaterial({
          color: '#6a5a50',
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      this.group.add(ring);
    }
  }

  setMode(mode: 'chaos' | 'stable' | 'blend', stableBlend = 0): void {
    this.mode = mode;
    this.stableBlend = THREE.MathUtils.clamp(stableBlend, 0, 1);
  }

  update(delta: number): void {
    this.time += delta;
    const chaos = this.mode === 'chaos' ? 1 : this.mode === 'stable' ? 0 : 1 - this.stableBlend;
    const stable = 1 - chaos;

    this.planet.rotation.y += delta * (0.15 + chaos * 0.25);
    this.group.rotation.y = Math.sin(this.time * 0.12) * 0.08 * chaos;

    for (let i = 0; i < this.sunGroups.length; i += 1) {
      const sunGroup = this.sunGroups[i]!;
      const r = this.orbitRadii[i]!;
      const wobble = chaos * Math.sin(this.time * (1.8 + i * 0.4) + i) * 0.35;
      const speed = this.orbitSpeed[i]! * (1 + chaos * 1.6);
      const angle = this.time * speed + wobble + i * 2.1;
      const stableAngle = -0.6 + i * 0.22;
      const a = THREE.MathUtils.lerp(angle, stableAngle, stable);
      const radius = THREE.MathUtils.lerp(r, r * 0.72, stable * 0.5);
      const yLift = Math.sin(a * 0.7) * 0.35 * chaos;
      sunGroup.position.set(Math.cos(a) * radius, yLift, Math.sin(a) * radius);
      const intensity = THREE.MathUtils.lerp(1.2 + chaos * 0.9, 0.55, stable);
      updateCelestialSunVisual(sunGroup, intensity, this.time + i);
    }
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
