import * as THREE from 'three';
import type { NarrationDirector } from '../audio/NarrationDirector';
import type { Locale } from '../i18n/locale';
import { orbitDiagramCaption, witnessSpeakerLabel } from '../i18n/uiStrings';
import type { OrbitalDirector } from '../orbital/OrbitalDirector';
import type { RenderPipeline } from '../render/RenderPipeline';
import type { Sky } from '../world/Sky';
import type { Terrain } from '../world/Terrain';
import {
  applyHumanoidPosture,
  buildHumanoidNpc,
  stepHumanoidIdle,
  type HumanoidNpcStyle,
} from '../world/HumanoidNpc';
import {
  phaseForBeatProgress,
  type CutsceneBeat,
  type CutsceneCameraMode,
} from './sceneContent';
import { TrisolarisOrbitVisual } from './TrisolarisOrbitVisual';

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
  speechDone: boolean;
  speechFallbackTimer: number;
}

export class CutsceneController {
  private session: ActiveCutscene | null = null;
  private witness: THREE.Group | null = null;
  private orbitVisual: TrisolarisOrbitVisual | null = null;
  private animationId = 0;
  private readonly stage = new THREE.Vector3(0, 0, 14);
  private readonly cameraWitness = {
    position: new THREE.Vector3(0, 11.8, 20),
    lookAt: new THREE.Vector3(0, 10.8, 14),
  };
  private readonly cameraSky = {
    position: new THREE.Vector3(-4, 13.5, 17),
    lookAt: new THREE.Vector3(0, 28, 22),
  };
  private readonly cameraOrbit = {
    position: new THREE.Vector3(5.5, 19, 8),
    lookAt: new THREE.Vector3(0, 24, 14),
  };
  private readonly cameraPos = new THREE.Vector3();
  private readonly cameraTarget = new THREE.Vector3();
  private readonly orbitFocus = new THREE.Vector3();
  private readonly cameraGoal = {
    position: new THREE.Vector3(),
    lookAt: new THREE.Vector3(),
  };

  constructor(
    private readonly scene: THREE.Scene,
    private readonly pipeline: RenderPipeline,
    private readonly orbital: OrbitalDirector,
    private readonly sky: Sky,
    private readonly terrain: Terrain,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly narration: NarrationDirector,
    private readonly overlay: HTMLElement,
    private readonly speakerEl: HTMLElement,
    private readonly orbitCaptionEl: HTMLElement,
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
    this.narration.warmUp();
    this.session = {
      beats,
      index: 0,
      elapsed: 0,
      onComplete,
      locale,
      pulse: 0,
      speechDone: false,
      speechFallbackTimer: 0,
    };
    this.ensureWitness();
    this.ensureOrbitVisual();
    this.setCameraGoal(beats[0]?.camera ?? 'witness', true);
    this.cameraPos.copy(this.cameraGoal.position);
    this.cameraTarget.copy(this.cameraGoal.lookAt);
    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.cameraTarget);
    this.applyBeat(0, locale);
    this.overlay.classList.remove('hidden');
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

  private ensureOrbitVisual(): void {
    if (this.orbitVisual) {
      return;
    }
    this.orbitVisual = new TrisolarisOrbitVisual();
    this.scene.add(this.orbitVisual.group);
  }

  private placeWitness(): void {
    if (!this.witness) {
      return;
    }
    const y = this.terrain.getHeightAt(this.stage.x, this.stage.z);
    this.witness.position.set(this.stage.x, y, this.stage.z);
    this.witness.rotation.y = Math.PI;
  }

  private syncOrbitCaption(beat: CutsceneBeat, locale: Locale): void {
    const show = beat.camera === 'orbit' || beat.camera === 'sky';
    if (show) {
      this.orbitCaptionEl.textContent = orbitDiagramCaption(locale);
      this.orbitCaptionEl.classList.remove('hidden');
    } else {
      this.orbitCaptionEl.textContent = '';
      this.orbitCaptionEl.classList.add('hidden');
    }
  }

  private setCameraGoal(mode: CutsceneCameraMode, instant = false): void {
    const preset = mode === 'orbit'
      ? this.cameraOrbit
      : mode === 'sky'
        ? this.cameraSky
        : this.cameraWitness;
    this.cameraGoal.position.copy(preset.position);
    this.cameraGoal.lookAt.copy(preset.lookAt);
    if (instant) {
      this.cameraPos.copy(this.cameraGoal.position);
      this.cameraTarget.copy(this.cameraGoal.lookAt);
    }
  }

