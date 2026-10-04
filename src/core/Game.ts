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
import { WorldColliders } from '../world/worldColliders';
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
import { GroveKeeperState } from '../narrative/GroveKeeperState';
import { PIT_REGISTRAR_DIALOGUE } from '../narrative/pitRegistrarDialogue';
import {
  buildPredictorCalibrationNode,
  PREDICTOR_DIALOGUE,
} from '../narrative/predictorDialogue';
import { NarrationDirector } from '../audio/NarrationDirector';
import { voiceRoleForNpc } from '../audio/voiceProfiles';
import { STABLE_ERA_NARRATION } from '../i18n/introContent';
import {
  formatDeathLogsLine,
  formatWorldAgeCounsel,
  getDeathMessageCopy,
} from '../i18n/deathMessages';
import { loadMusicEnabled, loadNarrationEnabled, type Locale } from '../i18n/locale';
import { buildDeathObjective } from '../narrative/deathObjective';
import { StoryBeatState } from '../narrative/StoryBeatState';
import { StoryDirector } from '../narrative/StoryDirector';
import type { StoryBeatId } from '../narrative/storyContent';
import { StoryOverlay } from '../ui/StoryOverlay';
import { CivilizationCounter } from '../narrative/CivilizationCounter';
import { CivilizationLegacy } from '../narrative/CivilizationLegacy';
import { resolveRenderQuality, type RenderQuality } from '../platform/renderQuality';
import { RenderPipeline } from '../render/RenderPipeline';
import { getStageCopy } from '../narrative/civilizationStages';
import { CivilizationProps } from '../world/CivilizationProps';
import { NpcPresence } from '../world/NpcPresence';
import { CounselChoices } from '../narrative/CounselChoices';
import { buildEpilogueBody } from '../narrative/epilogueContent';
import {
  buildGroveDialogue,
  buildPredictorDialogue,
  buildRegistrarDialogue,
  type NpcDialogueContext,
} from '../narrative/npcDialogue';
import {
  omenForLethalTemperature,
  omenForPhaseEnter,
  shouldWarnLethal,
} from '../narrative/skyOmens';
import type { DeviceProfile } from '../platform/deviceProfile';
import type { EraPhase } from '../orbital/types';
import { MobileControls } from '../ui/MobileControls';
import type { MobileChromeElements } from '../ui/mobileChrome';
import { PitRegistrarState } from '../narrative/PitRegistrarState';
import { resolveInteractionPrompt, resolveNearbyActionStatus } from '../ui/InteractionPrompt';
import type { InputMode, InteractionContext } from '../ui/InteractionPrompt';
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
import { getLandmarkMaterials, type LandmarkMaterials } from '../world/landmarkMaterials';
import { GeometryBatch, boulderGeometry, seededRandom } from '../world/meshKit';
import { Sky } from '../world/Sky';
import { StableEraParticles } from '../world/StableEraParticles';
import { GroveGrass } from '../world/GroveGrass';
import { StableScatterTrees } from '../world/StableScatterTrees';
import { StablePitHerds } from '../world/StablePitHerds';
import { StableWildlife } from '../world/StableWildlife';
import { TriSolarLevitation } from '../world/TriSolarLevitation';
import { ColdBreath } from '../world/ColdBreath';
import { Terrain } from '../world/Terrain';
import { WATER_REFILL_AMOUNT, WaterSource } from '../world/WaterSource';
import {
  getLogActionHint,
  getQuestObjectiveLine,
  type QuestProgressInput,
} from '../narrative/questContent';
import { MobileHudSheet } from '../ui/MobileHudSheet';
import type { MobileHudBundle } from '../ui/mobileHudBundle';
import { SoundUnlockBanner } from '../ui/SoundUnlockBanner';
import { CutsceneController } from '../cinematic/CutsceneController';
import {
  deathCutsceneBeats,
  openingCutsceneBeats,
  victoryCutsceneBeats,
} from '../cinematic/sceneContent';

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
  chapter: HTMLElement;
  omen: HTMLElement;
}

interface OverlayElements {
  death: HTMLElement;
  deathMessage: HTMLElement;
  deathLogs: HTMLElement;
  deathObjective: HTMLElement;
  deathCycle: HTMLElement;
  restartButton: HTMLButtonElement;
}

