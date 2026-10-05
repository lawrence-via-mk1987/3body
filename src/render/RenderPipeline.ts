import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import type { RenderQuality } from '../platform/renderQuality';

/**
 * Refracts the lower part of the frame while the ground is hot. Sits after bloom and before
 * the output pass, so the sun disks still bloom cleanly and only the air above the ground wavers.
 */
const LUT_SIZE = 16;

const CinematicPostShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uAmount: { value: 0.35 },
    uEraTint: { value: new THREE.Vector3(1, 1, 1) },
    uLutA: { value: null as THREE.Texture | null },
    uLutB: { value: null as THREE.Texture | null },
    uLutMix: { value: 0 },
    uLutStrength: { value: 0 },
    uLutsReady: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAmount;
    uniform vec3 uEraTint;
    uniform sampler2D uLutA;
    uniform sampler2D uLutB;
    uniform float uLutMix;
    uniform float uLutStrength;
    uniform float uLutsReady;
    varying vec2 vUv;
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    vec3 tonemapForLut(vec3 c) {
      c = max(c, vec3(0.0));
      return clamp(c / (c + vec3(1.0)), 0.0, 1.0);
    }

    vec3 sampleLut(vec3 ldr, sampler2D lutTex) {
      float b = ldr.b * 15.0;
      float g = ldr.g * 15.0;
      float r = ldr.r * 15.0;
      float bFloor = floor(b);
      vec2 uv1 = vec2((r + bFloor * ${LUT_SIZE}.0 + 0.5) / 256.0, (g + 0.5) / ${LUT_SIZE}.0);
      vec2 uv2 = vec2((r + min(bFloor + 1.0, 15.0) * ${LUT_SIZE}.0 + 0.5) / 256.0, (g + 0.5) / ${LUT_SIZE}.0);
      vec3 c1 = texture2D(lutTex, uv1).rgb;
      vec3 c2 = texture2D(lutTex, uv2).rgb;
      return mix(c1, c2, fract(b));
    }

    void main() {
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float vig = 1.0 - dot(c, c) * 1.35 * uAmount;
      float grain = (hash(uv * (uTime * 60.0 + 1.0)) - 0.5) * 0.035 * uAmount;
      vec3 hdr = texture2D(tDiffuse, uv).rgb * uEraTint;
      vec3 col = hdr;
      if (uLutsReady > 0.5 && uLutStrength > 0.01) {
        vec3 ldr = tonemapForLut(hdr);
        vec3 lutCol = mix(sampleLut(ldr, uLutA), sampleLut(ldr, uLutB), uLutMix);
        vec3 gain = lutCol / max(ldr, vec3(0.02));
        col = hdr * mix(vec3(1.0), gain, uLutStrength * uAmount);
      }
      col = col * vig + grain;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

const HeatHazeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uAmount: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAmount;
    varying vec2 vUv;
    void main() {
      float ground = smoothstep(0.42, 0.02, vUv.y);
      float n = sin(vUv.y * 38.0 + uTime * 5.0) * sin(vUv.x * 22.0 - uTime * 3.0);
      vec2 offset = vec2(n, n * 0.25) * 0.0016 * uAmount * ground;
      gl_FragColor = texture2D(tDiffuse, vUv + offset);
    }
  `,
};

/**
 * Wraps the renderer so Game can call render()/setSize() without caring whether
 * post-processing is on. Bloom threshold sits above 1.0 so only the sun disks bloom.
 */
export class RenderPipeline {
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private heatPass: ShaderPass | null = null;
  private ssaoPass: SSAOPass | null = null;
  private cinematicPass: ShaderPass | null = null;
  private heatAmount = 0;
  private cinematicAmount = 0.32;
  private readonly eraLuts = new Map<string, THREE.Texture>();
  private lutMixTarget = 0;
  private lutMixCurrent = 0;
  private lutStrengthTarget = 0.55;
  private lutAKey = 'era-neutral';
  private lutBKey = 'era-stable';
  private lutsReady = false;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    quality: RenderQuality,
  ) {
    const useComposer = quality.bloom || quality.ssao || quality.heatHaze || quality.cinematicPost;
    if (!useComposer) {
      return;
    }
    const size = renderer.getSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, {
      type: THREE.HalfFloatType,
      samples: quality.ssao ? 0 : 4,
    });
    this.composer = new EffectComposer(renderer, target);
    this.composer.setPixelRatio(renderer.getPixelRatio());
    this.composer.addPass(new RenderPass(scene, camera));
    if (quality.ssao) {
      this.ssaoPass = new SSAOPass(scene, camera, size.x, size.y, 24);
      this.ssaoPass.output = SSAOPass.OUTPUT.Default;
      this.ssaoPass.kernelRadius = 14;
      this.ssaoPass.minDistance = 0.003;
      this.ssaoPass.maxDistance = 0.14;
      this.composer.addPass(this.ssaoPass);
    }
    if (quality.bloom) {
      this.bloomPass = new UnrealBloomPass(size.clone(), 0.55, 0.45, 1.05);
      this.composer.addPass(this.bloomPass);
    }
    if (quality.heatHaze) {
      this.heatPass = new ShaderPass(HeatHazeShader);
      this.heatPass.enabled = false;
      this.composer.addPass(this.heatPass);
    }
    if (quality.cinematicPost) {
      this.cinematicPass = new ShaderPass(CinematicPostShader);
      this.cinematicPass.uniforms.uAmount.value = this.cinematicAmount;
      this.composer.addPass(this.cinematicPass);
    }
    this.composer.addPass(new OutputPass());
  }

  /** Flying star / Stable Era desktop polish (0–1). */
  setCinematicPost(target: number, delta: number): void {
    if (!this.cinematicPass) {
      return;
    }
    this.cinematicAmount = THREE.MathUtils.lerp(this.cinematicAmount, target, Math.min(delta * 1.5, 1));
    this.cinematicPass.uniforms.uAmount.value = this.cinematicAmount;
    this.cinematicPass.uniforms.uTime.value += delta;
  }

  /** Load 16³ strip LUT PNGs (desktop cinematic post). */
  async loadEraLuts(baseUrl: string): Promise<void> {
    const loader = new THREE.TextureLoader();
    const names = ['era-neutral', 'era-stable', 'era-chaos', 'era-flying', 'era-cold'] as const;
    await Promise.all(
      names.map(async (name) => {
        const tex = await loader.loadAsync(`${baseUrl}assets/luts/${name}.png`);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        this.eraLuts.set(name, tex);
      }),
    );
    this.lutsReady = this.eraLuts.size >= 5;
    this.applyLutUniforms();
    if (this.cinematicPass) {
      this.cinematicPass.uniforms.uLutsReady.value = this.lutsReady ? 1 : 0;
    }
  }

  /** Cross-fade between two named LUT presets. */
  setEraLutBlend(lutA: string, lutB: string, mix: number, strength: number, delta: number): void {
    if (!this.cinematicPass || !this.lutsReady) {
      return;
    }
    this.lutAKey = lutA;
    this.lutBKey = lutB;
    this.lutMixTarget = THREE.MathUtils.clamp(mix, 0, 1);
    this.lutStrengthTarget = THREE.MathUtils.clamp(strength, 0, 1);
    this.lutMixCurrent = THREE.MathUtils.lerp(this.lutMixCurrent, this.lutMixTarget, Math.min(delta * 0.65, 1));
    this.cinematicPass.uniforms.uLutMix.value = this.lutMixCurrent;
    this.cinematicPass.uniforms.uLutStrength.value = THREE.MathUtils.lerp(
      this.cinematicPass.uniforms.uLutStrength.value as number,
      this.lutStrengthTarget,
      Math.min(delta * 0.65, 1),
    );
    this.applyLutUniforms();
  }

  private applyLutUniforms(): void {
    if (!this.cinematicPass) {
      return;
    }
    const a = this.eraLuts.get(this.lutAKey) ?? this.eraLuts.get('era-neutral');
    const b = this.eraLuts.get(this.lutBKey) ?? a;
    this.cinematicPass.uniforms.uLutA.value = a ?? null;
    this.cinematicPass.uniforms.uLutB.value = b ?? null;
  }

  /** Desktop color grade toward era mood (Path A). */
  setEraColorGrade(r: number, g: number, b: number, delta: number): void {
    if (!this.cinematicPass) {
      return;
    }
    const tint = this.cinematicPass.uniforms.uEraTint.value as THREE.Vector3;
    tint.x = THREE.MathUtils.lerp(tint.x, r, Math.min(delta * 0.8, 1));
    tint.y = THREE.MathUtils.lerp(tint.y, g, Math.min(delta * 0.8, 1));
    tint.z = THREE.MathUtils.lerp(tint.z, b, Math.min(delta * 0.8, 1));
  }

  /** 0 = still air, 1 = scorch / tri-solar / flying star. No-ops where the pass was not built. */
  setHeat(target: number, delta: number): void {
    if (!this.heatPass) {
      return;
    }
    this.heatAmount = THREE.MathUtils.lerp(this.heatAmount, target, Math.min(delta * 1.2, 1));
    this.heatPass.enabled = this.heatAmount > 0.02;
    this.heatPass.uniforms.uAmount.value = this.heatAmount;
    this.heatPass.uniforms.uTime.value += delta;
  }

  /** Scale bloom with the sky: flying stars glare, deep cold barely glows. */
  setBloomStrength(strength: number): void {
    if (this.bloomPass) {
      this.bloomPass.strength = THREE.MathUtils.lerp(this.bloomPass.strength, strength, 0.05);
    }
  }

  setBloomThreshold(threshold: number): void {
    if (this.bloomPass) {
      this.bloomPass.threshold = THREE.MathUtils.lerp(this.bloomPass.threshold, threshold, 0.08);
    }
  }

  /** Flat terrain + SSAO can read as a grey sky floor; disable in Stable Era. */
  setSsaoEnabled(enabled: boolean): void {
    if (this.ssaoPass) {
      this.ssaoPass.enabled = enabled;
    }
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(scene, camera);
    }
  }

  setSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    this.composer?.setSize(width, height);
    this.bloomPass?.setSize(width, height);
    this.ssaoPass?.setSize(width, height);
  }

  dispose(): void {
    this.composer?.dispose();
    this.bloomPass?.dispose();
    this.ssaoPass?.dispose();
  }
}
