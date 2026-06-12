import * as THREE from 'three';

const GROVE_CENTER = new THREE.Vector3(28, 0, -32);
const PARTICLE_COUNT = 120;

export class StableEraParticles {
  readonly points: THREE.Points;
  private readonly positions: Float32Array;
  private readonly velocities: Float32Array;
  private blend = 0;

  constructor(terrain: { getHeightAt(x: number, z: number): number }) {
    this.positions = new Float32Array(PARTICLE_COUNT * 3);
    this.velocities = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 12;
      const x = GROVE_CENTER.x + Math.cos(angle) * radius;
      const z = GROVE_CENTER.z + Math.sin(angle) * radius;
      const y = terrain.getHeightAt(x, z) + 0.5 + Math.random() * 4;

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;
      this.velocities[i] = 0.2 + Math.random() * 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const material = new THREE.PointsMaterial({
      color: '#e8c878',
      size: 0.35,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
  }

  setActive(active: boolean, delta: number): void {
    const target = active ? 1 : 0;
    this.blend = THREE.MathUtils.lerp(this.blend, target, Math.min(delta * 1.5, 1));
    (this.points.material as THREE.PointsMaterial).opacity = this.blend * 0.75;

    if (this.blend <= 0.01) {
      this.points.visible = false;
      return;
    }

    this.points.visible = true;
    const positionAttr = this.points.geometry.attributes.position;

    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      let y = this.positions[i * 3 + 1] + this.velocities[i] * delta;
      const baseY = this.positions[i * 3 + 1];

      if (y > baseY + 5) {
        y = baseY;
      }

      this.positions[i * 3 + 1] = y;
    }

    positionAttr.needsUpdate = true;
  }

  dispose(): void {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
