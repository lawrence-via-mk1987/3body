import * as THREE from 'three';

const PUFFS = 14;

/**
 * A small cloud just in front of the camera during cold phases. The points live in camera
 * space and the whole object is moved onto the camera each frame, so it never has to be a
 * child of the camera (the camera is not in the scene). Cheap to skip: don't construct it.
 */
export class ColdBreath {
  readonly points: THREE.Points;
  private readonly positions: Float32Array;
  private readonly speeds: Float32Array;
  private amount = 0;

  constructor() {
    this.positions = new Float32Array(PUFFS * 3);
    this.speeds = new Float32Array(PUFFS);
    for (let i = 0; i < PUFFS; i += 1) {
      this.reset(i, Math.random());
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(16, 16, 1, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.45, 'rgba(230,240,248,0.35)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    const map = new THREE.CanvasTexture(canvas);

    this.points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: '#d5e6f2',
        map,
        size: 0.055,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;
  }

  /** `cold` is the phase, not a temperature sample. */
  update(camera: THREE.Camera, cold: boolean, delta: number): void {
    this.amount = THREE.MathUtils.lerp(this.amount, cold ? 1 : 0, Math.min(delta * 1.5, 1));
    const material = this.points.material as THREE.PointsMaterial;
    material.opacity = this.amount * 0.32;
    this.points.visible = this.amount > 0.02;
    if (!this.points.visible) {
      return;
    }

    this.points.position.copy(camera.position);
    this.points.quaternion.copy(camera.quaternion);

    for (let i = 0; i < PUFFS; i += 1) {
      const y = this.positions[i * 3 + 1] + this.speeds[i] * delta;
      if (y > 0.5) {
        this.reset(i, 0);
      } else {
        this.positions[i * 3 + 1] = y;
      }
    }
    (this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  /** Puffs start at the mouth (below and in front of the lens) and rise. */
  private reset(index: number, along: number): void {
    const i = index * 3;
    this.positions[i] = (Math.random() - 0.5) * 0.1;
    this.positions[i + 1] = -0.22 + along * 0.35;
    this.positions[i + 2] = -1.15 - Math.random() * 0.25;
    this.speeds[index] = 0.18 + Math.random() * 0.2;
  }

  dispose(): void {
    this.points.geometry.dispose();
    const material = this.points.material as THREE.PointsMaterial;
    material.map?.dispose();
    material.dispose();
  }
}
