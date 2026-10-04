import * as THREE from 'three';
import type { NarrationDirector } from '../audio/NarrationDirector';
import type { Locale } from '../i18n/locale';
import type { OrbitalDirector } from '../orbital/OrbitalDirector';
import type { RenderPipeline } from '../render/RenderPipeline';
import type { Sky } from '../world/Sky';
import type { Terrain } from '../world/Terrain';
import {
  buildHumanoidNpc,
  stepHumanoidIdle,
  type HumanoidNpcStyle,
} from '../world/HumanoidNpc';
import type { CutsceneBeat } from './sceneContent';

const WITNESS_STYLE: HumanoidNpcStyle = {
  skin: '#1c1410',
  robe: '#6a6460',
  accent: '#5a5550',
  accentEmissive: '#000000',
  footRing: 0,
};

interface ActiveCutscene {
  beats: CutsceneBeat[];
  index: number;
  elapsed: number;
  onComplete: () => void;
  locale: Locale;
  pulse: number;
}

export class CutsceneController {
  private session: ActiveCutscene | null = null;
  private witness: THREE.Group | null = null;
  private animationId = 0;
  private readonly stage = new THREE.Vector3(0, 0, 14);
  private readonly cinematicPos = new THREE.Vector3(0, 11.5, 22);
  private readonly lookAt = new THREE.Vector3(0, 10.5, 14);

  constructor(
    private readonly scene: THREE.Scene,
    private readonly pipeline: RenderPipeline,
    private readonly orbital: OrbitalDirector,
    private readonly sky: Sky,
    private readonly terrain: Terrain,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly narration: NarrationDirector,
    private readonly overlay: HTMLElement,
    private readonly subtitleEl: HTMLElement,
    skipButton: HTMLButtonElement,
    private readonly getVolume: () => number,
  ) {
    skipButton.addEventListener('click', () => {
      this.finish(true);
    });
    window.addEventListener('keydown', (event) => {
      if (!this.session) {
        return;
      }
      if (event.code === 'Escape' || event.code === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        this.finish(true);
      }
    });
  }

  isPlaying(): boolean {
    return this.session !== null;
  }

  play(beats: CutsceneBeat[], locale: Locale, onComplete: () => void): void {
    if (beats.length === 0) {
      onComplete();
      return;
    }
    this.stopSession(false);
    this.session = {
      beats,
      index: 0,
      elapsed: 0,
      onComplete,
      locale,
      pulse: 0,
    };
    this.ensureWitness();
    this.applyBeat(0, locale);
    this.overlay.classList.remove('hidden');
    this.camera.position.copy(this.cinematicPos);
    this.camera.lookAt(this.lookAt);
    this.animationId = requestAnimationFrame(this.tick);
  }

  private ensureWitness(): void {
    if (this.witness) {
      return;
    }
    this.witness = buildHumanoidNpc(WITNESS_STYLE, 'upright');
    this.scene.add(this.witness);
    this.placeWitness();
  }

  private placeWitness(): void {
    if (!this.witness) {
      return;
    }
    const y = this.terrain.getHeightAt(this.stage.x, this.stage.z);
    this.witness.position.set(this.stage.x, y, this.stage.z);
    this.witness.rotation.y = Math.PI;
  }

  private applyBeat(index: number, locale: Locale): void {
    const beat = this.session?.beats[index];
    if (!beat || !this.witness) {
      return;
    }
    this.orbital.debugSetPhase(beat.phase);
    this.terrain.setEraVisuals(this.orbital.getEraKind(), beat.phase);
    this.subtitleEl.textContent = beat.subtitle;
    this.narration.speak(beat.subtitle, locale, this.getVolume(), 'witness');
  }

  private tick = (): void => {
    if (!this.session) {
      return;
    }

    const delta = Math.min(0.05, 1 / 60);
    this.session.pulse += delta;
    this.session.elapsed += delta;

    const beat = this.session.beats[this.session.index]!;
    this.orbital.update(delta, this.stage);
    this.sky.update();
    this.terrain.updateVisuals(delta);
    if (this.witness) {
      stepHumanoidIdle(this.witness, this.session.pulse);
    }
    this.pipeline.render(this.scene, this.camera);

    if (this.session.elapsed >= beat.duration) {
      this.session.index += 1;
      this.session.elapsed = 0;
      if (this.session.index >= this.session.beats.length) {
        this.finish(false);
        return;
      }
      this.applyBeat(this.session.index, this.session.locale);
    }

    this.animationId = requestAnimationFrame(this.tick);
  };

  private finish(skipped: boolean): void {
    if (!this.session) {
      return;
    }
    if (skipped) {
      this.narration.cancel();
    }
    const done = this.session.onComplete;
    this.stopSession(true);
    done();
  }

  private stopSession(cancelSpeech: boolean): void {
    if (cancelSpeech) {
      this.narration.cancel();
    }
    cancelAnimationFrame(this.animationId);
    this.session = null;
    this.overlay.classList.add('hidden');
    this.subtitleEl.textContent = '';
    if (this.witness) {
      this.scene.remove(this.witness);
      this.witness = null;
    }
  }
}
