import * as THREE from 'three';

/** Stylized three-body diagram: planet + three suns on independent orbits. */
export class TrisolarisOrbitVisual {
  readonly group = new THREE.Group();
  private readonly planet: THREE.Mesh;
  private readonly suns: THREE.Mesh[] = [];
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
    this.planet = new THREE.Mesh(new THREE.SphereGeometry(0.95, 24, 18), planetMat);
    this.planet.castShadow = true;
    this.group.add(this.planet);

    const sunColors = ['#ffd4a8', '#ffb080', '#ffe8c8'];
    for (let i = 0; i < 3; i += 1) {
      const sun = new THREE.Mesh(
        new THREE.SphereGeometry(0.38 + i * 0.04, 16, 12),
        new THREE.MeshStandardMaterial({
          color: sunColors[i],
          emissive: sunColors[i],
          emissiveIntensity: 1.4,
          roughness: 0.35,
        }),
      );
      sun.userData.orbitIndex = i;
      this.suns.push(sun);
      this.group.add(sun);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(this.orbitRadii[i]! - 0.03, this.orbitRadii[i]! + 0.03, 64),
        new THREE.MeshBasicMaterial({
          color: '#8a7060',
          transparent: true,
          opacity: 0.22,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      this.group.add(ring);
    }

    const halo = new THREE.PointLight('#ffcc88', 0.6, 18, 2);
    halo.position.set(0, 0.5, 0);
    this.group.add(halo);
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

    for (let i = 0; i < this.suns.length; i += 1) {
      const sun = this.suns[i]!;
      const r = this.orbitRadii[i]!;
      const wobble = chaos * Math.sin(this.time * (1.8 + i * 0.4) + i) * 0.35;
      const speed = this.orbitSpeed[i]! * (1 + chaos * 1.6);
      const angle = this.time * speed + wobble + i * 2.1;
      const stableAngle = -0.6 + i * 0.22;
      const a = THREE.MathUtils.lerp(angle, stableAngle, stable);
      const radius = THREE.MathUtils.lerp(r, r * 0.72, stable * 0.5);
      sun.position.set(Math.cos(a) * radius, Math.sin(a * 0.7) * 0.35 * chaos, Math.sin(a) * radius);
      const mat = sun.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = THREE.MathUtils.lerp(1.5 + chaos * 0.8, 0.75, stable);
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
    });
  }
}
