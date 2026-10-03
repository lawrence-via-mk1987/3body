import * as THREE from 'three';
import type { EraKind, EraPhase } from '../orbital/types';
import { createGroundTextures, type GroundTextureSet } from './proceduralTextures';

const TERRAIN_SIZE = 512;
const DEFAULT_SEGMENTS = 192;
const HEIGHT_SCALE = 18;
const GROVE_CENTER = new THREE.Vector2(28, -32);
const GROVE_RADIUS = 14;
/** World metres covered by one repeat of the detail texture. */
const DETAIL_TILE_METRES = 9;

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

/**
 * Height field. Shared by physics (getHeightAt) and the mesh, so the shape is
 * intentionally unchanged from the prototype — only the shading is new.
 */
function sampleHeight(worldX: number, worldZ: number): number {
  const ridge = Math.pow(Math.abs(fbm(worldX, worldZ) - 0.5) * 2, 1.4);
  const basin = fbm(worldX * 0.5 + 40, worldZ * 0.5 - 20);
  const cracks = Math.pow(1 - Math.abs(Math.sin(worldX * 0.08) * Math.cos(worldZ * 0.07)), 6);

  return (ridge * 0.75 + basin * 0.45 - cracks * 0.35) * HEIGHT_SCALE;
}

export interface TerrainOptions {
  segments?: number;
  textureSize?: number;
  anisotropy?: number;
}

export class Terrain {
  readonly mesh: THREE.Mesh;
  private readonly geometry: THREE.PlaneGeometry;
  private readonly material: THREE.MeshStandardMaterial;
  private readonly textures: GroundTextureSet;
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
  /** Baked vertex heights, row-major (z rows, x columns), for mesh-exact collision. */
  private readonly heights: Float32Array;
  private readonly segments: number;

  constructor(options: TerrainOptions = {}) {
    const segments = options.segments ?? DEFAULT_SEGMENTS;
    this.segments = segments;
    this.geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, segments, segments);
    this.geometry.rotateX(-Math.PI / 2);
    this.heights = new Float32Array((segments + 1) * (segments + 1));
    this.bakeVertices();

    this.textures = createGroundTextures(options.textureSize ?? 1024, options.anisotropy ?? 8);
    const repeat = TERRAIN_SIZE / DETAIL_TILE_METRES;
    for (const tex of [this.textures.albedo, this.textures.normal, this.textures.roughness]) {
      tex.repeat.set(repeat, repeat);
    }

