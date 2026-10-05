import * as THREE from 'three';
import type { EraKind, EraPhase } from '../orbital/types';
import { createGroundTextures, type GroundTextureSet } from './proceduralTextures';
import { GROVE_LANDMARK, OBSERVATORY_LANDMARK, PIT_LANDMARK } from './landmarks';

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

/** Flat pad radius / floor for the pit bowl, the observatory plateau and the grove. */
export const PIT_SITE = { x: PIT_LANDMARK.x, z: PIT_LANDMARK.z, floor: -3.4, rim: -0.9, floorRadius: 5.5, rimRadius: 9.5, flatRadius: 11, blendRadius: 15 } as const;
export const OBSERVATORY_SITE = { x: OBSERVATORY_LANDMARK.x, z: OBSERVATORY_LANDMARK.z, level: 4.2, flatRadius: 8, blendRadius: 12 } as const;
export const GROVE_SITE = { x: GROVE_LANDMARK.x, z: GROVE_LANDMARK.z, level: 5.2, flatRadius: 9, blendRadius: 13, poolRadius: 3.6, poolDepth: 0.8 } as const;

function naturalHeight(worldX: number, worldZ: number): number {
  const ridge = Math.pow(Math.abs(fbm(worldX, worldZ) - 0.5) * 2, 1.4);
  const basin = fbm(worldX * 0.5 + 40, worldZ * 0.5 - 20);
  const cracks = Math.pow(1 - Math.abs(Math.sin(worldX * 0.08) * Math.cos(worldZ * 0.07)), 6);

  return (ridge * 0.75 + basin * 0.45 - cracks * 0.35) * HEIGHT_SCALE;
}

/**
 * Height field shared by physics and the mesh. The prototype's shape is kept, with three
 * landmark sites shaped into it so the pit is a real bowl, the observatory sits on a pad and
 * the grove has a pool basin.
 */
