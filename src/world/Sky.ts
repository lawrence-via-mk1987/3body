import * as THREE from 'three';

const MAX_SUNS = 3;

export interface SkySunInput {
  direction: THREE.Vector3;
  color: THREE.Color;
  /** 0 = off. Drives both the halo size and horizon scattering. */
  intensity: number;
  apparentScale: number;
}

export interface SkyCloudSettings {
  /** 0–1 amount of cloud cover in the upper sky. */
  cover: number;
  /** Multiplier on cloud brightness vs sky. */
  brightness: number;
  color: string;
}

/**
 * Gradient dome with per-sun forward scattering, era clouds, a Milky-Way band,
 * and a star field that shows through when the sky is dark.
 */
export class Sky {
  readonly mesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;
  private readonly targetTop = new THREE.Color('#1a2238');
  private readonly targetHorizon = new THREE.Color('#6d3d28');
  private readonly targetBottom = new THREE.Color('#2a1810');
  private readonly currentTop = new THREE.Color('#1a2238');
  private readonly currentHorizon = new THREE.Color('#6d3d28');
  private readonly currentBottom = new THREE.Color('#2a1810');
  private readonly sunDirections = Array.from({ length: MAX_SUNS }, () => new THREE.Vector3(0, 1, 0));
  private readonly sunColors = Array.from({ length: MAX_SUNS }, () => new THREE.Color('#ffffff'));
  private readonly sunIntensities = new Float32Array(MAX_SUNS);
  private readonly sunScales = new Float32Array(MAX_SUNS).fill(1);
  private darkness = 0;
  private targetGalaxy = 0;
  private targetCloudCover = 0;
  private targetCloudBright = 1;
  private readonly targetCloudColor = new THREE.Color('#eef2f8');
  private readonly currentCloudColor = new THREE.Color('#eef2f8');
  private sunScatterScale = 1;
  private godRayStrength = 1;
  private targetHorizonHaze = 0.35;
  private horizonHaze = 0.35;
  private time = 0;