    this.material = new THREE.MeshStandardMaterial({
      map: this.textures.albedo,
      normalMap: this.textures.normal,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughnessMap: this.textures.roughness,
      vertexColors: true,
      roughness: 1,
      metalness: 0.0,
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
        varying vec3 vWorldPosition;
        float detailFade;
        float terrainHash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float terrainNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(terrainHash(i), terrainHash(i + vec2(1.0, 0.0)), u.x),
            mix(terrainHash(i + vec2(0.0, 1.0)), terrainHash(i + vec2(1.0, 1.0)), u.x),
            u.y);
        }`,
      );

      // Two differently scaled samples hide the tile repeat; far away we fall back to the
      // average ground colour so the horizon does not shimmer with texture noise.
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        float camDist = distance(vWorldPosition, cameraPosition);
        detailFade = smoothstep(95.0, 18.0, camDist);
        vec4 texA = texture2D(map, vMapUv);
        vec2 uvB = mat2(0.8, -0.6, 0.6, 0.8) * vMapUv * 0.23 + vec2(0.37, 0.11);
        vec4 texB = texture2D(map, uvB);
        float macro = terrainNoise(vWorldPosition.xz * 0.045) * 0.6
          + terrainNoise(vWorldPosition.xz * 0.011 + 7.3) * 0.4;
        vec4 sampledDiffuseColor = mix(texA, texB, 0.35 + macro * 0.3);
        vec3 avgGround = vec3(0.49, 0.35, 0.25) * (0.9 + terrainNoise(vWorldPosition.xz * 0.09 + 3.1) * 0.2);
        sampledDiffuseColor.rgb = mix(avgGround, sampledDiffuseColor.rgb, 0.18 + detailFade * 0.82);
        sampledDiffuseColor.rgb *= 0.86 + macro * 0.3;
        diffuseColor *= sampledDiffuseColor;`,
      );

      // Vertex colours are a macro tint centred on 0.5 (see bakeVertices).
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        diffuseColor.rgb *= vColor.rgb * 2.0;
        vec3 iceTint = vec3(0.66, 0.76, 0.88);
        vec3 scorchTint = vec3(0.44, 0.27, 0.17);
        vec3 groveTint = vec3(0.26, 0.48, 0.22);
        float lowland = smoothstep(10.0, 2.0, vWorldPosition.y);
        diffuseColor.rgb = mix(diffuseColor.rgb, iceTint, uColdBlend * (0.3 + lowland * 0.42));
        diffuseColor.rgb = mix(diffuseColor.rgb, scorchTint, uHeatBlend * 0.28);
        float groveDist = distance(vWorldPosition.xz, uGroveCenter);
        float groveMask = 1.0 - smoothstep(uGroveRadius * 0.35, uGroveRadius, groveDist);
        diffuseColor.rgb = mix(diffuseColor.rgb, groveTint, uStableBlend * groveMask * 0.8);`,
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        'mapN.xy *= normalScale;',
        'mapN.xy *= normalScale * (0.25 + detailFade * 0.75);',
      );

      // Wet grove soil and frost both lower roughness a little.
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.55, uStableBlend * groveMask * 0.7);
        roughnessFactor = mix(roughnessFactor, 0.7, uColdBlend * 0.4);`,
      );
    };
    this.material.customProgramCacheKey = () => 'terrain-realism-v2';

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
  }

  private bakeVertices(): void {
    const position = this.geometry.attributes.position;
    const colors = new Float32Array(position.count * 3);

    // Centred on 0.5 so the shader's ×2 yields a neutral multiplier on average.
    const lowTint = new THREE.Color('#7a6658');
    const highTint = new THREE.Color('#948478');
    const crackTint = new THREE.Color('#3e3028');
    const ridgeTint = new THREE.Color('#a09080');
    const tint = new THREE.Color();
    const sampleStep = TERRAIN_SIZE / (this.geometry.parameters.widthSegments) * 1.5;

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const height = sampleHeight(x, z);
      position.setY(i, height);
      this.heights[i] = height;

      const blend = THREE.MathUtils.clamp(height / HEIGHT_SCALE, 0, 1);
      const crack = Math.pow(1 - Math.abs(Math.sin(x * 0.08) * Math.cos(z * 0.07)), 10);

      // Laplacian: positive in hollows (ambient occlusion), negative on ridges.
      const laplacian = (
        sampleHeight(x + sampleStep, z)
        + sampleHeight(x - sampleStep, z)
        + sampleHeight(x, z + sampleStep)
        + sampleHeight(x, z - sampleStep)
        - 4 * height
      ) / (sampleStep * sampleStep);
      const hollow = THREE.MathUtils.clamp(laplacian * 18, 0, 1);
      const ridge = THREE.MathUtils.clamp(-laplacian * 18, 0, 1);

      tint.copy(lowTint).lerp(highTint, blend);
      tint.lerp(ridgeTint, ridge * 0.6);
      tint.lerp(crackTint, crack * 0.7);
      tint.multiplyScalar(1 - hollow * 0.28);

      colors[i * 3] = tint.r;
      colors[i * 3 + 1] = tint.g;
      colors[i * 3 + 2] = tint.b;
    }

    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.computeVertexNormals();
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

  /**
   * Height of the rendered mesh (not the analytic field) so props and feet sit on the
   * visible surface even where the trench edges are sharper than the vertex grid.
   * Mirrors PlaneGeometry's triangulation: the cell diagonal runs from (x0,z1) to (x1,z0).
   */
  getHeightAt(worldX: number, worldZ: number): number {
    const half = TERRAIN_SIZE / 2;
    const cell = TERRAIN_SIZE / this.segments;
    const gx = THREE.MathUtils.clamp((worldX + half) / cell, 0, this.segments - 1e-6);
    const gz = THREE.MathUtils.clamp((worldZ + half) / cell, 0, this.segments - 1e-6);
    const ix = Math.floor(gx);
    const iz = Math.floor(gz);
    const fx = gx - ix;
    const fz = gz - iz;
    const stride = this.segments + 1;
    const h00 = this.heights[iz * stride + ix];
    const h10 = this.heights[iz * stride + ix + 1];
    const h01 = this.heights[(iz + 1) * stride + ix];
    const h11 = this.heights[(iz + 1) * stride + ix + 1];
    if (fx + fz <= 1) {
      return h00 + (h10 - h00) * fx + (h01 - h00) * fz;
    }
    return h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
  }

  getBounds(): number {
    return TERRAIN_SIZE / 2 - 4;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.textures.albedo.dispose();
    this.textures.normal.dispose();
    this.textures.roughness.dispose();
  }
}
