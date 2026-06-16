import * as THREE from 'three';
import type { EraKind, EraPhase } from '../orbital/types';

const TERRAIN_SIZE = 512;
const TERRAIN_SEGMENTS = 128;
const HEIGHT_SCALE = 18;
const GROVE_CENTER = new THREE.Vector2(28, -32);
const GROVE_RADIUS = 14;

function hash(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smoothNoise(x: number, z: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fz = z - z0;

  const a = hash(x0, z0);
  const b = hash(x0 + 1, z0);
  const c = hash(x0, z0 + 1);
  const d = hash(x0 + 1, z0 + 1);

  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);

  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(a, b, ux),
    THREE.MathUtils.lerp(c, d, ux),
    uz,
  );
}

function fbm(x: number, z: number): number {
  let value = 0;
  let amplitude = 0.55;
  let frequency = 0.018;

  for (let i = 0; i < 4; i += 1) {
    value += smoothNoise(x * frequency, z * frequency) * amplitude;
    amplitude *= 0.5;
    frequency *= 2.1;
  }

  return value;
}

function sampleHeight(worldX: number, worldZ: number): number {
  const ridge = Math.pow(Math.abs(fbm(worldX, worldZ) - 0.5) * 2, 1.4);
  const basin = fbm(worldX * 0.5 + 40, worldZ * 0.5 - 20);
  const cracks = Math.pow(1 - Math.abs(Math.sin(worldX * 0.08) * Math.cos(worldZ * 0.07)), 6);

  return (ridge * 0.75 + basin * 0.45 - cracks * 0.35) * HEIGHT_SCALE;
}

export class Terrain {
  readonly mesh: THREE.Mesh;
  private readonly geometry: THREE.PlaneGeometry;
  private readonly material: THREE.MeshStandardMaterial;
  private readonly uniforms = {
    uColdBlend: { value: 0 },
    uHeatBlend: { value: 0 },
    uStableBlend: { value: 0 },
    uGroveCenter: { value: new THREE.Vector2(GROVE_CENTER.x, GROVE_CENTER.y) },
    uGroveRadius: { value: GROVE_RADIUS },
  };
  private targetCold = 0;
  private targetHeat = 0;
  private targetStable = 0;

  constructor() {
    this.geometry = new THREE.PlaneGeometry(
      TERRAIN_SIZE,
      TERRAIN_SIZE,
      TERRAIN_SEGMENTS,
      TERRAIN_SEGMENTS,
    );
    this.geometry.rotateX(-Math.PI / 2);

    const position = this.geometry.attributes.position;
    const colors: number[] = [];

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const height = sampleHeight(x, z);
      position.setY(i, height);

      const lowColor = new THREE.Color('#5a3d28');
      const highColor = new THREE.Color('#9a6a45');
      const crackColor = new THREE.Color('#2f2118');
      const blend = THREE.MathUtils.clamp(height / HEIGHT_SCALE, 0, 1);
      const crack = Math.pow(
        1 - Math.abs(Math.sin(x * 0.08) * Math.cos(z * 0.07)),
        10,
      );

      const color = lowColor.clone().lerp(highColor, blend).lerp(crackColor, crack * 0.65);
      colors.push(color.r, color.g, color.b);
    }

    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.geometry.computeVertexNormals();

    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.04,
    });

    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uColdBlend = this.uniforms.uColdBlend;
      shader.uniforms.uHeatBlend = this.uniforms.uHeatBlend;
      shader.uniforms.uStableBlend = this.uniforms.uStableBlend;
      shader.uniforms.uGroveCenter = this.uniforms.uGroveCenter;
      shader.uniforms.uGroveRadius = this.uniforms.uGroveRadius;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <color_pars_vertex>',
        `#include <color_pars_vertex>
        varying vec3 vWorldPosition;`,
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        vWorldPosition = worldPosition.xyz;`,
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_pars_fragment>',
        `#include <color_pars_fragment>
        uniform float uColdBlend;
        uniform float uHeatBlend;
        uniform float uStableBlend;
        uniform vec2 uGroveCenter;
        uniform float uGroveRadius;
        varying vec3 vWorldPosition;`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 iceTint = vec3(0.62, 0.74, 0.86);
        vec3 scorchTint = vec3(0.62, 0.28, 0.14);
        vec3 groveTint = vec3(0.28, 0.52, 0.24);
        float lowland = smoothstep(10.0, 2.0, vWorldPosition.y);
        diffuseColor.rgb = mix(diffuseColor.rgb, iceTint, uColdBlend * (0.35 + lowland * 0.45));
        diffuseColor.rgb = mix(diffuseColor.rgb, scorchTint, uHeatBlend * 0.42);
        float groveDist = distance(vWorldPosition.xz, uGroveCenter);
        float groveMask = 1.0 - smoothstep(uGroveRadius * 0.35, uGroveRadius, groveDist);
        diffuseColor.rgb = mix(diffuseColor.rgb, groveTint, uStableBlend * groveMask * 0.8);`,
      );
    };
    this.material.customProgramCacheKey = () => 'terrain-era-blend';

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
  }

  setEraVisuals(era: EraKind, phase: EraPhase): void {
    this.targetCold = phase === 'deep_cold' || phase === 'eclipse_relief' ? 1 : 0;
    this.targetHeat = phase === 'scorch' || phase === 'tri_solar' || phase === 'flying_star' ? 1 : 0;
    this.targetStable = era === 'stable' ? 1 : 0;
  }

  updateVisuals(delta: number): void {
    const lerpSpeed = Math.min(delta * 1.8, 1);
    this.uniforms.uColdBlend.value = THREE.MathUtils.lerp(
      this.uniforms.uColdBlend.value,
      this.targetCold,
      lerpSpeed,
    );
    this.uniforms.uHeatBlend.value = THREE.MathUtils.lerp(
      this.uniforms.uHeatBlend.value,
      this.targetHeat,
      lerpSpeed,
    );
    this.uniforms.uStableBlend.value = THREE.MathUtils.lerp(
      this.uniforms.uStableBlend.value,
      this.targetStable,
      lerpSpeed,
    );
  }

  getHeightAt(worldX: number, worldZ: number): number {
    const half = TERRAIN_SIZE / 2;
    const clampedX = THREE.MathUtils.clamp(worldX, -half, half);
    const clampedZ = THREE.MathUtils.clamp(worldZ, -half, half);
    return sampleHeight(clampedX, clampedZ);
  }

  getBounds(): number {
    return TERRAIN_SIZE / 2 - 4;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