  private applyBeat(index: number, locale: Locale): void {
    const beat = this.session?.beats[index];
    if (!beat || !this.witness) {
      return;
    }
    applyHumanoidPosture(this.witness, beat.posture);
    if (beat.camera) {
      this.setCameraGoal(beat.camera);
    }
    this.syncOrbitCaption(beat, locale);
    this.speakerEl.textContent = witnessSpeakerLabel(locale);
    this.subtitleEl.textContent = beat.subtitle;
    this.session!.speechDone = !this.narration.isEnabled();
    const phase = phaseForBeatProgress(beat, 0);
    this.orbital.debugSetPhase(phase);
    this.terrain.setEraVisuals(this.orbital.getEraKind(), phase);

    if (this.orbitVisual) {
      const mode = beat.orbitMode ?? 'chaos';
      if (mode === 'blend') {
        this.orbitVisual.setMode('blend', 0);
      } else {
        this.orbitVisual.setMode(mode);
      }
    }

    window.clearTimeout(this.session!.speechFallbackTimer);
    this.session!.speechFallbackTimer = window.setTimeout(() => {
      if (this.session && this.session.index === index) {
        this.session.speechDone = true;
      }
    }, beat.duration * 1000 + 5000);

    if (this.narration.isEnabled()) {
      this.narration.speak(
        beat.subtitle,
        locale,
        this.getVolume(),
        'witness',
        () => {
          if (this.session) {
            this.session.speechDone = true;
          }
        },
      );
    }
  }

  private tick = (): void => {
    if (!this.session) {
      return;
    }

    const delta = Math.min(0.05, 1 / 60);
    this.session.pulse += delta;
    this.session.elapsed += delta;

    const beat = this.session.beats[this.session.index]!;
    const phase = phaseForBeatProgress(beat, this.session.elapsed);
    this.orbital.debugSetPhase(phase);
    this.terrain.setEraVisuals(this.orbital.getEraKind(), phase);

    if (this.orbitVisual) {
      const mode = beat.orbitMode ?? 'chaos';
      if (mode === 'blend') {
        const t = Math.min(1, this.session.elapsed / beat.duration);
        this.orbitVisual.setMode('blend', t);
      } else {
        this.orbitVisual.setMode(mode);
      }
      this.orbitVisual.update(delta);
    }

    const camLerp = 1 - Math.exp(-delta * 2.2);
    if ((beat.camera === 'orbit' || beat.camera === 'sky') && this.orbitVisual) {
      const preset = beat.camera === 'orbit' ? this.cameraOrbit : this.cameraSky;
      this.cameraGoal.lookAt.copy(preset.lookAt);
      this.orbitVisual.getFocusOffset(this.orbitFocus);
      this.orbitVisual.group.localToWorld(this.orbitFocus);
      this.cameraGoal.lookAt.lerp(this.orbitFocus, 0.42);
    }
    this.cameraPos.lerp(this.cameraGoal.position, camLerp);
    this.cameraTarget.lerp(this.cameraGoal.lookAt, camLerp);
    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.cameraTarget);

    this.orbital.update(delta, this.stage);
    this.sky.update();
    this.terrain.updateVisuals(delta);
    if (this.witness) {
      stepHumanoidIdle(this.witness, this.session.pulse);
      if (beat.camera === 'witness') {
        this.witness.rotation.y = THREE.MathUtils.lerp(this.witness.rotation.y, 0, camLerp);
      } else {
        this.witness.rotation.y = THREE.MathUtils.lerp(this.witness.rotation.y, Math.PI, camLerp);
      }
    }
    this.pipeline.render(this.scene, this.camera);

    const beatReady = this.session.elapsed >= beat.duration && this.session.speechDone;
    if (beatReady) {
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
    if (this.session) {
      window.clearTimeout(this.session.speechFallbackTimer);
    }
    cancelAnimationFrame(this.animationId);
    this.session = null;
    this.overlay.classList.add('hidden');
    this.speakerEl.textContent = '';
    this.orbitCaptionEl.textContent = '';
    this.orbitCaptionEl.classList.add('hidden');
    this.subtitleEl.textContent = '';
    if (this.witness) {
      this.scene.remove(this.witness);
      this.witness = null;
    }
    if (this.orbitVisual) {
      this.scene.remove(this.orbitVisual.group);
      this.orbitVisual.dispose();
      this.orbitVisual = null;
    }
  }
}