function sampleHeight(worldX: number, worldZ: number): number {
  let h = naturalHeight(worldX, worldZ);
  const ss = THREE.MathUtils.smoothstep;

  const pitR = Math.hypot(worldX - PIT_SITE.x, worldZ - PIT_SITE.z);
  if (pitR < PIT_SITE.blendRadius) {
    const bowl = PIT_SITE.floor + ss(pitR, PIT_SITE.floorRadius, PIT_SITE.rimRadius) * (PIT_SITE.rim - PIT_SITE.floor);
    h = THREE.MathUtils.lerp(h, bowl, 1 - ss(pitR, PIT_SITE.flatRadius, PIT_SITE.blendRadius));
  }

  const obsR = Math.hypot(worldX - OBSERVATORY_SITE.x, worldZ - OBSERVATORY_SITE.z);
  if (obsR < OBSERVATORY_SITE.blendRadius) {
    h = THREE.MathUtils.lerp(h, OBSERVATORY_SITE.level, 1 - ss(obsR, OBSERVATORY_SITE.flatRadius, OBSERVATORY_SITE.blendRadius));
  }

  const groveR = Math.hypot(worldX - GROVE_SITE.x, worldZ - GROVE_SITE.z);
  if (groveR < GROVE_SITE.blendRadius) {
    const pool = GROVE_SITE.level - GROVE_SITE.poolDepth * (1 - ss(groveR, GROVE_SITE.poolRadius * 0.35, GROVE_SITE.poolRadius));
    h = THREE.MathUtils.lerp(h, pool, 1 - ss(groveR, GROVE_SITE.flatRadius, GROVE_SITE.blendRadius));
  }

  return h;
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
    uTime: { value: 0 },
    uTriScale: { value: 1 / DETAIL_TILE_METRES },
    uTriSolarBlend: { value: 0 },
    uSolarLightBlend: { value: 0 },
    uSunDirs: {
      value: [
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 1, 0),
      ],
    },
    uSunCols: {
      value: [new THREE.Color('#ffffff'), new THREE.Color('#ffffff'), new THREE.Color('#ffffff')],
    },
    uSunPowers: { value: [0, 0, 0] },
  };
  private targetCold = 0;
  private targetHeat = 0;
  private targetStable = 0;
  private targetTriSolar = 0;
  private currentTriSolar = 0;
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
    for (const tex of [this.textures.albedo, this.textures.normal, this.textures.roughness, this.textures.ao]) {
      tex.repeat.set(repeat, repeat);
    }

    this.material = new THREE.MeshStandardMaterial({
      map: this.textures.albedo,
      normalMap: this.textures.normal,
      normalScale: new THREE.Vector2(1.05, 1.05),
      roughnessMap: this.textures.roughness,
      aoMap: this.textures.ao,
      aoMapIntensity: 1.15,
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
      shader.uniforms.uTime = this.uniforms.uTime;
      shader.uniforms.uTriScale = this.uniforms.uTriScale;
      shader.uniforms.uTriSolarBlend = this.uniforms.uTriSolarBlend;
      shader.uniforms.uSolarLightBlend = this.uniforms.uSolarLightBlend;
      shader.uniforms.uSunDirs = this.uniforms.uSunDirs;
      shader.uniforms.uSunCols = this.uniforms.uSunCols;
      shader.uniforms.uSunPowers = this.uniforms.uSunPowers;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <color_pars_vertex>',
        `#include <color_pars_vertex>
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;`,
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`,
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_pars_fragment>',
        `#include <color_pars_fragment>
        uniform float uColdBlend;
        uniform float uHeatBlend;
        uniform float uStableBlend;
        uniform vec2 uGroveCenter;
        uniform float uGroveRadius;
        uniform float uTime;
        uniform float uTriScale;
        uniform float uTriSolarBlend;
        float wet;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        float detailFade;
        vec3 triBlendWeights(vec3 n) {
          vec3 b = pow(abs(n), vec3(4.0));
          return b / (b.x + b.y + b.z);
        }
        vec4 triSample(sampler2D tex, vec3 w) {
          vec2 uvX = vWorldPosition.zy * uTriScale;
          vec2 uvY = vWorldPosition.xz * uTriScale;
          vec2 uvZ = vWorldPosition.xy * uTriScale;
          return texture2D(tex, uvX) * w.x + texture2D(tex, uvY) * w.y + texture2D(tex, uvZ) * w.z;
        }
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
        detailFade = 1.0 - smoothstep(18.0, 95.0, camDist);
        float slope = 1.0 - clamp(vWorldNormal.y, 0.0, 1.0);
        float triMix = smoothstep(0.26, 0.62, slope);
        vec3 triW = triBlendWeights(vWorldNormal);
        vec4 texTriA = triSample(map, triW);
        vec4 texTriB = triSample(map, triBlendWeights(normalize(vWorldNormal + vec3(0.08, 0.04, -0.06))));
        vec4 texA = texture2D(map, vMapUv);
        vec2 uvB = mat2(0.8, -0.6, 0.6, 0.8) * vMapUv * 0.23 + vec2(0.37, 0.11);
        vec4 texB = texture2D(map, uvB);
        float macro = terrainNoise(vWorldPosition.xz * 0.045) * 0.6
          + terrainNoise(vWorldPosition.xz * 0.011 + 7.3) * 0.4;
        vec4 planarColor = mix(texA, texB, 0.35 + macro * 0.3);
        vec4 triColor = mix(texTriA, texTriB, 0.35 + macro * 0.25);
        vec4 sampledDiffuseColor = mix(planarColor, triColor, triMix);
        vec3 avgGround = vec3(0.49, 0.35, 0.25) * (0.9 + terrainNoise(vWorldPosition.xz * 0.09 + 3.1) * 0.2);
        sampledDiffuseColor.rgb = mix(avgGround, sampledDiffuseColor.rgb, 0.42 + detailFade * 0.58);
        // Micro-normal breakup on planar ground (Path A ORM/detail).
        vec3 microN = texture2D(normalMap, vMapUv * 7.5).xyz * 2.0 - 1.0;
        float microW = detailFade * (1.0 - triMix * 0.65);
        sampledDiffuseColor.rgb *= 1.0 - microW * 0.06 * (1.0 - abs(microN.z));
        sampledDiffuseColor.rgb *= 0.86 + macro * 0.3;
        #ifdef USE_AOMAP
        float aoPlanar = texture2D(aoMap, vAoMapUv).r;
        float aoTri = triSample(aoMap, triW).r;
        float aoMix = mix(aoPlanar, aoTri, triMix);
        sampledDiffuseColor.rgb *= mix(1.0, aoMix, detailFade * 0.92);
        #endif
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
        // Rime: pale patches on exposed ground, not a flat blue wash.
        float frost = smoothstep(0.32, 0.72, terrainNoise(vWorldPosition.xz * 0.55 + 2.0));
        float ridge = 1.0 - lowland;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.84, 0.9), uColdBlend * 0.28);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.94, 0.97),
          uColdBlend * frost * (0.45 + ridge * 0.4));
        diffuseColor.rgb = mix(diffuseColor.rgb, scorchTint, uHeatBlend * 0.18);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.08, 0.92, 0.82), uHeatBlend * (1.0 - detailFade) * 0.12);
        float triPatch = terrainNoise(vWorldPosition.xz * 0.38 + vec2(2.1, 5.4));
        diffuseColor.rgb = mix(
          diffuseColor.rgb,
          diffuseColor.rgb * vec3(1.12, 0.84, 0.62),
          uTriSolarBlend * triPatch * 0.42);
        diffuseColor.rgb += vec3(0.07, 0.02, 0.01) * uTriSolarBlend * ridge * 0.55;
        // A slow brightness crawl so hot ground shimmers even without a post pass.
        float heatShimmer = sin(vWorldPosition.x * 2.4 + uTime * 3.5)
          * sin(vWorldPosition.z * 2.1 - uTime * 2.7);
        diffuseColor.rgb += heatShimmer * uHeatBlend * detailFade * 0.04;
        float groveDist = distance(vWorldPosition.xz, uGroveCenter);
        float groveMask = 1.0 - smoothstep(uGroveRadius * 0.35, uGroveRadius, groveDist);
        diffuseColor.rgb = mix(diffuseColor.rgb, groveTint, uStableBlend * groveMask * 0.8);
        // Damp soil around the pool. wet is read again by the roughness chunk.
        wet = (1.0 - smoothstep(2.4, 8.5, groveDist)) * uStableBlend;
        diffuseColor.rgb *= mix(1.0, 0.66, wet);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.12, 0.2, 0.14), wet * 0.4);
        vec3 nGround = normalize(vWorldNormal);
        vec3 sunLit = vec3(0.0);
        float sunMax = 0.0;
        for (int i = 0; i < 3; i++) {
          float ndl = max(dot(nGround, normalize(uSunDirs[i])), 0.0);
          sunMax = max(sunMax, ndl);
          sunLit += uSunCols[i] * ndl * uSunPowers[i];
        }
        diffuseColor.rgb += sunLit * uSolarLightBlend * 0.2;
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.72, 0.68, 0.78),
          uSolarLightBlend * (1.0 - sunMax) * 0.35);`,
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        'mapN.xy *= normalScale;',
        `{
          float slopeN = 1.0 - clamp(vWorldNormal.y, 0.0, 1.0);
          float triMixN = smoothstep(0.26, 0.62, slopeN);
          vec3 wN = triBlendWeights(vWorldNormal);
          vec3 tx = texture2D(normalMap, vWorldPosition.zy * uTriScale).xyz * 2.0 - 1.0;
          vec3 ty = texture2D(normalMap, vWorldPosition.xz * uTriScale).xyz * 2.0 - 1.0;
          vec3 tz = texture2D(normalMap, vWorldPosition.xy * uTriScale).xyz * 2.0 - 1.0;
          vec3 triN = normalize(tx * wN.x + ty * wN.y + tz * wN.z);
          vec3 microDetail = texture2D(normalMap, vMapUv * 7.5).xyz * 2.0 - 1.0;
          mapN.xy = mix(mapN.xy, triN.xy, triMixN);
          mapN.xy = mix(mapN.xy, microDetail.xy, detailFade * (1.0 - triMixN * 0.7) * 0.55);
          mapN.xy *= normalScale * (0.25 + detailFade * 0.85);
        }`,
      );

      // Wet grove soil and frost both lower roughness a little.
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        {
          float roughPlanar = texture2D(roughnessMap, vRoughnessMapUv).r;
          float roughTri = triSample(roughnessMap, triBlendWeights(vWorldNormal)).r;
          float slopeR = 1.0 - clamp(vWorldNormal.y, 0.0, 1.0);
          float triMixR = smoothstep(0.26, 0.62, slopeR);
          roughnessFactor = mix(roughPlanar, roughTri, triMixR);
        }
        {
          float groveDistR = distance(vWorldPosition.xz, uGroveCenter);
          float groveMaskR = 1.0 - smoothstep(uGroveRadius * 0.35, uGroveRadius, groveDistR);
          float wetR = (1.0 - smoothstep(2.4, 8.5, groveDistR)) * uStableBlend;
          roughnessFactor = mix(roughnessFactor, 0.55, uStableBlend * groveMaskR * 0.7);
          roughnessFactor = mix(roughnessFactor, 0.16, wetR);
        }
        roughnessFactor = mix(roughnessFactor, 0.7, uColdBlend * 0.4);`,
      );
    };
    this.material.customProgramCacheKey = () => 'terrain-realism-v6-orm-detail-normal';

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

  setSolarGroundLighting(
    blend: number,
    suns: { direction: THREE.Vector3; color: THREE.Color; power: number }[],
  ): void {
    this.uniforms.uSolarLightBlend.value = blend;
    for (let i = 0; i < 3; i += 1) {
      const sun = suns[i];
      if (!sun) {
        this.uniforms.uSunPowers.value[i] = 0;
        continue;
      }
      this.uniforms.uSunDirs.value[i].copy(sun.direction);
      this.uniforms.uSunCols.value[i].copy(sun.color);
      this.uniforms.uSunPowers.value[i] = sun.power;
    }
  }

  setEraVisuals(era: EraKind, phase: EraPhase): void {
    this.targetCold = phase === 'deep_cold' || phase === 'eclipse_relief' ? 1 : 0;
    this.targetHeat = phase === 'scorch' || phase === 'tri_solar' || phase === 'flying_star' ? 1 : 0;
    this.targetStable = era === 'stable' ? 1 : 0;
    this.targetTriSolar = phase === 'tri_solar' ? 1 : phase === 'flying_star' ? 0.35 : 0;
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
    this.uniforms.uTime.value += delta;
    this.currentTriSolar = THREE.MathUtils.lerp(this.currentTriSolar, this.targetTriSolar, lerpSpeed);
    this.uniforms.uTriSolarBlend.value = this.currentTriSolar;
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

  /**
   * Lowest mesh height under a prop footprint. Props placed with this sink into a slope a
   * little instead of floating off its downhill side.
   */
  getSettleHeight(worldX: number, worldZ: number, radius: number): number {
    let min = this.getHeightAt(worldX, worldZ);
    for (const [dx, dz] of [[radius, 0], [-radius, 0], [0, radius], [0, -radius]]) {
      min = Math.min(min, this.getHeightAt(worldX + dx, worldZ + dz));
    }
    return min;
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