  constructor() {
    const geometry = new THREE.SphereGeometry(480, 48, 24);
    this.material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTopColor: { value: this.currentTop.clone() },
        uHorizonColor: { value: this.currentHorizon.clone() },
        uBottomColor: { value: this.currentBottom.clone() },
        uSunDirections: { value: this.sunDirections },
        uSunColors: { value: this.sunColors },
        uSunIntensities: { value: this.sunIntensities },
        uSunScales: { value: this.sunScales },
        uSunScatterScale: { value: 1 },
        uGodRayStrength: { value: 1 },
        uDarkness: { value: 0 },
        uGalaxy: { value: 0 },
        uCloudCover: { value: 0 },
        uCloudBright: { value: 1 },
        uCloudColor: { value: this.currentCloudColor.clone() },
        uTime: { value: 0 },
        uHorizonHaze: { value: 0.35 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        #define MAX_SUNS ${MAX_SUNS}
        uniform vec3 uTopColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uBottomColor;
        uniform vec3 uSunDirections[MAX_SUNS];
        uniform vec3 uSunColors[MAX_SUNS];
        uniform float uSunIntensities[MAX_SUNS];
        uniform float uSunScales[MAX_SUNS];
        uniform float uSunScatterScale;
        uniform float uGodRayStrength;
        uniform float uDarkness;
        uniform float uGalaxy;
        uniform float uCloudCover;
        uniform float uCloudBright;
        uniform vec3 uCloudColor;
        uniform float uTime;
        uniform float uHorizonHaze;
        varying vec3 vWorldPosition;

        float hash13(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.zyx + 31.32);
          return fract((p.x + p.y) * p.z);
        }

        float hash21(vec2 p) {
          return hash13(vec3(p.x, p.y, 0.17));
        }

        float noise2(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm2(vec2 p) {
          float v = 0.0;
          float a = 0.55;
          for (int i = 0; i < 4; i++) {
            v += noise2(p) * a;
            p *= 2.05;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 dir = normalize(vWorldPosition - cameraPosition);
          float h = dir.y * 0.5 + 0.5;

          vec3 color = mix(uBottomColor, uHorizonColor, smoothstep(0.0, 0.42, h));
          color = mix(color, uTopColor, smoothstep(0.38, 1.0, h));

          float haze = exp(-abs(dir.y) * 9.0);
          color += uHorizonColor * haze * uHorizonHaze;

          float scatter = uSunScatterScale;
          float rays = uGodRayStrength;
          for (int i = 0; i < MAX_SUNS; i++) {
            float inten = uSunIntensities[i] * scatter;
            if (inten <= 0.001) continue;
            float cosA = max(dot(dir, uSunDirections[i]), 0.0);
            float limb = 0.35 + 0.65 * cosA;
            float wide = pow(cosA, mix(5.0, 8.0, rays)) * (0.2 + rays * 0.12) * inten;
            float diskPow = mix(140.0, 52.0, rays) / max(uSunScales[i], 0.45);
            float tight = pow(cosA, diskPow) * (0.75 + rays * 0.35) * inten * limb;
            float streak = pow(cosA, 2.5) * (1.0 - smoothstep(0.0, 0.55, dir.y)) * 0.18 * rays * inten;
            float horizonBoost = 1.0 + (1.0 - clamp(uSunDirections[i].y * 2.5, 0.0, 1.0)) * (0.75 + rays * 0.35);
            color += uSunColors[i] * (wide + tight + streak) * horizonBoost;
          }

          if (uGalaxy > 0.01 && dir.y > -0.05) {
            vec3 gal = normalize(vec3(dir.x * 0.55 + 0.08, dir.y * 0.85 + 0.12, dir.z * 0.5));
            float band = exp(-pow(gal.y * 2.8, 2.0));
            vec2 uv = vec2(atan(gal.z, gal.x) * 0.32, gal.y * 3.5 + 1.2);
            float dust = fbm2(uv * 3.2);
            float core = fbm2(uv * 8.0 + vec2(0.4, 1.1));
            vec3 galCol = mix(vec3(0.08, 0.1, 0.16), vec3(0.35, 0.38, 0.48), dust);
            galCol += vec3(0.45, 0.42, 0.55) * core * 0.35;
            float vis = band * (0.35 + dust * 0.65) * uGalaxy;
            vis *= smoothstep(-0.08, 0.15, dir.y);
            color += galCol * vis;
          }

          if (uCloudCover > 0.02 && dir.y > 0.04) {
            float u = atan(dir.z, dir.x) * 1.35;
            float v = dir.y * 2.8;
            vec2 wind = vec2(uTime * 0.018, uTime * 0.011);
            float c1 = fbm2(vec2(u * 2.1 + wind.x, v * 3.4 + wind.y));
            float c2 = fbm2(vec2(u * 4.6 - wind.x * 0.7, v * 5.2 + 2.4));
            float cloud = smoothstep(0.52 - uCloudCover * 0.38, 0.78, c1 * 0.55 + c2 * 0.45);
            cloud *= uCloudCover * smoothstep(0.04, 0.45, dir.y);
            vec3 lit = mix(uCloudColor * 0.55, uCloudColor * uCloudBright, c2);
            color = mix(color, lit, cloud * 0.92);
          }

          if (uDarkness > 0.01 && dir.y > 0.02) {
            vec3 cell = floor(dir * 320.0);
            float star = hash13(cell);
            float twinkle = step(0.9965, star);
            float brightness = (star - 0.9965) / 0.0035;
            color += vec3(0.9, 0.93, 1.0) * twinkle * brightness * uDarkness * smoothstep(0.02, 0.2, dir.y);
          }

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
  }

  setPalette(top: string, horizon: string, bottom: string): void {
    this.targetTop.set(top);
    this.targetHorizon.set(horizon);
    this.targetBottom.set(bottom);
  }

  setClouds(settings: SkyCloudSettings): void {
    this.targetCloudCover = THREE.MathUtils.clamp(settings.cover, 0, 1);
    this.targetCloudBright = Math.max(settings.brightness, 0.2);
    this.targetCloudColor.set(settings.color);
  }

  /** 0 = no band, 1 = deep-space Milky Way behind the diagram. */
  setGalaxyStrength(value: number): void {
    this.targetGalaxy = THREE.MathUtils.clamp(value, 0, 1);
  }

  /** Scales sky-dome sun glare only (gameplay sun meshes are separate). */
  setSunScatterScale(value: number): void {
    this.sunScatterScale = THREE.MathUtils.clamp(value, 0, 2.5);
  }

  /** Forward-scatter / god-ray intensity on the sky dome (0–1.5). */
  setGodRayStrength(value: number): void {
    this.godRayStrength = THREE.MathUtils.clamp(value, 0, 1.5);
  }

  /** Extra golden band at the horizon (lower in Stable Era so soil reads against sky). */
  setHorizonHazeStrength(value: number): void {
    this.targetHorizonHaze = THREE.MathUtils.clamp(value, 0, 0.55);
  }

  /** Feed the current suns every frame; inactive suns should pass intensity 0. */
  setSuns(suns: readonly SkySunInput[]): void {
    for (let i = 0; i < MAX_SUNS; i += 1) {
      const sun = suns[i];
      if (!sun) {
        this.sunIntensities[i] = 0;
        continue;
      }
      this.sunDirections[i].copy(sun.direction);
      this.sunColors[i].copy(sun.color);
      this.sunIntensities[i] = sun.intensity;
      this.sunScales[i] = Math.max(sun.apparentScale, 0.4);
    }
  }

  /** 0 = bright day, 1 = deep night (stars fully visible). */
  setDarkness(value: number): void {
    this.darkness = THREE.MathUtils.clamp(value, 0, 1);
  }

  /** Current palette as flat colours, for environment lighting. */
  getCurrentPalette(): { top: THREE.Color; horizon: THREE.Color; bottom: THREE.Color } {
    return { top: this.currentTop, horizon: this.currentHorizon, bottom: this.currentBottom };
  }

  update(delta = 1 / 60): void {
    this.time += delta;
    this.currentTop.lerp(this.targetTop, 0.05);
    this.currentHorizon.lerp(this.targetHorizon, 0.05);
    this.currentBottom.lerp(this.targetBottom, 0.05);
    this.currentCloudColor.lerp(this.targetCloudColor, 0.05);

    const u = this.material.uniforms;
    u.uTopColor.value.copy(this.currentTop);
    u.uHorizonColor.value.copy(this.currentHorizon);
    u.uBottomColor.value.copy(this.currentBottom);
    u.uCloudColor.value.copy(this.currentCloudColor);
    u.uDarkness.value = THREE.MathUtils.lerp(u.uDarkness.value as number, this.darkness, 0.04);
    u.uGalaxy.value = THREE.MathUtils.lerp(u.uGalaxy.value as number, this.targetGalaxy, 0.05);
    u.uCloudCover.value = THREE.MathUtils.lerp(u.uCloudCover.value as number, this.targetCloudCover, 0.04);
    u.uCloudBright.value = THREE.MathUtils.lerp(u.uCloudBright.value as number, this.targetCloudBright, 0.04);
    u.uSunScatterScale.value = this.sunScatterScale;
    u.uGodRayStrength.value = THREE.MathUtils.lerp(
      u.uGodRayStrength.value as number,
      this.godRayStrength,
      0.06,
    );
    u.uTime.value = this.time;
    this.horizonHaze = THREE.MathUtils.lerp(this.horizonHaze, this.targetHorizonHaze, 0.05);
    u.uHorizonHaze.value = this.horizonHaze;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
