import * as THREE from 'three';
import { ORBITAL_CONFIG } from './config';
import type { SunId, SunSnapshot } from './types';

const SUN_DEFS: Record<
  SunId,
  { color: string; emissive: string; phaseOffset: number; eccentricity: number }
> = {
  sun_a: { color: '#ffb27a', emissive: '#ff8a3d', phaseOffset: 0.2, eccentricity: 0.35 },
  sun_b: { color: '#fff2cc', emissive: '#ffe08a', phaseOffset: 1.8, eccentricity: 0.45 },
  sun_c: { color: '#ff5a3a', emissive: '#d62818', phaseOffset: 3.4, eccentricity: 0.75 },
};

export class SunBody {
  readonly id: SunId;
  readonly mesh: THREE.Mesh;
  readonly glow: THREE.Sprite;
  readonly light: THREE.DirectionalLight | null;

  readonly phaseOffset: number;
  readonly eccentricity: number;

  azimuth = 0;
  elevation = 0;
  apparentScale = 1;
  intensity = 0;
  active = false;

  private readonly direction = new THREE.Vector3();

  constructor(id: SunId, castShadow: boolean) {
    this.id = id;
    const def = SUN_DEFS[id];
    this.phaseOffset = def.phaseOffset;
    this.eccentricity = def.eccentricity;

    const geometry = new THREE.SphereGeometry(1, 24, 24);
    const material = new THREE.MeshBasicMaterial({
      color: def.color,
      toneMapped: false,
    });
    this.mesh = new THREE.Mesh(geometry, material);

    const glowTexture = createGlowTexture(def.emissive);
    this.glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: def.emissive,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    this.glow.scale.setScalar(ORBITAL_CONFIG.sunBaseScale * 4);

    if (castShadow) {
      this.light = new THREE.DirectionalLight(def.color, 0);
      this.light.castShadow = true;
      this.light.shadow.mapSize.set(2048, 2048);
      this.light.shadow.camera.near = 1;
      this.light.shadow.camera.far = 420;
      this.light.shadow.camera.left = -120;
      this.light.shadow.camera.right = 120;
      this.light.shadow.camera.top = 120;
      this.light.shadow.camera.bottom = -120;
    } else {
      this.light = null;
    }
  }

  setLayout(azimuth: number, elevation: number, apparentScale: number, intensity: number, active: boolean): void {
    this.azimuth = azimuth;
    this.elevation = elevation;
    this.apparentScale = apparentScale;
    this.intensity = intensity;
    this.active = active;
  }

  updateTransform(anchor: THREE.Vector3): void {
    if (!this.active) {
      this.mesh.visible = false;
      this.glow.visible = false;
      if (this.light) {
        this.light.intensity = 0;
      }
      return;
    }

    this.direction.set(
      Math.sin(this.azimuth) * Math.cos(this.elevation),
      Math.sin(this.elevation),
      Math.cos(this.azimuth) * Math.cos(this.elevation),
    );

    const radius = ORBITAL_CONFIG.celestialRadius;
    const position = this.direction.clone().multiplyScalar(radius).add(anchor);

    const scale = ORBITAL_CONFIG.sunBaseScale * this.apparentScale;
    this.mesh.visible = true;
    this.mesh.position.copy(position);
    this.mesh.scale.setScalar(scale);

    this.glow.visible = true;
    this.glow.position.copy(position);
    this.glow.scale.setScalar(scale * 4.5);

    if (this.light) {
      this.light.intensity = this.intensity * 1.15;
      this.light.color.set(SUN_DEFS[this.id].color);
      this.light.position.copy(position);
      this.light.target.position.copy(anchor);
      this.light.target.updateMatrixWorld();
    }
  }

  getSnapshot(): SunSnapshot {
    return {
      id: this.id,
      azimuth: this.azimuth,
      elevation: this.elevation,
      apparentScale: this.apparentScale,
      intensity: this.intensity,
      active: this.active,
    };
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.mesh);
    scene.add(this.glow);
    if (this.light) {
      scene.add(this.light);
      scene.add(this.light.target);
    }
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    const glowMaterial = this.glow.material as THREE.SpriteMaterial;
    glowMaterial.map?.dispose();
    glowMaterial.dispose();
  }
}

function createGlowTexture(color: string): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.2, 'rgba(255, 180, 80, 0.45)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
