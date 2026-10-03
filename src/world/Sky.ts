import * as THREE from 'three';

const MAX_SUNS = 3;

export interface SkySunInput {
  direction: THREE.Vector3;
  color: THREE.Color;
  /** 0 = off. Drives both the halo size and horizon scattering. */
  intensity: number;
  apparentScale: number;
}

/**
 * Gradient dome with per-sun forward scattering, a horizon haze band and a faint
 * star field that shows through when the sky is dark.
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
        uDarkness: { value: 0 },
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
        uniform float uDarkness;
        varying vec3 vWorldPosition;

        float hash13(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.zyx + 31.32);
          return fract((p.x + p.y) * p.z);
        }

        void main() {
          vec3 dir = normalize(vWorldPosition - cameraPosition);
          float h = dir.y * 0.5 + 0.5;

          vec3 color = mix(uBottomColor, uHorizonColor, smoothstep(0.0, 0.42, h));
          color = mix(color, uTopColor, smoothstep(0.38, 1.0, h));

          // Dust haze sits on the horizon and lifts the band slightly.
          float haze = exp(-abs(dir.y) * 9.0);
          color += uHorizonColor * haze * 0.35;

          // Forward scattering around each active sun: tight hot core + wide warm wash.
          for (int i = 0; i < MAX_SUNS; i++) {
            float inten = uSunIntensities[i];
            if (inten <= 0.001) continue;
            float cosA = max(dot(dir, uSunDirections[i]), 0.0);
            float wide = pow(cosA, 6.0) * 0.22 * inten;
            float tight = pow(cosA, 180.0 / uSunScales[i]) * 0.9 * inten;
            float horizonBoost = 1.0 + (1.0 - clamp(uSunDirections[i].y * 2.5, 0.0, 1.0)) * 0.8;
            color += uSunColors[i] * (wide + tight) * horizonBoost;
          }

          // Stars fade in with darkness; hidden below the horizon haze.
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

  update(): void {
    this.currentTop.lerp(this.targetTop, 0.05);
    this.currentHorizon.lerp(this.targetHorizon, 0.05);
    this.currentBottom.lerp(this.targetBottom, 0.05);

    this.material.uniforms.uTopColor.value.copy(this.currentTop);
    this.material.uniforms.uHorizonColor.value.copy(this.currentHorizon);
    this.material.uniforms.uBottomColor.value.copy(this.currentBottom);
    this.material.uniforms.uDarkness.value = THREE.MathUtils.lerp(
      this.material.uniforms.uDarkness.value as number,
      this.darkness,
      0.04,
    );
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