export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly renderQuality: RenderQuality;
  private readonly pipeline: RenderPipeline;
  private readonly scene = new THREE.Scene();
  private readonly clock = new THREE.Clock();
  private readonly terrain: Terrain;
  private readonly sky: Sky;
  private readonly fog: THREE.FogExp2;
  private readonly player: FirstPersonController;
  private readonly orbital: OrbitalDirector;
  private readonly shelterZones: ShelterZones;
  private readonly worldColliders: WorldColliders;
  private readonly survival = new SurvivalSystem();
  private readonly logDiscovery = new LogDiscovery();
  private readonly runJournal = new RunJournal();
  private readonly meta = new MetaProgress();
  private readonly logMarkers: LogMarkers;
  private readonly ruins: Ruins;
  private readonly landmarkMats: LandmarkMaterials;
  private readonly stableParticles: StableEraParticles;
  private readonly groveGrass: GroveGrass;
  private readonly stableScatterTrees: StableScatterTrees;
  private readonly stableWildlife: StableWildlife;
  private readonly stablePitHerds: StablePitHerds;
  private readonly triSolarLevitation: TriSolarLevitation;
  private readonly coldBreath: ColdBreath | null;
  private readonly waterSource: WaterSource;
  private readonly wayfinding: LandmarkWayfinding;
  private readonly settlementNpcs: SettlementNpcs;
  private readonly pitRegistrarState = new PitRegistrarState();
  private readonly forecastMeta = new ForecastMeta();
  private readonly groveKeeperState = new GroveKeeperState();
  private readonly counselChoices = new CounselChoices();
  private readonly civilizationCounter = new CivilizationCounter();
  private readonly civilizationLegacy = new CivilizationLegacy();
  private civilizationProps: CivilizationProps;
  private readonly npcPresence: NpcPresence;
  private civilizationCycle = 187;
  private omenTimer = 0;
  private lethalWarnedPhase: EraPhase | null = null;
  private activeDialogue: DialogueTree = PIT_REGISTRAR_DIALOGUE;
  private activeDialogueNpc: 'registrar' | 'predictor' | 'grove' | null = null;
  private npcPulseTime = 0;
  private hudCompact = false;
  private stableNarrationPlayed = false;
  private cinematicBedActive = false;
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
  private readonly storyBeatState = new StoryBeatState();
  private readonly storyDirector: StoryDirector;
  private lastSurvivalStatus: 'active' | 'dehydrated' | 'dead' = 'active';
  private readonly deviceProfile: DeviceProfile;
  private readonly mobileControls: MobileControls | null;
  private readonly mobileHud: MobileHudBundle | null;
  private readonly mobileHudSheet: MobileHudSheet | null;
  private readonly soundBanner: SoundUnlockBanner | null;
  private readonly cutscene: CutsceneController;
  private mobileUi = {
    hasNearbyLog: false,
    nearPit: false,
    nearWater: false,
    nearNpc: false,
    stableEra: false,
  };

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
    private readonly getLocale: () => Locale,
    private readonly narration: NarrationDirector,
    private readonly storyOverlay: StoryOverlay,
    deviceProfile: DeviceProfile,
    mobileChrome: MobileChromeElements | null,
    mobileHud: MobileHudBundle | null,
    soundBannerRoot: HTMLElement | null,
    soundBannerButton: HTMLButtonElement | null,
  ) {
    this.deviceProfile = deviceProfile;
    this.mobileControls = null;
    this.mobileHud = mobileHud;
    this.soundBanner = soundBannerRoot && soundBannerButton
      ? new SoundUnlockBanner(soundBannerRoot, soundBannerButton, () => {
        this.narration.unlockFromUserGesture();
        void this.unlockAudioFromGesture();
      })
      : null;
    this.mobileHudSheet = mobileHud
      ? new MobileHudSheet(
        mobileHud.sheet,
        mobileHud.sheetBackdrop,
        [mobileHud.sheetClose, mobileHud.sheetCloseTop],
        [
          mobileHud.skyButton,
          ...(mobileHud.statsButton ? [mobileHud.statsButton] : []),
        ],
        {
          onOpen: () => this.mobileControls?.setSkySheetOpen(true),
          onClose: () => this.mobileControls?.setSkySheetOpen(false),
          getLocale: () => this.getLocale(),
        },
      )
      : null;
    this.storyDirector = new StoryDirector(
      this.storyBeatState,
      getLocale,
      () => this.civilizationCycle,
    );
    this.storyDirector.setJournalRecorder((id) => {
      const beat = this.storyDirector.getBeatCopy(id);
      if (beat) {
        this.runJournal.recordCounsel(`Prior sage — ${beat.journalTitle}`);
      }
    });

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
    this.narration.setEnabled(loadNarrationEnabled());

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderQuality = resolveRenderQuality(deviceProfile);
    document.body.dataset.renderTier = this.renderQuality.tier;
    document.body.dataset.ssao = this.renderQuality.ssao ? 'on' : 'off';
    this.audio.configure({ musicArpeggio: this.renderQuality.musicArpeggio });
    this.audio.setMusicEnabled(loadMusicEnabled());
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.renderQuality.pixelRatioCap));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.scene.background = new THREE.Color('#120d0a');
    this.fog = new THREE.FogExp2('#3a2818', 0.002);
    this.scene.fog = this.fog;

    this.terrain = new Terrain({
      segments: this.renderQuality.terrainSegments,
      textureSize: this.renderQuality.textureSize,
      anisotropy: Math.min(
        this.renderQuality.anisotropy,
        this.renderer.capabilities.getMaxAnisotropy(),
      ),
    });
    this.sky = new Sky();
    this.shelterZones = new ShelterZones(this.terrain);
    this.worldColliders = new WorldColliders(this.terrain, this.shelterZones);
    this.player = new FirstPersonController(
      canvas,
      this.terrain,
      this.shelterZones,
      this.worldColliders,
      window.innerWidth / window.innerHeight,
    );
    if (deviceProfile.prefersTouchControls) {
      this.player.enableTouchMode();
    }

    if (mobileChrome && deviceProfile.prefersTouchControls) {
      this.mobileControls = new MobileControls(
        mobileChrome.root,
        mobileChrome.lookZone,
        mobileChrome.stickBase,
        mobileChrome.stickKnob,
        mobileChrome.interactButton,
        mobileChrome.useButton,
        mobileChrome.journalButton,
        mobileChrome.pauseButton,
        mobileChrome.sprintButton,
        mobileChrome.lookHint,
        this.player,
        {
          isGameplayActive: () => this.isMobileGameplayActive(),
          onInteract: () => this.mobileInteract(),
          onUse: () => this.mobileUse(),
          onJournal: () => this.toggleJournal(),
          onPause: () => {
            if (this.isPaused()) {
              this.resume();
            } else {
              this.pause();
            }
          },
          getInteractLabel: () => this.getMobileInteractLabel(),
          getUseLabel: () => this.getMobileUseLabel(),
        },
      );
    }

    const hasFinalLog = () => this.meta.hasSeenFinalLog(this.logDiscovery);
    this.orbital = new OrbitalDirector(
      this.scene,
      this.sky,
      this.fog,
      () => ({
        chance: this.meta.getStableEraEnterChance(
          hasFinalLog(),
          this.counselChoices.getStableChanceBonus(),
        ),
        force: this.meta.shouldForceStableEra(
          hasFinalLog(),
          this.counselChoices.getForceStableThresholdOffset(),
        ),
      }),
      () => this.meta.onChaoticPhaseEnded(),
      () => this.meta.onStableEntered(),
      () => this.forecastMeta.getConfidenceBonus(),
      { renderer: this.renderer, quality: this.renderQuality },
    );
    this.pipeline = new RenderPipeline(
      this.renderer,
      this.scene,
      this.player.camera,
      this.renderQuality,
    );

    this.logMarkers = new LogMarkers(this.terrain, this.logDiscovery);
    this.landmarkMats = getLandmarkMaterials(
      Math.max(256, this.renderQuality.textureSize / 2),
      Math.min(this.renderQuality.anisotropy, this.renderer.capabilities.getMaxAnisotropy()),
    );
    this.ruins = new Ruins(this.terrain, this.landmarkMats);
    this.stableParticles = new StableEraParticles(this.terrain);
    this.groveGrass = new GroveGrass(this.terrain, this.renderQuality.grassBlades);
    this.stableScatterTrees = new StableScatterTrees(this.terrain, this.renderQuality.stableScatterTrees);
    this.stableWildlife = new StableWildlife(
      this.terrain,
      this.renderQuality.wildlifeCritters,
      this.renderQuality.wildlifeBirds,
    );
    this.stablePitHerds = new StablePitHerds(
      this.terrain,
      this.renderQuality.pitHerds,
      this.renderQuality.pitHerdMembers,
    );
    this.triSolarLevitation = new TriSolarLevitation(this.terrain, this.renderQuality.triSolarDebris);
    this.coldBreath = this.renderQuality.breath ? new ColdBreath() : null;
    this.waterSource = new WaterSource();
    this.wayfinding = new LandmarkWayfinding(this.terrain);
    this.settlementNpcs = new SettlementNpcs(this.terrain);
    this.civilizationProps = new CivilizationProps(this.terrain, this.civilizationLegacy.getStage(), this.landmarkMats);
    this.npcPresence = new NpcPresence(this.terrain);

    this.scene.add(this.sky.mesh);
    this.scene.add(this.terrain.mesh);
    this.scene.add(this.ruins.group);
    this.scene.add(this.logMarkers.group);
    this.scene.add(this.stableParticles.points);
    this.scene.add(this.groveGrass.mesh);
    this.scene.add(this.stableScatterTrees.group);
    this.scene.add(this.stableWildlife.group);
    this.scene.add(this.stablePitHerds.group);
    this.scene.add(this.triSolarLevitation.group);
    if (this.coldBreath) {
      this.scene.add(this.coldBreath.points);
    }
    this.scene.add(this.waterSource.mesh);
    this.scene.add(this.wayfinding.group);
    this.scene.add(this.settlementNpcs.group);
    this.scene.add(this.civilizationProps.group);
    this.scene.add(this.npcPresence.group);
    this.addLandmarks();
    this.scene.add(new CaveShelter(this.terrain, this.shelterZones, this.landmarkMats).group);

    const cutsceneOverlay = document.querySelector<HTMLElement>('#cutscene-overlay');
    const cutsceneSpeaker = document.querySelector<HTMLElement>('#cutscene-speaker');
    const cutsceneOrbitCaption = document.querySelector<HTMLElement>('#cutscene-orbit-caption');
    const cutsceneSubtitle = document.querySelector<HTMLElement>('#cutscene-subtitle');
    const cutsceneSkip = document.querySelector<HTMLButtonElement>('#cutscene-skip');
    if (!cutsceneOverlay || !cutsceneSpeaker || !cutsceneOrbitCaption || !cutsceneSubtitle || !cutsceneSkip) {
      throw new Error('Missing cutscene overlay elements.');
    }
    this.cutscene = new CutsceneController(
      this.scene,
      this.pipeline,
      this.orbital,
      this.sky,
      this.terrain,
      this.player.camera,
      this.narration,
      cutsceneOverlay,
      cutsceneSpeaker,
      cutsceneOrbitCaption,
      cutsceneSubtitle,
      cutsceneSkip,
      () => MetaProgress.loadMasterVolume(),
    );

    this.logReader.onOpen(() => {
      this.player.unlock();
      this.syncMusicDuck();
    });

    this.logReader.onClose(() => {
      this.syncMusicDuck();
      this.syncMovementState();
      const afterStory = () => {
        if (this.pendingEpilogue) {
          this.pendingEpilogue = false;
          this.showEpilogue();
          return;
        }
        if (this.running && !this.paused && !this.journal.isOpen() && !this.storyOverlay.isOpen()) {
          this.player.tryLock();
        }
      };
      if (this.tryPresentPendingStoryBeat(afterStory)) {
        return;
      }
      afterStory();
    });

    this.journal.onOpen(() => {
      this.player.unlock();
      this.syncMusicDuck();
    });

    this.journal.onClose(() => {
      this.syncMusicDuck();
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

    this.journal.onReadLetter((id) => {
      this.openStoryLetter(id, () => {
        if (this.running && !this.paused) {
          this.journal.toggle(
            this.runJournal,
            this.logDiscovery,
            this.storyDirector.getUnlockedForJournal(),
            this.getLocale(),
            this.buildQuestProgress(),
          );
        }
      });
    });

    this.dialoguePanel.onOpen(() => {
      this.player.unlock();
      this.syncMusicDuck();
    });

    this.dialoguePanel.onClose(() => {
      this.syncMusicDuck();
      this.syncMovementState();
      if (this.running && !this.paused && !this.logReader.isOpen() && !this.journal.isOpen()) {
        this.player.tryLock();
      }
    });

    this.dialoguePanel.onChoice((choice) => {
      this.handleDialogueChoice(choice);
    });

    canvas.addEventListener('click', () => {
      if (this.deviceProfile.prefersTouchControls) {
        return;
      }
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
      void this.prepareMenuAudio();
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
    if (new URLSearchParams(window.location.search).has('debug')) {
      (window as unknown as { __3body?: unknown }).__3body = {
        setPhase: (phase: EraPhase) => this.orbital.debugSetPhase(phase),
        teleport: (x: number, z: number, yaw: number, pitch = 0) => {
          this.player.setPosition(x, this.terrain.getHeightAt(x, z) + 1.7, z);
          this.player.setFacing(yaw, pitch);
        },
        position: () => this.player.getPosition().toArray(),
        groundHeight: () => this.terrain.getHeightAt(this.player.getPosition().x, this.player.getPosition().z),
        quality: this.renderQuality,
      };
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.running) {
        void this.audio.unlockFromGesture(MetaProgress.loadMasterVolume());
        this.syncSoundBanner();
      }
    });
  }

  async unlockAudioFromGesture(): Promise<void> {
    await this.audio.unlockFromGesture(MetaProgress.loadMasterVolume());
    this.syncSoundBanner();
  }

  private syncSoundBanner(): void {
    if (!this.soundBanner) {
      return;
    }
    if (!this.running || this.paused) {
      this.soundBanner.hide();
      return;
    }
    if (this.audio.isContextRunning()) {
      this.soundBanner.hide();
    } else {
      this.soundBanner.show(this.getLocale());
    }
  }

  private buildQuestProgress(): QuestProgressInput {
    return {
      hasWaystone: this.logDiscovery.isDiscovered('waystone'),
      predictorCalibrated: this.forecastMeta.isCalibrated(),
      enteredStableThisRun: this.meta.hasEnteredStableThisRun(),
      hasGroveHope: this.logDiscovery.isDiscovered('grove_hope'),
      hasFinalLog: this.logDiscovery.isDiscovered('final_log'),
    };
  }

  private addLandmarks(): void {
    // Shelter boulders: positions are shared with ShelterZones (rock shadow / boulder lee).
    const placements = [
      { x: -18, z: -8, scale: 2.4 },
      { x: 24, z: 12, scale: 3.1 },
      { x: -6, z: 28, scale: 2.8 },
      { x: 36, z: -22, scale: 3.6 },
    ];
    const batch = new GeometryBatch();
    placements.forEach((placement, index) => {
      const rnd = seededRandom(800 + index);
      const y = this.terrain.getHeightAt(placement.x, placement.z) + placement.scale * 0.3;
      batch.add(boulderGeometry(placement.scale, 800 + index, 3), this.landmarkMats.stone, {
        position: [placement.x, y, placement.z],
        rotation: [(rnd() - 0.5) * 0.3, rnd() * Math.PI, (rnd() - 0.5) * 0.3],
      });
      for (let i = 0; i < 4; i += 1) {
        const a = rnd() * Math.PI * 2;
        const r = placement.scale * (1.1 + rnd() * 0.6);
        const size = placement.scale * (0.12 + rnd() * 0.18);
        const px = placement.x + Math.cos(a) * r;
        const pz = placement.z + Math.sin(a) * r;
        batch.add(boulderGeometry(size, 820 + index * 7 + i, 1), this.landmarkMats.stone, {
          position: [px, this.terrain.getHeightAt(px, pz) + size * 0.4, pz],
          rotation: [0, rnd() * Math.PI, 0],
        });
      }
    });
    this.scene.add(batch.build());
  }

  async ensureAudio(): Promise<void> {
    await this.unlockAudioFromGesture();
  }

  setCinematicBed(active: boolean): void {
    this.cinematicBedActive = active;
    this.audio.setCinematicBed(active);
    this.syncMusicDuck();
  }

  setMusicEnabled(enabled: boolean): void {
    this.audio.setMusicEnabled(enabled);
  }

  async prepareMenuAudio(): Promise<void> {
    const volume = MetaProgress.loadMasterVolume();
    await this.audio.start(volume);
    this.audio.setMusicEnabled(loadMusicEnabled());
    this.audio.setMenuMusicActive(true);
    this.audio.setMasterVolume(volume);
    this.audio.update('chaotic', 'thaw', 0);
  }

  private syncMusicDuck(): void {
    const duck = this.cinematicBedActive
      || this.logReader.isOpen()
      || this.journal.isOpen()
      || this.dialoguePanel.isOpen()
      || this.storyOverlay.isOpen();
    this.audio.setMusicDuck(duck);
  }

  playOpeningCutscene(onComplete: () => void): void {
    this.player.unlock();
    this.setCinematicBed(true);
    this.narration.warmUp();
    const locale = this.getLocale();
    this.cutscene.play(openingCutsceneBeats(locale), locale, () => {
      this.setCinematicBed(false);
      this.player.resetToSpawn();
      onComplete();
    });
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
    this.stableNarrationPlayed = false;
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
      civilizationCycle: this.civilizationCycle,
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
    this.audio.setMusicEnabled(loadMusicEnabled());
    this.audio.setMenuMusicActive(false);
    this.audio.setMasterVolume(volume);
    this.syncMenuVolume(volume);
    this.audio.resume();
    const checkpoint = fromCheckpoint ? CheckpointSave.load() : null;
    this.civilizationCycle = this.civilizationCounter.beginRun(
      fromCheckpoint,
      checkpoint?.civilizationCycle,
    );
    this.lethalWarnedPhase = null;
    this.omenTimer = 0;
    this.hud.omen.classList.add('hidden');

    this.runJournal.clear();
    this.runJournal.recordCycleStart(fromCheckpoint);
    this.runJournal.recordCounsel(this.civilizationCounter.formatLabel(this.getLocale()));
    const stageCopy = getStageCopy(this.getLocale(), this.civilizationLegacy.getStage());
    this.runJournal.recordCounsel(
      formatWorldAgeCounsel(this.getLocale(), stageCopy.name, stageCopy.worldNote),
    );
    this.storyDirector.resetRun();
    this.storyDirector.setPredictorCalibrated(this.forecastMeta.isCalibrated());
    this.storyDirector.syncFromDiscovery(this.logDiscovery);
    this.storyDirector.onRunStart();
    this.lastSurvivalStatus = 'active';
    this.running = true;
    this.syncMusicDuck();
    this.paused = false;
    this.pauseMenu.hide();
    this.journal.close();
    this.dialoguePanel.close();
    this.overlays.death.classList.add('hidden');
    this.epilogue.hide();
    if (this.deviceProfile.prefersTouchControls) {
      this.hudCompact = true;
      this.hud.root.classList.add('compact');
      this.mobileHud?.strip.classList.remove('hidden');
      this.mobileControls?.show();
      this.player.enableTouchMode();
      this.player.lock();
    } else {
      this.mobileHud?.strip.classList.add('hidden');
      this.mobileControls?.hide();
      this.player.lock();
    }
    this.syncSoundBanner();
    this.clock.start();
    this.animate();
    window.setTimeout(() => {
      if (this.running && !this.paused) {
        this.tryPresentPendingStoryBeat();
      }
    }, 1400);
  }

  stop(): void {
    this.running = false;
    this.paused = false;
    this.pauseMenu.hide();
    cancelAnimationFrame(this.animationId);
    this.narration.cancel();
    this.audio.stop();
    this.mobileControls?.hide();
    this.mobileHudSheet?.close();
    this.mobileControls?.setSkySheetOpen(false);
    this.soundBanner?.hide();
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

  isMobileGameplayActive(): boolean {
    return this.running
      && !this.paused
      && !this.logReader.isOpen()
      && !this.journal.isOpen()
      && !this.dialoguePanel.isOpen()
      && !this.storyOverlay.isOpen()
      && this.survival.status !== 'dead';
  }

  mobileInteract(): void {
    if (!this.isMobileGameplayActive()) {
      return;
    }
    const stableEra = this.orbital.getEraKind() === 'stable';
    const nearbyLog = this.logMarkers.update(this.anchor, stableEra);
    if (this.mobileUi.nearNpc) {
      this.tryTalkToNearbyNpc();
      return;
    }
    if (nearbyLog) {
      this.tryReadNearbyLog(stableEra);
    }
  }

  mobileUse(): void {
    if (!this.isMobileGameplayActive()) {
      return;
    }
    const stableEra = this.orbital.getEraKind() === 'stable';
    const nearbyLog = this.logMarkers.update(this.anchor, stableEra);
    const nearPit = this.shelterZones.isNearDehydrationPit(this.anchor);
    const nearWater = this.waterSource.isNear(this.anchor);
    if (nearPit && !nearbyLog) {
      this.survival.toggleDehydration(nearPit);
      this.syncMovementState();
      return;
    }
    if (nearWater && stableEra) {
      this.survival.refillHydration(WATER_REFILL_AMOUNT);
      this.setStatusOverride('Condensate from the grove. Your body remembers water.', 4);
    }
  }

  getMobileInteractLabel(): string {
    const zh = this.getLocale() === 'zh';
    if (this.mobileUi.nearNpc) {
      return zh ? '交谈' : 'Talk';
    }
    if (this.mobileUi.hasNearbyLog) {
      return zh ? '阅读' : 'Read';
    }
    return zh ? '阅读/交谈' : 'Read / Talk';
  }

  getMobileUseLabel(): string {
    const zh = this.getLocale() === 'zh';
    if (this.mobileUi.nearWater && this.mobileUi.stableEra) {
      return zh ? '饮水' : 'Drink';
    }
    if (this.mobileUi.nearPit) {
      return zh ? '折叠' : 'Fold';
    }
    return zh ? '使用' : 'Use';
  }

  toggleJournal(): void {
    if (
      !this.running
      || this.paused
      || this.logReader.isOpen()
      || this.dialoguePanel.isOpen()
      || this.storyOverlay.isOpen()
    ) {
      return;
    }
    this.journal.toggle(
      this.runJournal,
      this.logDiscovery,
      this.storyDirector.getUnlockedForJournal(),
      this.getLocale(),
      this.buildQuestProgress(),
    );
    this.syncMovementState();
  }

  pause(): void {
    if (
      !this.running
      || this.paused
      || this.logReader.isOpen()
      || this.journal.isOpen()
      || this.dialoguePanel.isOpen()
      || this.storyOverlay.isOpen()
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
    void this.prepareMenuAudio();
  }

  onPointerLockLost(): void {
    if (this.deviceProfile.prefersTouchControls) {
      return;
    }
    if (
      !this.running
      || this.paused
      || this.logReader.isOpen()
      || this.journal.isOpen()
      || this.dialoguePanel.isOpen()
      || this.pauseMenu.isOpen()
      || this.storyOverlay.isOpen()
    ) {
      return;
    }
    this.pause();
  }

  private restart(): void {
    this.civilizationCycle = this.civilizationCounter.beginRun(false);
    this.runJournal.recordCounsel(
      `${this.civilizationCounter.formatLabel(this.getLocale())} begins.`,
    );
    const stageCopy = getStageCopy(this.getLocale(), this.civilizationLegacy.getStage());
    this.runJournal.recordCounsel(
      formatWorldAgeCounsel(this.getLocale(), stageCopy.name, stageCopy.worldNote),
    );
    this.scene.remove(this.civilizationProps.group);
    this.civilizationProps.dispose();
    this.civilizationProps = new CivilizationProps(this.terrain, this.civilizationLegacy.getStage(), this.landmarkMats);
    this.scene.add(this.civilizationProps.group);
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
    this.storyDirector.resetRun();
    this.storyDirector.setPredictorCalibrated(this.forecastMeta.isCalibrated());
    this.storyDirector.syncFromDiscovery(this.logDiscovery);
    this.lastSurvivalStatus = 'active';
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
    const worldStage = this.civilizationLegacy.getStage();
    this.civilizationLegacy.recordCycleCleared();
    const stageAfterClear = this.civilizationLegacy.getStage();
    const locale = this.getLocale();
    const body = buildEpilogueBody(
      locale,
      this.counselChoices.getSnapshot(),
      this.civilizationCycle,
      worldStage,
      stageAfterClear,
    );
    this.setCinematicBed(true);
    this.cutscene.play(victoryCutsceneBeats(locale, body), locale, () => {
      this.setCinematicBed(false);
      this.player.resetToSpawn();
      this.epilogue.show(body);
    });
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
    this.mobileControls?.update(delta);
    const stableEra = this.orbital.getEraKind() === 'stable';

    this.hud.lookHint.classList.toggle(
      'hidden',
      this.player.isLocked()
        || this.paused
        || this.logReader.isOpen()
        || this.journal.isOpen()
        || this.dialoguePanel.isOpen()
        || this.storyOverlay.isOpen(),
    );

    if (
      !this.logReader.isOpen()
      && !this.journal.isOpen()
      && !this.dialoguePanel.isOpen()
      && !this.storyOverlay.isOpen()
      && !this.paused
      && this.player.consumePressedKey('KeyP')
    ) {
      this.pause();
    }

    if (
      !this.logReader.isOpen()
      && !this.dialoguePanel.isOpen()
      && !this.storyOverlay.isOpen()
      && !this.paused
      && this.player.consumePressedKey('KeyJ')
    ) {
      this.toggleJournal();
    }

    this.anchor.copy(this.player.getPosition());
    const nearbyLog = this.logMarkers.update(this.anchor, stableEra);
    const nearPit = this.shelterZones.isNearDehydrationPit(this.anchor);
    const nearWater = this.waterSource.isNear(this.anchor);
    this.mobileUi = {
      hasNearbyLog: Boolean(nearbyLog),
      nearPit,
      nearWater,
      nearNpc: this.wayfinding.isNearRegistrar(this.anchor)
        || this.settlementNpcs.isNearPredictor(this.anchor)
        || (stableEra && this.settlementNpcs.isNearGroveKeeper(this.anchor)),
      stableEra,
    };

    if (this.paused || this.journal.isOpen() || this.dialoguePanel.isOpen() || this.storyOverlay.isOpen()) {
      this.wayfinding.update(
        delta,
        this.orbital.getEraKind(),
        this.anchor,
        nearPit,
        this.waterSource.mesh.visible,
        this.forecastMeta.isCalibrated(),
      );
      this.settlementNpcs.update(this.orbital.getEraKind(), this.anchor, this.npcPulseTime);
      this.npcPresence.update(delta, this.orbital.getEraKind(), this.anchor.x, this.anchor.z);
      this.pipeline.render(this.scene, this.player.camera);
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
    this.sky.update(delta);
    this.handleEraTransitions();

    this.terrain.setEraVisuals(this.orbital.getEraKind(), this.orbital.getPhase());
    this.terrain.updateVisuals(delta);
    this.ruins.setStableEraActive(stableEra);
    this.waterSource.setStableEraActive(stableEra);
    this.waterSource.update(delta);
    this.stableParticles.setActive(stableEra, delta);
    this.groveGrass.setStable(stableEra, delta);
    this.stableScatterTrees.setStable(stableEra, delta);
    this.stableWildlife.setStable(stableEra, delta, this.terrain);
    this.stablePitHerds.setStable(stableEra, delta, this.terrain);
    const phaseNow = this.orbital.getPhase();
    this.triSolarLevitation.update(delta, phaseNow);
    this.ruins.setTriSolarHideWind(phaseNow === 'tri_solar' ? 1 : 0, delta);
    const hotPhase = phaseNow === 'scorch' || phaseNow === 'tri_solar' || phaseNow === 'flying_star';
    const coldPhase = phaseNow === 'deep_cold' || phaseNow === 'eclipse_relief';
    this.pipeline.setHeat(hotPhase ? 1 : 0, delta);
    this.coldBreath?.update(this.player.camera, coldPhase, delta);
    this.stableBanner.update(delta);

    if (this.statusOverrideTimer > 0) {
      this.statusOverrideTimer -= delta;
      if (this.statusOverrideTimer <= 0) {
        this.statusOverride = null;
      }
    }

    if (this.omenTimer > 0) {
      this.omenTimer -= delta;
      if (this.omenTimer <= 0) {
        this.hud.omen.classList.add('hidden');
      }
    }

    this.exposureTarget = this.orbital.getExposureTarget();
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(
      this.renderer.toneMappingExposure,
      this.exposureTarget,
      Math.min(delta * 1.2, 1),
    );
    this.pipeline.setBloomStrength(this.orbital.getBloomTarget());

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
      if (
        this.survival.status === 'dehydrated'
        && this.lastSurvivalStatus !== 'dehydrated'
      ) {
        this.storyDirector.onFirstDehydrate();
      }
      this.lastSurvivalStatus = this.survival.status;
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
    this.npcPresence.update(delta, this.orbital.getEraKind(), this.anchor.x, this.anchor.z);
    this.updateHud(nearbyLog, stableEra, nearPit, nearWater);

    if (this.survival.status === 'dead') {
      this.handleDeath();
      return;
    }

    if (!this.logReader.isOpen() && !this.storyOverlay.isOpen()) {
      this.tryPresentPendingStoryBeat();
    }

    this.pipeline.render(this.scene, this.player.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };

  private setStatusOverride(message: string, seconds: number): void {
    this.statusOverride = message;
    this.statusOverrideTimer = seconds;
  }

  private showSkyOmen(message: string, seconds: number): void {
    this.hud.omen.textContent = message;
    this.hud.omen.classList.remove('hidden');
    this.omenTimer = seconds;
  }

  private buildNpcContext(): NpcDialogueContext {
    return {
      locale: this.getLocale(),
      logCount: this.logDiscovery.getDiscoveredCount(),
      storyBeats: this.storyDirector.getUnlockedForJournal(),
      civilizationCycle: this.civilizationCycle,
      forecastCalibrated: this.forecastMeta.isCalibrated(),
      pitFlags: this.pitRegistrarState.getFlags(),
      groveHopeHint: this.groveKeeperState.hasHopeHint(),
      counsel: this.counselChoices.getSnapshot(),
    };
  }

  private handleEraTransitions(): void {
    const transition = this.orbital.consumeTransition();
    if (!transition) {
      return;
    }

    if (transition.phaseChanged) {
      const phase = this.orbital.getPhase();
      this.audio.playPhaseEnterSting(phase);
      const omen = omenForPhaseEnter(phase, this.getLocale());
      if (omen) {
        this.showSkyOmen(omen, 9);
      }
      if (phase === 'tri_solar') {
        const locale = this.getLocale();
        const copy = {
          en: 'Tri-Solar: three suns, brutal heat — loose stone and hide drift upward.',
          zh: '三体时刻：三颗太阳同天 — 极热；碎石与皮屑离地飘起，快找掩体。',
          ja: '三体：三つの太陽 — 灼熱。石や皮が地面から浮き上がる。掩蔽を。',
        };
        this.gameToast.show(copy[locale] ?? copy.en);
      } else if (phase === 'flying_star') {
        const locale = this.getLocale();
        const copy = {
          en: 'Flying Star: a sun skims the horizon — debris tears upward in its wake.',
          zh: '飞星：太阳贴地掠过 — 碎石与皮屑被猛地扯向天空。',
          ja: '飛星：太陽が地平を掠める——瓦礫が引きずられて上がる。',
        };
        this.gameToast.show(copy[locale] ?? copy.en);
      }
      this.lethalWarnedPhase = null;
    }

    if (transition.enteredStable) {
      this.runJournal.recordEnteredStable();
      this.storyDirector.onEnteredStableEra();
      this.storyDirector.syncFromDiscovery(this.logDiscovery);
      this.stableBanner.show();
      this.audio.playStableEraChime();
      this.saveCheckpoint('Stable Era (auto)');
      if (!this.stableNarrationPlayed && loadNarrationEnabled()) {
        this.stableNarrationPlayed = true;
        const locale = this.getLocale();
        this.narration.speak(
          STABLE_ERA_NARRATION[locale],
          locale,
          MetaProgress.loadMasterVolume(),
        );
      }
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
        talk: () => {
          const tree = buildRegistrarDialogue(this.buildNpcContext());
          this.openDialogue('registrar', tree, tree.greet);
        },
      });
    }

    if (this.settlementNpcs.isNearPredictor(pos)) {
      const distance = Math.hypot(pos.x - LAST_PREDICTOR.x, pos.z - LAST_PREDICTOR.z);
      options.push({
        distance,
        talk: () => {
          const tree = buildPredictorDialogue(this.buildNpcContext());
          if (this.forecastMeta.isCalibrated()) {
            this.openDialogue('predictor', tree, tree.already_calibrated);
          } else {
            this.openDialogue('predictor', tree, tree.greet);
          }
        },
      });
    }

    if (stableEra && this.settlementNpcs.isNearGroveKeeper(pos)) {
      const distance = Math.hypot(pos.x - GROVE_KEEPER.x, pos.z - GROVE_KEEPER.z);
      options.push({
        distance,
        talk: () => {
          const tree = buildGroveDialogue(this.buildNpcContext());
          this.openDialogue('grove', tree, tree.greet);
        },
      });
    }

    if (options.length === 0) {
      return;
    }

    options.sort((a, b) => a.distance - b.distance);
    options[0]!.talk();
    this.syncMovementState();
  }

  private openDialogue(
    npc: 'registrar' | 'predictor' | 'grove',
    tree: DialogueTree,
    node: DialogueNode,
  ): void {
    this.activeDialogueNpc = npc;
    this.activeDialogue = tree;
    this.dialoguePanel.open(node, voiceRoleForNpc(npc));
  }

  private refreshActiveDialogueTree(): void {
    const ctx = this.buildNpcContext();
    if (this.activeDialogueNpc === 'registrar') {
      this.activeDialogue = buildRegistrarDialogue(ctx);
    } else if (this.activeDialogueNpc === 'predictor') {
      this.activeDialogue = buildPredictorDialogue(ctx);
    } else if (this.activeDialogueNpc === 'grove') {
      this.activeDialogue = buildGroveDialogue(ctx);
    }
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
      this.storyDirector.onPredictorCalibrated();
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
    if (choice.sideEffect === 'counsel_registrar_survivors') {
      this.counselChoices.setRegistrar('survivors');
      this.runJournal.recordCounsel('Registrar counsel: count survivors — the sky may soften sooner.');
      this.gameToast.show('Counsel set: survivors. Stable Eras may arrive slightly sooner.');
    }
    if (choice.sideEffect === 'counsel_registrar_memorial') {
      this.counselChoices.setRegistrar('memorial');
      this.runJournal.recordCounsel('Registrar counsel: memorialize the dead — pity gold may come earlier.');
      this.gameToast.show('Counsel set: memorial. A Stable Era may be forced sooner after long chaos.');
    }
    if (choice.sideEffect === 'counsel_predictor_numbers') {
      this.counselChoices.setPredictor('numbers');
      this.runJournal.recordCounsel('Predictor counsel: trust numbers — narrow the cone.');
      this.gameToast.show('Counsel set: numbers. Forecast luck nudges upward.');
    }
    if (choice.sideEffect === 'counsel_predictor_endurance') {
      this.counselChoices.setPredictor('endurance');
      this.runJournal.recordCounsel('Predictor counsel: trust endurance — keep walking.');
      this.gameToast.show('Counsel set: endurance. Long chaos may end in pity gold sooner.');
    }
    if (choice.sideEffect === 'counsel_grove_hope') {
      this.counselChoices.setGrove('hope');
      this.runJournal.recordCounsel('Grove counsel: plant hope — epilogue will remember green.');
      this.gameToast.show('Counsel set: hope. Your epilogue will emphasize green.');
    }
    if (choice.sideEffect === 'counsel_grove_caution') {
      this.counselChoices.setGrove('caution');
      this.runJournal.recordCounsel('Grove counsel: plant caution — epilogue will remember water.');
      this.gameToast.show('Counsel set: caution. Your epilogue will emphasize discipline.');
    }

    if (choice.nextId === 'calibrate_dynamic') {
      const node = buildPredictorCalibrationNode(this.orbital.getPhase(), this.getLocale());
      this.activeDialogue = { ...PREDICTOR_DIALOGUE, calibrate: node };
      this.dialoguePanel.open(node, voiceRoleForNpc('predictor'));
      return;
    }

    this.refreshActiveDialogueTree();
    const next = this.activeDialogue[choice.nextId];
    if (next && this.activeDialogueNpc) {
      this.dialoguePanel.open(next, voiceRoleForNpc(this.activeDialogueNpc));
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
    const locale = this.getLocale();
    const actionHint = getLogActionHint(locale, nearbyLog.log.id);
    if (isNew) {
      this.audio.playLogDiscover();
      if (nearbyLog.log.id === 'final_log') {
        this.pendingEpilogue = true;
      }
      this.storyDirector.syncFromDiscovery(this.logDiscovery);
      if (actionHint) {
        this.gameToast.show(actionHint);
        this.runJournal.recordCounsel(actionHint);
      }
    }
    this.logReader.open(nearbyLog.log, actionHint);
    this.syncMovementState();
  }

  private syncMovementState(): void {
    const canMove = !this.logReader.isOpen()
      && !this.journal.isOpen()
      && !this.dialoguePanel.isOpen()
      && !this.storyOverlay.isOpen()
      && !this.cutscene.isPlaying()
      && this.survival.status !== 'dehydrated'
      && this.survival.status !== 'dead';
    this.player.setMovementEnabled(canMove);
  }

  private openStoryLetter(id: StoryBeatId, onClose?: () => void): void {
    const beat = this.storyDirector.getBeatCopy(id);
    if (!beat) {
      return;
    }
    this.player.unlock();
    this.storyOverlay.show(beat, this.getLocale(), () => {
      this.syncMusicDuck();
      this.syncMovementState();
      onClose?.();
    });
    this.syncMusicDuck();
    this.syncMovementState();
  }

  private tryPresentPendingStoryBeat(onClose?: () => void): boolean {
    if (this.storyOverlay.isOpen()) {
      return false;
    }
    const id = this.storyDirector.peekPendingBeat();
    if (!id) {
      return false;
    }
    const beat = this.storyDirector.getBeatCopy(id);
    if (!beat) {
      return false;
    }
    this.player.unlock();
    this.storyOverlay.show(beat, this.getLocale(), () => {
      this.storyDirector.confirmBeatShown(id);
      this.syncMusicDuck();
      this.syncMovementState();
      onClose?.();
      if (this.running && !this.paused && !this.logReader.isOpen()) {
        this.tryPresentPendingStoryBeat();
      }
    });
    this.syncMusicDuck();
    this.syncMovementState();
    return true;
  }

  private handleDeath(): void {
    this.storyDirector.onDeath();
    this.storyDirector.syncFromDiscovery(this.logDiscovery);
    if (this.tryPresentPendingStoryBeat(() => this.finishDeathScreen())) {
      return;
    }
    this.finishDeathScreen();
  }

  private finishDeathScreen(): void {
    this.running = false;
    CheckpointSave.clear();
    this.audio.stop();
    this.player.unlock();
    const locale = this.getLocale();
    this.overlays.deathCycle.textContent = this.civilizationCounter.formatLabel(locale);
    this.overlays.deathMessage.textContent = getDeathMessageCopy(locale, this.survival.deathReason);
    const total = this.logDiscovery.getAllLogs().length;
    const found = this.logDiscovery.getDiscoveredCount();
    this.overlays.deathLogs.textContent = formatDeathLogsLine(locale, found, total);
    this.overlays.deathObjective.textContent = buildDeathObjective(locale, {
      hasFinalLog: this.meta.hasSeenFinalLog(this.logDiscovery),
      forecastCalibrated: this.forecastMeta.isCalibrated(),
      logsFound: found,
      logsTotal: total,
    });
    this.setCinematicBed(true);
    this.cutscene.play(
      deathCutsceneBeats(locale, this.survival.deathReason),
      locale,
      () => {
        this.setCinematicBed(false);
        this.player.resetToSpawn();
        this.overlays.death.classList.remove('hidden');
      },
    );
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
    const questProgress = this.buildQuestProgress();
    const objectiveLine = getQuestObjectiveLine(this.getLocale(), questProgress);
    this.hud.chapter.textContent = objectiveLine;

    const temperatureSample = this.orbital.getTemperature();
    const currentPhase = this.orbital.getPhase();
    if (
      shouldWarnLethal(temperatureSample, this.lethalWarnedPhase === currentPhase)
    ) {
      const lethalOmen = omenForLethalTemperature(this.getLocale());
      if (lethalOmen) {
        this.showSkyOmen(lethalOmen, 8);
        this.lethalWarnedPhase = currentPhase;
      }
    }

    const landmark = nearestLandmarkHint(position);
    this.hud.landmark.textContent = landmark ?? 'Open wasteland';

    this.hud.health.textContent = `${Math.ceil(snapshot.health)}`;
    this.hud.healthBar.style.width = `${snapshot.health}%`;
    this.hud.hydration.textContent = `${Math.ceil(snapshot.hydration)}`;
    this.hud.hydrationBar.style.width = `${snapshot.hydration}%`;

    const inputMode: InputMode = this.deviceProfile.prefersTouchControls ? 'touch' : 'keyboard';
    const interactionCtx: InteractionContext = {
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
        || this.storyOverlay.isOpen()
        || this.paused,
      input: inputMode,
      locale: this.getLocale(),
      forecastCalibrated: this.forecastMeta.isCalibrated(),
    };

    let statusMessage = snapshot.statusMessage;
    if (this.statusOverride) {
      statusMessage = this.statusOverride;
    } else if (stableEra && !nearWater && !interactionCtx.nearGroveKeeper && !nearbyLog) {
      statusMessage = 'Stable Era — scrub trees, pit herds, skitters, and birds return. Follow the green trail to the pool or final tablets.';
    } else if (this.journal.isOpen()) {
      statusMessage = inputMode === 'touch'
        ? (this.getLocale() === 'zh' ? '正在查看循环日志。' : 'Reviewing your cycle journal.')
        : 'Reviewing your cycle journal.';
    } else if (this.logReader.isOpen()) {
      statusMessage = 'Reading recovered text.';
    } else {
      const actionHint = resolveNearbyActionStatus(interactionCtx);
      if (actionHint) {
        statusMessage = actionHint;
      }
    }

    if (
      !this.statusOverride
      && !this.journal.isOpen()
      && !this.logReader.isOpen()
      && !resolveNearbyActionStatus(interactionCtx)
      && !this.meta.hasSeenFinalLog(this.logDiscovery)
    ) {
      statusMessage = `${statusMessage} A Stable Era will come — the sky cannot rage forever.`;
    } else if (this.logDiscovery.getDiscoveredCount() > 0) {
      const journalHint = inputMode === 'touch'
        ? (this.getLocale() === 'zh' ? ' 点 Journal 打开日志。' : ' Tap Journal for your log.')
        : ' Press J for your journal.';
      statusMessage = `${statusMessage}${journalHint}`;
    }

    this.hud.status.textContent = statusMessage;

    if (this.mobileHud) {
      this.mobileHud.line1.textContent =
        `${this.orbital.getEraLabel()} · ${this.orbital.getPhaseLabel()} · ${temperature.label}`;
      this.mobileHud.objective.textContent = objectiveLine.replace(/^Chapter: |^章节：/, '');
      this.mobileHud.healthText.textContent = `${Math.ceil(snapshot.health)}`;
      this.mobileHud.hydrationText.textContent = `${Math.ceil(snapshot.hydration)}`;
      this.mobileHud.healthBar.style.width = `${snapshot.health}%`;
      this.mobileHud.hydrationBar.style.width = `${snapshot.hydration}%`;
      this.mobileHud.sheetPhase.textContent = this.orbital.getPhaseLabel();
      this.mobileHud.sheetTemperature.textContent =
        `${temperature.label} (${snapshot.effectiveTemperature.toFixed(1)})`;
      this.mobileHud.sheetForecast.textContent = this.orbital.getForecastSummary();
      this.mobileHud.sheetLandmark.textContent = landmark ?? 'Open wasteland';
      this.mobileHud.sheetLogs.textContent =
        `${this.logDiscovery.getDiscoveredCount()} / ${this.logDiscovery.getAllLogs().length}`;
      this.mobileHud.sheetPosition.textContent = this.player.getPositionText();
      this.mobileHud.sheetStatus.textContent = statusMessage;
    }

    const interaction = resolveInteractionPrompt(interactionCtx);
    if (interaction) {
      this.hud.interaction.textContent = interaction;
      this.hud.interaction.classList.remove('hidden');
    } else {
      this.hud.interaction.classList.add('hidden');
    }

    this.syncSoundBanner();

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
    this.pipeline.setSize(width, height);
    this.player.resize(width / height);
  };

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.audio.dispose();
    this.stableParticles.dispose();
    this.groveGrass.dispose();
    this.stableScatterTrees.dispose();
    this.stableWildlife.dispose();
    this.stablePitHerds.dispose();
    this.triSolarLevitation.dispose();
    this.coldBreath?.dispose();
    this.orbital.dispose();
    this.terrain.dispose();
    this.sky.dispose();
    this.wayfinding.dispose();
    this.settlementNpcs.dispose();
    this.civilizationProps.dispose();
    this.ruins.dispose();
    this.landmarkMats.dispose();
    this.npcPresence.dispose();
    this.pipeline.dispose();
    this.renderer.dispose();
  }
}
