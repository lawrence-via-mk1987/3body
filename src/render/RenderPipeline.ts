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
  private heatAmount = 0;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    quality: RenderQuality,
  ) {
    const useComposer = quality.bloom || quality.ssao || quality.heatHaze;
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
    this.composer.addPass(new OutputPass());
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
