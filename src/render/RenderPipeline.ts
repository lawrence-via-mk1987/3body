import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { RenderQuality } from '../platform/renderQuality';

/**
 * Wraps the renderer so Game can call render()/setSize() without caring whether
 * post-processing is on. Bloom threshold sits above 1.0 so only the sun disks bloom.
 */
export class RenderPipeline {
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    quality: RenderQuality,
  ) {
    if (!quality.bloom) {
      return;
    }
    const size = renderer.getSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, {
      type: THREE.HalfFloatType,
      samples: 4,
    });
    this.composer = new EffectComposer(renderer, target);
    this.composer.setPixelRatio(renderer.getPixelRatio());
    this.composer.addPass(new RenderPass(scene, camera));
    this.bloomPass = new UnrealBloomPass(size.clone(), 0.55, 0.45, 1.05);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }

  /** Scale bloom with the sky: flying stars glare, deep cold barely glows. */
  setBloomStrength(strength: number): void {
    if (this.bloomPass) {
      this.bloomPass.strength = THREE.MathUtils.lerp(this.bloomPass.strength, strength, 0.05);
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
  }

  dispose(): void {
    this.composer?.dispose();
    this.bloomPass?.dispose();
  }
}
