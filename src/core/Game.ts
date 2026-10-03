import * as THREE from 'three';
import { AudioDirector } from '../audio/AudioDirector';
import { canReadLog } from '../narrative/logs';
import { LogDiscovery } from '../narrative/LogDiscovery';
import { LogMarkers } from '../narrative/LogMarkers';
import { MetaProgress } from '../narrative/MetaProgress';
import { CheckpointSave } from '../save/CheckpointSave';
import { OrbitalDirector } from '../orbital/OrbitalDirector';
import { FirstPersonController } from '../player/FirstPersonController';
import { ShelterZones } from '../survival/ShelterZones';
import { SurvivalSystem } from '../survival/SurvivalSystem';
import { EpilogueOverlay } from '../ui/EpilogueOverlay';
import { ForecastStrip } from '../ui/ForecastStrip';
import { RunJournal } from '../narrative/RunJournal';
import { Journal } from '../ui/Journal';
import { LogReader } from '../ui/LogReader';
import { PauseMenu } from '../ui/PauseMenu';
import { StableEraBanner } from '../ui/StableEraBanner';
import { Toast } from '../ui/Toast';
import { DialoguePanel } from '../ui/DialoguePanel';
import { horizontalBearing, HudCompass } from '../ui/HudCompass';
import type { DialogueChoice, DialogueNode, DialogueTree } from '../narrative/dialogueTypes';
import { ForecastMeta } from '../narrative/ForecastMeta';
import { GROVE_KEEPER_DIALOGUE } from '../narrative/groveKeeperDialogue';
import { GroveKeeperState } from '../narrative/GroveKeeperState';
import { PIT_REGISTRAR_DIALOGUE } from '../narrative/pitRegistrarDialogue';
import {
  buildPredictorCalibrationNode,
  PREDICTOR_DIALOGUE,
} from '../narrative/predictorDialogue';
import { buildDeathObjective } from '../narrative/deathObjective';
import { PitRegistrarState } from '../narrative/PitRegistrarState';
import { resolveInteractionPrompt } from '../ui/InteractionPrompt';
import { SettlementNpcs } from '../world/SettlementNpcs';
import { GROVE_KEEPER, LAST_PREDICTOR, PIT_REGISTRAR } from '../world/landmarks';
import { CaveShelter } from '../world/CaveShelter';
import { nearestLandmarkHint } from '../world/LandmarkHints';
import { LandmarkWayfinding } from '../world/LandmarkWayfinding';
import {
  resolveWayfindingTarget,
  wayfindingCoords,
} from '../world/WayfindingObjective';
import { Ruins } from '../world/Ruins';
import { Sky } from '../world/Sky';
import { StableEraParticles } from '../world/StableEraParticles';
import { Terrain } from '../world/Terrain';
import { WATER_REFILL_AMOUNT, WaterSource } from '../world/WaterSource';

interface HudElements {
  root: HTMLElement;
  era: HTMLElement;
  phase: HTMLElement;
  temperature: HTMLElement;
  forecast: HTMLElement;
  position: HTMLElement;
  health: HTMLElement;
  healthBar: HTMLElement;
  hydration: HTMLElement;
  hydrationBar: HTMLElement;
  status: HTMLElement;
  logs: HTMLElement;
  landmark: HTMLElement;
  lookHint: HTMLElement;
  interaction: HTMLElement;
  compactHint: HTMLElement;
}

interface OverlayElements {
  death: HTMLElement;
  deathMessage: HTMLElement;
  deathLogs: HTMLElement;
  deathObjective: HTMLElement;
  restartButton: HTMLButtonElement;
}

