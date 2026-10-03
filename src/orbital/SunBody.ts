import * as THREE from 'three';
import { ORBITAL_CONFIG } from './config';
import type { SunId, SunSnapshot } from './types';
import { createSunGlowTexture } from '../world/proceduralTextures';

const SUN_DEFS: Record<
  SunId,
  { color: string; emissive: string; limb: string; phaseOffset: number; eccentricity: number }
> = {
  sun_a: { color: '#ffb27a', emissive: '#ff8a3d', limb: '#ff6a2a', phaseOffset: 0.2, eccentricity: 0.35 },
  sun_b: { color: '#fff2cc', emissive: '#ffe08a', limb: '#ffb860', phaseOffset: 1.8, eccentricity: 0.45 },
  sun_c: { color: '#ff5a3a', emissive: '#d62818', limb: '#8a1008', phaseOffset: 3.4, eccentricity: 0.75 },
};

export interface SunLightOptions {
  castShadow: boolean;
  /** Secondary suns light the scene in their own colour without a shadow map. */
  emitLight: boolean;
  shadowMapSize?: number;
  shadowRadius?: number;
}

/**
 * One sun: a limb-darkened disk, an additive halo, and (optionally) a directional light.
 * The disk writes colours above 1.0 so bloom (desktop) picks it up without touching terrain.
 */
export class SunBody {
  readonly id: SunId;
  readonly mesh: THREE.Mesh;
  readonly glow: THREE.Sprite;
  readonly light: THREE.DirectionalLight | null;
  readonly color: THREE.Color;

  readonly phaseOffset: number;
  readonly eccentricity: number;

  azimuth = 0;
  elevation = 0;
  apparentScale = 1;
  intensity = 0;
  active = false;

  readonly direction = new THREE.Vector3(0, 1, 0);
  private readonly diskMaterial: THREE.ShaderMaterial;

  constructor(id: SunId, options: SunLightOptions) {
    this.id = id;
    const def = SUN_DEFS[id];
    this.phaseOffset = def.phaseOffset;
    this.eccentricity = def.eccentricity;
    this.color = new THREE.Color(def.color);

    this.diskMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uCore: { value: new THREE.Color(def.color).multiplyScalar(2.4) },
        uLimb: { value: new THREE.Color(def.limb).multiplyScalar(1.3) },
        uBoost: { value: 1 },
      },
      vertexShader: `
        varying vec3 vNormalView;
        varying vec3 vViewDir;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormalView = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPosition.xyz);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uCore;
        uniform vec3 uLimb;
        uniform float uBoost;
        varying vec3 vNormalView;
        varying vec3 vViewDir;
        void main() {
          float mu = clamp(dot(normalize(vNormalView), normalize(vViewDir)), 0.0, 1.0);
          // Eddington-style limb darkening.
          float limb = 0.4 + 0.6 * mu;
          vec3 color = mix(uLimb, uCore, pow(limb, 1.6)) * uBoost;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      toneMapped: false,
      depthWrite: false,
      fog: false,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), this.diskMaterial);
    this.mesh.renderOrder = 1;
    this.mesh.frustumCulled = false;

    this.glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createSunGlowTexture(def.emissive),
        color: def.emissive,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        // Depth-tested so a sun behind a ridge reads as a halo over the ridge, not a disc through it.
        depthTest: true,
        toneMapped: false,
        fog: false,
      }),
    );
    this.glow.renderOrder = 2;
    this.glow.scale.setScalar(ORBITAL_CONFIG.sunBaseScale * 4);

    if (options.emitLight || options.castShadow) {
      this.light = new THREE.DirectionalLight(def.color, 0);
      if (options.castShadow) {
        const radius = options.shadowRadius ?? 80;
        const mapSize = options.shadowMapSize ?? 2048;
        this.light.castShadow = true;
        this.light.shadow.mapSize.set(mapSize, mapSize);
        this.light.shadow.camera.near = 1;
        this.light.shadow.camera.far = 520;
        this.light.shadow.camera.left = -radius;
        this.light.shadow.camera.right = radius;
        this.light.shadow.camera.top = radius;
        this.light.shadow.camera.bottom = -radius;
        this.light.shadow.bias = -0.0006;
        this.light.shadow.normalBias = 0.6;
        this.light.shadow.radius = 2.5;
      }
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

    // Low suns look redder and dimmer through more atmosphere.
    const horizonFactor = THREE.MathUtils.clamp(this.elevation / 0.35, 0, 1);
    this.diskMaterial.uniforms.uBoost.value = 0.55 + horizonFactor * 0.45 + Math.min(this.intensity, 3) * 0.15;

    this.glow.visible = true;
    this.glow.position.copy(position);
    const haloScale = scale * (3.6 + Math.min(this.intensity, 3) * 1.1) * (1.3 - horizonFactor * 0.3);
    this.glow.scale.setScalar(haloScale);
    (this.glow.material as THREE.SpriteMaterial).opacity = THREE.MathUtils.clamp(0.35 + this.intensity * 0.3, 0.3, 1);

    if (this.light) {
      // Physical light units: ~π× intensity reads as sunlight on a Lambert surface.
      // Soft knee keeps Tri-Solar / Flying Star bright without saturating the whole ground.
      const knee = this.intensity / (1 + this.intensity * 0.4);
      this.light.intensity = knee * (this.light.castShadow ? 3.4 : 1.5);
      this.light.color.copy(this.color);
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
    this.diskMaterial.dispose();
    const glowMaterial = this.glow.material as THREE.SpriteMaterial;
    glowMaterial.map?.dispose();
    glowMaterial.dispose();
  }
}