export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly clock = new THREE.Clock();
  private readonly terrain: Terrain;
  private readonly sky: Sky;
  private readonly fog: THREE.FogExp2;
  private readonly player: FirstPersonController;
  private readonly orbital: OrbitalDirector;
  private readonly shelterZones: ShelterZones;
  private readonly survival = new SurvivalSystem();
  private readonly logDiscovery = new LogDiscovery();
  private readonly runJournal = new RunJournal();
  private readonly meta = new MetaProgress();
  private readonly logMarkers: LogMarkers;
  private readonly ruins: Ruins;
  private readonly stableParticles: StableEraParticles;
  private readonly waterSource: WaterSource;
  private readonly wayfinding: LandmarkWayfinding;
  private readonly settlementNpcs: SettlementNpcs;
  private readonly pitRegistrarState = new PitRegistrarState();
  private readonly forecastMeta = new ForecastMeta();
  private readonly groveKeeperState = new GroveKeeperState();
  private activeDialogue: DialogueTree = PIT_REGISTRAR_DIALOGUE;
  private npcPulseTime = 0;
  private hudCompact = false;
  private readonly dialoguePanel: DialoguePanel;
  private readonly hudCompass: HudCompass;
  private readonly audio = new AudioDirector();
  private readonly stableBanner: StableEraBanner;
  private readonly logReader: LogReader;
  private readonly forecastStrip: ForecastStrip;
  private readonly epilogue: EpilogueOverlay;
  private readonly pauseMenu: PauseMenu;
  private readonly journal: Journal;
  private readonly gameToast: Toast;
  private readonly pauseToast: Toast;
  private readonly onQuitToMenu: () => void;
  private readonly onCheckpointMenuChange: () => void;
  private readonly syncMenuVolume: (volume: number) => void;
  private readonly hud: HudElements;
  private readonly overlays: OverlayElements;
  private readonly anchor = new THREE.Vector3();
  private animationId = 0;
  private running = false;
  private paused = false;
  private exposureTarget = 1.12;
  private statusOverride: string | null = null;
  private statusOverrideTimer = 0;
  private pendingEpilogue = false;

  constructor(
    canvas: HTMLCanvasElement,
    hud: HudElements,
    overlays: OverlayElements,
    logReader: LogReader,
    stableBanner: StableEraBanner,
    forecastStrip: ForecastStrip,
    epilogue: EpilogueOverlay,
    pauseMenu: PauseMenu,
    journal: Journal,
    dialoguePanel: DialoguePanel,
    hudCompass: HudCompass,
    gameToast: Toast,
    pauseToast: Toast,
    onQuitToMenu: () => void,
    onCheckpointMenuChange: () => void,
    syncMenuVolume: (volume: number) => void,
    masterVolumeSlider: HTMLInputElement,
  ) {
    this.hud = hud;
    this.overlays = overlays;
    this.logReader = logReader;
    this.stableBanner = stableBanner;
    this.forecastStrip = forecastStrip;
    this.epilogue = epilogue;
    this.pauseMenu = pauseMenu;
    this.journal = journal;
    this.dialoguePanel = dialoguePanel;
    this.hudCompass = hudCompass;
    this.gameToast = gameToast;
    this.pauseToast = pauseToast;
    this.onQuitToMenu = onQuitToMenu;
    this.onCheckpointMenuChange = onCheckpointMenuChange;
    this.syncMenuVolume = syncMenuVolume;

    const initialVolume = MetaProgress.loadMasterVolume();
    masterVolumeSlider.value = String(Math.round(initialVolume * 100));

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.scene.background = new THREE.Color('#120d0a');
    this.fog = new THREE.FogExp2('#3a2818', 0.002);
    this.scene.fog = this.fog;

    this.terrain = new Terrain();
    this.sky = new Sky();
    this.shelterZones = new ShelterZones(this.terrain);
    this.player = new FirstPersonController(
      canvas,
      this.terrain,
      this.shelterZones,
      window.innerWidth / window.innerHeight,
    );

    const hasFinalLog = () => this.meta.hasSeenFinalLog(this.logDiscovery);
    this.orbital = new OrbitalDirector(
      this.scene,
      this.sky,
      this.fog,
      () => ({
        chance: this.meta.getStableEraEnterChance(hasFinalLog()),
        force: this.meta.shouldForceStableEra(hasFinalLog()),
      }),
      () => this.meta.onChaoticPhaseEnded(),
      () => this.meta.onStableEntered(),
      () => this.forecastMeta.getConfidenceBonus(),
    );

    this.logMarkers = new LogMarkers(this.terrain, this.logDiscovery);
    this.ruins = new Ruins(this.terrain);
    this.stableParticles = new StableEraParticles(this.terrain);
    this.waterSource = new WaterSource(this.terrain);
    this.wayfinding = new LandmarkWayfinding(this.terrain);
    this.settlementNpcs = new SettlementNpcs(this.terrain);

    this.scene.add(this.sky.mesh);
    this.scene.add(this.terrain.mesh);
    this.scene.add(this.ruins.group);
    this.scene.add(this.logMarkers.group);
    this.scene.add(this.stableParticles.points);
    this.scene.add(this.waterSource.mesh);
    this.scene.add(this.wayfinding.group);
    this.scene.add(this.settlementNpcs.group);
    this.addLandmarks();
    this.scene.add(new CaveShelter(this.terrain, this.shelterZones).group);

    this.logReader.onOpen(() => {
      this.player.unlock();
    });

    this.logReader.onClose(() => {
      this.syncMovementState();
      if (this.pendingEpilogue) {
        this.pendingEpilogue = false;
        this.showEpilogue();
        return;
      }
      if (this.running && !this.paused && !this.journal.isOpen()) {
        this.player.tryLock();
      }
    });

    this.journal.onOpen(() => {
      this.player.unlock();
    });

    this.journal.onClose(() => {
      this.syncMovementState();
      if (this.running && !this.paused && !this.logReader.isOpen()) {
        this.player.tryLock();
      }
    });

    this.journal.onReadLog((log, gallery) => {
      this.journal.close();
      this.logReader.openFromJournal(log, gallery);
      this.syncMovementState();
    });

    this.dialoguePanel.onOpen(() => {
      this.player.unlock();
    });

    this.dialoguePanel.onClose(() => {
      this.syncMovementState();
      if (this.running && !this.paused && !this.logReader.isOpen() && !this.journal.isOpen()) {
        this.player.tryLock();
      }
    });

    this.dialoguePanel.onChoice((choice) => {
      this.handleDialogueChoice(choice);
    });

    canvas.addEventListener('click', () => {
      if (
        !this.running
        || this.paused
        || this.logReader.isOpen()
        || this.journal.isOpen()
        || this.dialoguePanel.isOpen()
        || this.pauseMenu.isOpen()
      ) {
        return;
      }
      if (!this.player.isLocked()) {
        this.player.tryLock();
      }
    });

    masterVolumeSlider.addEventListener('input', () => {
      const volume = Number(masterVolumeSlider.value) / 100;
      MetaProgress.saveMasterVolume(volume);
      this.audio.setMasterVolume(volume);
      this.syncMenuVolume(volume);
    });

    window.addEventListener('keydown', (event) => {
      if (!this.running || this.logReader.isOpen() || this.journal.isOpen() || this.dialoguePanel.isOpen()) {
        return;
      }
      if (event.code === 'Tab') {
        event.preventDefault();
        return;
      }
      if (event.code === 'Escape') {
        event.preventDefault();
        if (this.paused) {
          this.resume();
        } else {
          this.pause();
        }
      }
    });

    this.overlays.restartButton.addEventListener('click', () => {
      this.restart();
    });

    window.addEventListener('resize', this.onResize);
  }

  private addLandmarks(): void {
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: '#4a3428',
      roughness: 0.95,
      metalness: 0.02,
    });

    const placements = [
      { position: new THREE.Vector3(-18, 0, -8), scale: 2.4 },
      { position: new THREE.Vector3(24, 0, 12), scale: 3.1 },
      { position: new THREE.Vector3(-6, 0, 28), scale: 2.8 },
      { position: new THREE.Vector3(36, 0, -22), scale: 3.6 },
    ];

    for (const placement of placements) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(placement.scale, 0),
        rockMaterial,
      );
      rock.position.copy(placement.position);
      rock.position.y = this.terrain.getHeightAt(placement.position.x, placement.position.z) + placement.scale * 0.45;
      rock.castShadow = true;
      rock.receiveShadow = true;
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
      this.scene.add(rock);
    }

    const pitY = this.terrain.getHeightAt(-42, 18);
    const pit = new THREE.Mesh(
      new THREE.RingGeometry(8, 11, 48),
      new THREE.MeshStandardMaterial({
        color: '#2a1d16',
        roughness: 1,
        side: THREE.DoubleSide,
      }),
    );
    pit.rotation.x = -Math.PI / 2;
    pit.position.set(-42, pitY + 0.05, 18);
    this.scene.add(pit);

  }

  async startNewGame(): Promise<void> {
    if (this.running) {
      this.stop();
    }
    CheckpointSave.clear();
    this.survival.reset();
    this.meta.resetRun();
    this.orbital.reset();
    this.player.resetToSpawn();
    await this.beginSession(false);
  }

  async continueFromCheckpoint(): Promise<boolean> {
    const checkpoint = CheckpointSave.load();
    if (!checkpoint) {
      return false;
    }
    if (this.running) {
      this.stop();
    }
    this.applyCheckpoint(checkpoint);
    await this.beginSession(true);
    return true;
  }

  saveCheckpoint(label: string): boolean {
    if (!this.running || this.survival.status === 'dead') {
      return false;
    }

    const position = this.player.getPosition();
    CheckpointSave.save({
      version: 1,
      savedAt: Date.now(),
      label,
      player: { x: position.x, y: position.y, z: position.z },
      survival: this.survival.exportState(),
      orbital: this.orbital.getEraSnapshot(),
      meta: this.meta.exportRunState(),
    });
    this.runJournal.recordCheckpoint(label);
    this.setStatusOverride(`Checkpoint saved — ${label}`, 4);
    const toastMessage = `Checkpoint saved — ${label}`;
    if (this.paused) {
      this.pauseToast.show(toastMessage);
      this.pauseMenu.refreshCheckpointLine();
    } else {
      this.gameToast.show(toastMessage);
    }
    this.onCheckpointMenuChange();
    return true;
  }

  deleteCheckpoint(): void {
    CheckpointSave.clear();
    this.pauseMenu.refreshCheckpointLine();
    this.pauseToast.show('Checkpoint deleted.');
    this.onCheckpointMenuChange();
  }

  private applyCheckpoint(checkpoint: NonNullable<ReturnType<typeof CheckpointSave.load>>): void {
    this.player.setPosition(
      checkpoint.player.x,
      checkpoint.player.y,
      checkpoint.player.z,
    );
    this.survival.importState(checkpoint.survival);
    this.orbital.restoreEraSnapshot(checkpoint.orbital);
    this.meta.importRunState(checkpoint.meta);
    this.statusOverride = null;
    this.statusOverrideTimer = 0;
  }

  private async beginSession(fromCheckpoint = false): Promise<void> {
    const volume = MetaProgress.loadMasterVolume();
    await this.audio.start(volume);
    this.audio.setMasterVolume(volume);
    this.syncMenuVolume(volume);
    this.audio.resume();
    this.runJournal.clear();
    this.runJournal.recordCycleStart(fromCheckpoint);
    this.running = true;
    this.paused = false;
    this.pauseMenu.hide();
    this.journal.close();
    this.dialoguePanel.close();
    this.overlays.death.classList.add('hidden');
    this.epilogue.hide();
    this.player.lock();
    this.clock.start();
    this.animate();
  }

  stop(): void {
    this.running = false;
    this.paused = false;
    this.pauseMenu.hide();
    cancelAnimationFrame(this.animationId);
    this.audio.stop();
    this.player.unlock();
  }

  isRunning(): boolean {
    return this.running;
  }

  setMasterVolume(volume: number): void {
    this.audio.setMasterVolume(volume);
  }

  isPaused(): boolean {
    return this.paused;
  }

  isLogOpen(): boolean {
    return this.logReader.isOpen();
  }

  isJournalOpen(): boolean {
    return this.journal.isOpen();
  }

  toggleJournal(): void {
    if (!this.running || this.paused || this.logReader.isOpen() || this.dialoguePanel.isOpen()) {
      return;
    }
    this.journal.toggle(this.runJournal, this.logDiscovery);
    this.syncMovementState();
  }

  pause(): void {
    if (
      !this.running
      || this.paused
      || this.logReader.isOpen()
      || this.journal.isOpen()
      || this.dialoguePanel.isOpen()
    ) {
      return;
    }
    this.paused = true;
    this.pauseMenu.show();
    this.player.unlock();
  }

  resume(): void {
    if (!this.running || !this.paused) {
      return;
    }
    this.paused = false;
    this.pauseMenu.hide();
    this.player.tryLock();
  }

  quitToMenu(): void {
    this.stop();
    this.onQuitToMenu();
  }

  onPointerLockLost(): void {
    if (
      !this.running
      || this.paused
      || this.logReader.isOpen()
      || this.journal.isOpen()
      || this.dialoguePanel.isOpen()
      || this.pauseMenu.isOpen()
    ) {
      return;
    }
    this.pause();
  }

  private restart(): void {
    this.survival.reset();
    this.meta.resetRun();
    this.orbital.reset();
    this.player.resetToSpawn();
    this.logReader.close();
    this.dialoguePanel.close();
    this.pauseMenu.hide();
    this.paused = false;
    this.stableBanner.hide();
    this.epilogue.hide();
    this.overlays.death.classList.add('hidden');
    this.statusOverride = null;
    this.audio.resume();
    this.player.lock();
    this.running = true;
    this.clock.start();
    this.animate();
  }

  private showEpilogue(): void {
    this.running = false;
    this.audio.stop();
    this.player.unlock();
    this.epilogue.show();
  }

  beginAgainFromEpilogue(): void {
    this.epilogue.hide();
    this.restart();
  }

  private animate = (): void => {
    if (!this.running) {
      return;
    }

    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.npcPulseTime += delta;
    const stableEra = this.orbital.getEraKind() === 'stable';

    this.hud.lookHint.classList.toggle(
      'hidden',
      this.player.isLocked()
        || this.paused
        || this.logReader.isOpen()
        || this.journal.isOpen()
        || this.dialoguePanel.isOpen(),
    );

    if (
      !this.logReader.isOpen()
      && !this.journal.isOpen()
      && !this.dialoguePanel.isOpen()
      && !this.paused
      && this.player.consumePressedKey('KeyP')
    ) {
      this.pause();
    }

    if (
      !this.logReader.isOpen()
      && !this.dialoguePanel.isOpen()
      && !this.paused
      && this.player.consumePressedKey('KeyJ')
    ) {
      this.toggleJournal();
    }

    this.anchor.copy(this.player.getPosition());
    const nearbyLog = this.logMarkers.update(this.anchor, stableEra);
    const nearPit = this.shelterZones.isNearDehydrationPit(this.anchor);
    const nearWater = this.waterSource.isNear(this.anchor);

    if (this.paused || this.journal.isOpen() || this.dialoguePanel.isOpen()) {
      this.wayfinding.update(
        delta,
        this.orbital.getEraKind(),
        this.anchor,
        nearPit,
        this.waterSource.mesh.visible,
        this.forecastMeta.isCalibrated(),
      );
      this.settlementNpcs.update(this.orbital.getEraKind(), this.anchor, this.npcPulseTime);
      this.renderer.render(this.scene, this.player.camera);
      this.animationId = requestAnimationFrame(this.animate);
      return;
    }

    if (
      !this.logReader.isOpen()
      && !this.dialoguePanel.isOpen()
      && !this.journal.isOpen()
      && this.player.consumePressedKey('Tab')
    ) {
      this.toggleHudCompact();
    }

    if (!this.logReader.isOpen() && this.player.consumePressedKey('KeyT')) {
      this.tryTalkToNearbyNpc();
    }

    if (!this.logReader.isOpen() && this.player.consumePressedKey('KeyE')) {
      if (nearPit && !nearbyLog) {
        this.survival.toggleDehydration(nearPit);
      }
    }

    if (!this.logReader.isOpen() && this.player.consumePressedKey('KeyF')) {
      if (nearbyLog) {
        this.tryReadNearbyLog(stableEra);
      }
    }

    if (!this.logReader.isOpen() && this.player.consumePressedKey('KeyR') && nearWater) {
      this.survival.refillHydration(WATER_REFILL_AMOUNT);
      this.setStatusOverride('Condensate from the grove. Your body remembers water.', 4);
    }

    this.syncMovementState();

    if (this.survival.status !== 'dead' && !this.logReader.isOpen()) {
      this.player.update(delta);
    }

    this.sky.mesh.position.copy(this.anchor);
    this.orbital.update(delta, this.anchor);
    this.sky.update();
    this.handleEraTransitions();

    this.terrain.setEraVisuals(this.orbital.getEraKind(), this.orbital.getPhase());
    this.terrain.updateVisuals(delta);
    this.ruins.setStableEraActive(stableEra);
    this.waterSource.setStableEraActive(stableEra);
    this.stableParticles.setActive(stableEra, delta);
    this.stableBanner.update(delta);

    if (this.statusOverrideTimer > 0) {
      this.statusOverrideTimer -= delta;
      if (this.statusOverrideTimer <= 0) {
        this.statusOverride = null;
      }
    }

    this.exposureTarget = stableEra ? 1.28 : 1.12;
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(
      this.renderer.toneMappingExposure,
      this.exposureTarget,
      Math.min(delta * 2, 1),
    );

    if (this.survival.status !== 'dead' && !this.logReader.isOpen()) {
      const shelter = this.shelterZones.sample(this.anchor);
      this.survival.update(
        delta,
        this.orbital.getTemperature(),
        shelter,
        nearPit,
        this.player.isSprinting(),
        stableEra,
      );
    }

    this.audio.update(
      this.orbital.getEraKind(),
      this.orbital.getPhase(),
      this.orbital.getTemperature().value,
    );

    this.forecastStrip.render(this.orbital.getForecast());
    this.wayfinding.update(
      delta,
      this.orbital.getEraKind(),
      this.anchor,
      nearPit,
      this.waterSource.mesh.visible,
      this.forecastMeta.isCalibrated(),
    );
    this.settlementNpcs.update(this.orbital.getEraKind(), this.anchor, this.npcPulseTime);
    this.updateHud(nearbyLog, stableEra, nearPit, nearWater);

    if (this.survival.status === 'dead') {
      this.handleDeath();
      return;
    }

    this.renderer.render(this.scene, this.player.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };

  private setStatusOverride(message: string, seconds: number): void {
    this.statusOverride = message;
    this.statusOverrideTimer = seconds;
  }

  private handleEraTransitions(): void {
    const transition = this.orbital.consumeTransition();
    if (!transition) {
      return;
    }

    if (transition.enteredStable) {
      this.runJournal.recordEnteredStable();
      this.stableBanner.show();
      this.audio.playStableEraChime();
      this.saveCheckpoint('Stable Era (auto)');
    }

    if (transition.leftStable) {
      this.runJournal.recordLeftStable();
      this.stableBanner.hide();
      this.setStatusOverride('The golden sky darkens. Chaotic Eras return — find shelter.', 10);
    }
  }

  private tryTalkToNearbyNpc(): void {
    const pos = this.anchor;
    const stableEra = this.orbital.getEraKind() === 'stable';
    const options: { distance: number; talk: () => void }[] = [];

    if (this.wayfinding.isNearRegistrar(pos)) {
      const distance = Math.hypot(pos.x - PIT_REGISTRAR.x, pos.z - PIT_REGISTRAR.z);
      options.push({
        distance,
        talk: () => this.openDialogue(PIT_REGISTRAR_DIALOGUE, PIT_REGISTRAR_DIALOGUE.greet),
      });
    }

    if (this.settlementNpcs.isNearPredictor(pos)) {
      const distance = Math.hypot(pos.x - LAST_PREDICTOR.x, pos.z - LAST_PREDICTOR.z);
      options.push({
        distance,
        talk: () => {
          if (this.forecastMeta.isCalibrated()) {
            this.openDialogue(PREDICTOR_DIALOGUE, PREDICTOR_DIALOGUE.already_calibrated);
          } else {
            this.openDialogue(PREDICTOR_DIALOGUE, PREDICTOR_DIALOGUE.greet);
          }
        },
      });
    }

    if (stableEra && this.settlementNpcs.isNearGroveKeeper(pos)) {
      const distance = Math.hypot(pos.x - GROVE_KEEPER.x, pos.z - GROVE_KEEPER.z);
      options.push({
        distance,
        talk: () => this.openDialogue(GROVE_KEEPER_DIALOGUE, GROVE_KEEPER_DIALOGUE.greet),
      });
    }

    if (options.length === 0) {
      return;
    }

    options.sort((a, b) => a.distance - b.distance);
    options[0]!.talk();
    this.syncMovementState();
  }

  private openDialogue(tree: DialogueTree, node: DialogueNode): void {
    this.activeDialogue = tree;
    this.dialoguePanel.open(node);
  }

  private handleDialogueChoice(choice: DialogueChoice): void {
    if (choice.sideEffect === 'fold_lesson') {
      this.pitRegistrarState.markFoldLesson();
    }
    if (choice.sideEffect === 'mark_spoke') {
      this.pitRegistrarState.markSpoke();
    }
    if (choice.sideEffect === 'predictor_calibrated') {
      this.forecastMeta.calibrate();
      this.orbital.refreshForecastNow();
      this.runJournal.recordCounsel('Last Predictor aligned the forecast — confidence improved.');
      this.gameToast.show('Predictor calibrated — forecast confidence improved.');
    }
    if (choice.sideEffect === 'predictor_mark_spoke') {
      // reserved for future meta flags
    }
    if (choice.sideEffect === 'grove_mark_spoke') {
      this.groveKeeperState.markSpoke();
    }
    if (choice.sideEffect === 'grove_hint_logged') {
      this.groveKeeperState.markHopeHint();
      this.runJournal.recordCounsel('Grove Keeper shared counsel on water and the Final Log.');
    }

    if (choice.nextId === 'calibrate_dynamic') {
      const node = buildPredictorCalibrationNode(this.orbital.getPhase());
      this.activeDialogue = { ...PREDICTOR_DIALOGUE, calibrate: node };
      this.dialoguePanel.open(node);
      return;
    }

    const next = this.activeDialogue[choice.nextId];
    if (next) {
      this.dialoguePanel.open(next);
    }
  }

  private tryReadNearbyLog(stableEra: boolean): void {
    const nearbyLog = this.logMarkers.update(this.anchor, stableEra);
    if (!nearbyLog) {
      return;
    }

    if (!canReadLog(nearbyLog.log, this.orbital.getEraKind())) {
      this.setStatusOverride('This tablet is dormant. Wait for a Stable Era.', 5);
      return;
    }

    const isNew = this.logDiscovery.discover(nearbyLog.log.id);
    if (isNew) {
      this.audio.playLogDiscover();
      if (nearbyLog.log.id === 'final_log') {
        this.pendingEpilogue = true;
      }
    }
    this.logReader.open(nearbyLog.log);
    this.syncMovementState();
  }

  private syncMovementState(): void {
    const canMove = !this.logReader.isOpen()
      && !this.journal.isOpen()
      && !this.dialoguePanel.isOpen()
      && this.survival.status !== 'dehydrated'
      && this.survival.status !== 'dead';
    this.player.setMovementEnabled(canMove);
  }

  private handleDeath(): void {
    this.running = false;
    CheckpointSave.clear();
    this.audio.stop();
    this.player.unlock();
    this.overlays.deathMessage.textContent = this.survival.getDeathMessage();
    const total = this.logDiscovery.getAllLogs().length;
    const found = this.logDiscovery.getDiscoveredCount();
    this.overlays.deathLogs.textContent = `Civilization memory preserved: ${found} / ${total} logs remain known to you across cycles.`;
    this.overlays.deathObjective.textContent = buildDeathObjective({
      hasFinalLog: this.meta.hasSeenFinalLog(this.logDiscovery),
      forecastCalibrated: this.forecastMeta.isCalibrated(),
      logsFound: found,
      logsTotal: total,
    });
    this.overlays.death.classList.remove('hidden');
  }

  private toggleHudCompact(): void {
    this.hudCompact = !this.hudCompact;
    this.hud.root.classList.toggle('compact', this.hudCompact);
    this.hud.compactHint.textContent = this.hudCompact
      ? 'Tab — expand HUD'
      : 'Tab — compact HUD';
  }

  private updateHud(
    nearbyLog: ReturnType<LogMarkers['update']>,
    stableEra: boolean,
    nearPit: boolean,
    nearWater: boolean,
  ): void {
    const temperature = this.orbital.getTemperature();
    const position = this.player.getPosition();
    const shelter = this.shelterZones.sample(position);
    const snapshot = this.survival.getSnapshot(temperature, shelter, nearPit);

    this.hud.era.textContent = this.orbital.getEraLabel();
    this.hud.phase.textContent = this.orbital.getPhaseLabel();
    this.hud.temperature.textContent = `${temperature.label} (${snapshot.effectiveTemperature.toFixed(1)})`;
    this.hud.temperature.dataset.status = temperature.status;
    this.hud.forecast.textContent = this.orbital.getForecastSummary();
    this.hud.position.textContent = this.player.getPositionText();
    this.hud.logs.textContent = `${this.logDiscovery.getDiscoveredCount()} / ${this.logDiscovery.getAllLogs().length}`;

    const landmark = nearestLandmarkHint(position);
    this.hud.landmark.textContent = landmark ?? 'Open wasteland';

    this.hud.health.textContent = `${Math.ceil(snapshot.health)}`;
    this.hud.healthBar.style.width = `${snapshot.health}%`;
    this.hud.hydration.textContent = `${Math.ceil(snapshot.hydration)}`;
    this.hud.hydrationBar.style.width = `${snapshot.hydration}%`;

    let statusMessage = snapshot.statusMessage;
    if (this.statusOverride) {
      statusMessage = this.statusOverride;
    } else if (stableEra && nearWater) {
      statusMessage = 'Stable Era — press R at the grove pool to drink condensate.';
    } else if (stableEra) {
      statusMessage = 'Stable Era — the grove lives. Follow the green trail to the pool or final tablets.';
    } else if (this.settlementNpcs.isNearGroveKeeper(position) && stableEra) {
      statusMessage = 'Press T to speak with the Grove Keeper.';
    } else if (this.settlementNpcs.isNearPredictor(position)) {
      statusMessage = this.forecastMeta.isCalibrated()
        ? 'Press T to speak with the Last Predictor.'
        : 'Press T — the Last Predictor can calibrate your forecast.';
    } else if (this.wayfinding.isNearRegistrar(position)) {
      statusMessage = 'Press T to speak with the Registrar of the Pit.';
    } else if (this.journal.isOpen()) {
      statusMessage = 'Reviewing your cycle journal.';
    } else if (this.logReader.isOpen()) {
      statusMessage = 'Reading recovered text.';
    } else if (nearbyLog && nearPit) {
      statusMessage = `F — read ${nearbyLog.log.title.toLowerCase()}. E — dehydrate on the ring only (step away from the stone).`;
    } else if (nearbyLog) {
      statusMessage = nearbyLog.discovered
        ? `Press F to re-read ${nearbyLog.log.title.toLowerCase()}.`
        : `Press F to read ${nearbyLog.log.title.toLowerCase()}.`;
    } else if (!this.meta.hasSeenFinalLog(this.logDiscovery)) {
      statusMessage = `${statusMessage} A Stable Era will come — the sky cannot rage forever.`;
    } else if (this.logDiscovery.getDiscoveredCount() > 0) {
      statusMessage = `${statusMessage} Press J for your journal.`;
    }

    this.hud.status.textContent = statusMessage;

    const interaction = resolveInteractionPrompt({
      stableEra,
      nearbyLog,
      nearPit,
      nearWater,
      nearRegistrar: this.wayfinding.isNearRegistrar(position),
      nearPredictor: this.settlementNpcs.isNearPredictor(position),
      nearGroveKeeper: this.settlementNpcs.isNearGroveKeeper(position),
      uiBlocking: this.logReader.isOpen()
        || this.dialoguePanel.isOpen()
        || this.journal.isOpen()
        || this.paused,
    });
    if (interaction) {
      this.hud.interaction.textContent = interaction;
      this.hud.interaction.classList.remove('hidden');
    } else {
      this.hud.interaction.classList.add('hidden');
    }

    this.hud.healthBar.parentElement?.classList.toggle('critical', snapshot.health < 30);
    this.hud.hydrationBar.parentElement?.classList.toggle('critical', snapshot.hydration < 25);
    document.body.dataset.survival = snapshot.status;
    document.body.dataset.era = stableEra ? 'stable' : 'chaotic';
    this.hud.era.parentElement?.classList.toggle('stable-era', stableEra);

    const wayTarget = resolveWayfindingTarget({
      era: this.orbital.getEraKind(),
      hydration: snapshot.hydration,
      temperature,
      nearGroveWater: nearWater,
      hasFinalLog: this.meta.hasSeenFinalLog(this.logDiscovery),
      forecastCalibrated: this.forecastMeta.isCalibrated(),
      playerX: position.x,
      playerZ: position.z,
    });
    if (wayTarget) {
      const coords = wayfindingCoords(wayTarget);
      const bearing = horizontalBearing(position.x, position.z, coords.x, coords.z);
      this.hudCompass.update(wayTarget, this.player.getHorizontalYaw(), bearing);
    } else {
      this.hudCompass.update(null, 0, null);
    }
  }

  private onResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.player.resize(width / height);
  };

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.audio.dispose();
    this.stableParticles.dispose();
    this.orbital.dispose();
    this.terrain.dispose();
    this.sky.dispose();
    this.wayfinding.dispose();
    this.settlementNpcs.dispose();
    this.renderer.dispose();
  }
}
