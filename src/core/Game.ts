import * as THREE from 'three';
import { AudioDirector } from '../audio/AudioDirector';
import { canReadLog } from '../narrative/logs';
import { LogDiscovery } from '../narrative/LogDiscovery';
import { LogMarkers } from '../narrative/LogMarkers';
import { OrbitalDirector } from '../orbital/OrbitalDirector';
import { FirstPersonController } from '../player/FirstPersonController';
import { ShelterZones } from '../survival/ShelterZones';
import { SurvivalSystem } from '../survival/SurvivalSystem';
import { LogReader } from '../ui/LogReader';
import { StableEraBanner } from '../ui/StableEraBanner';
import { CaveShelter } from '../world/CaveShelter';
import { Ruins } from '../world/Ruins';
import { Sky } from '../world/Sky';
import { StableEraParticles } from '../world/StableEraParticles';
import { Terrain } from '../world/Terrain';

interface HudElements {
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
}

interface OverlayElements {
  death: HTMLElement;
  deathMessage: HTMLElement;
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
  private readonly logMarkers: LogMarkers;
  private readonly ruins: Ruins;
  private readonly stableParticles: StableEraParticles;
  private readonly audio = new AudioDirector();
  private readonly stableBanner: StableEraBanner;
  private readonly logReader: LogReader;
  private readonly hud: HudElements;
  private readonly overlays: OverlayElements;
  private readonly anchor = new THREE.Vector3();
  private animationId = 0;
  private running = false;
  private exposureTarget = 1.12;

  constructor(
    canvas: HTMLCanvasElement,
    hud: HudElements,
    overlays: OverlayElements,
    logReader: LogReader,
    stableBanner: StableEraBanner,
  ) {
    this.hud = hud;
    this.overlays = overlays;
    this.logReader = logReader;
    this.stableBanner = stableBanner;

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
    this.orbital = new OrbitalDirector(this.scene, this.sky, this.fog);
    this.logMarkers = new LogMarkers(this.terrain, this.logDiscovery);
    this.ruins = new Ruins(this.terrain);
    this.stableParticles = new StableEraParticles(this.terrain);

    this.scene.add(this.sky.mesh);
    this.scene.add(this.terrain.mesh);
    this.scene.add(this.ruins.group);
    this.scene.add(this.logMarkers.group);
    this.scene.add(this.stableParticles.points);
    this.addLandmarks();
    this.scene.add(new CaveShelter(this.terrain, this.shelterZones).group);

    this.logReader.onClose(() => {
      this.syncMovementState();
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

    const pitMarker = new THREE.Mesh(
      new THREE.TorusGeometry(10.5, 0.12, 8, 64),
      new THREE.MeshBasicMaterial({
        color: '#8f6a4a',
        transparent: true,
        opacity: 0.35,
      }),
    );
    pitMarker.rotation.x = Math.PI / 2;
    pitMarker.position.set(-42, pitY + 0.1, 18);
    this.scene.add(pitMarker);
  }

  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    await this.audio.start();
    this.running = true;
    this.overlays.death.classList.add('hidden');
    this.player.lock();
    this.clock.start();
    this.animate();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    this.audio.stop();
    this.player.unlock();
  }

  private restart(): void {
    this.survival.reset();
    this.orbital.reset();
    this.player.resetToSpawn();
    this.logReader.close();
    this.stableBanner.hide();
    this.overlays.death.classList.add('hidden');
    this.audio.resume();
    this.player.lock();
    this.running = true;
    this.clock.start();
    this.animate();
  }

  private animate = (): void => {
    if (!this.running) {
      return;
    }

    const delta = Math.min(this.clock.getDelta(), 0.05);
    const stableEra = this.orbital.getEraKind() === 'stable';

    if (!this.logReader.isOpen() && this.player.consumePressedKey('KeyE')) {
      const nearPit = this.shelterZones.isNearDehydrationPit(this.player.getPosition());
      this.survival.toggleDehydration(nearPit);
    }

    if (!this.logReader.isOpen() && this.player.consumePressedKey('KeyF')) {
      this.tryReadNearbyLog(stableEra);
    }

    this.syncMovementState();

    if (this.survival.status !== 'dead' && !this.logReader.isOpen()) {
      this.player.update(delta);
    }

    this.anchor.copy(this.player.getPosition());
    this.sky.mesh.position.copy(this.anchor);
    this.orbital.update(delta, this.anchor);
    this.sky.update();
    this.handleEraTransitions();

    this.terrain.setEraVisuals(this.orbital.getEraKind(), this.orbital.getPhase());
    this.terrain.updateVisuals(delta);
    this.ruins.setStableEraActive(stableEra);
    this.stableParticles.setActive(stableEra, delta);
    this.stableBanner.update(delta);

    this.exposureTarget = stableEra ? 1.28 : 1.12;
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(
      this.renderer.toneMappingExposure,
      this.exposureTarget,
      Math.min(delta * 2, 1),
    );

    const nearbyLog = this.logMarkers.update(this.anchor, stableEra);

    if (this.survival.status !== 'dead' && !this.logReader.isOpen()) {
      const shelter = this.shelterZones.sample(this.anchor);
      const nearPit = this.shelterZones.isNearDehydrationPit(this.anchor);
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

    this.updateHud(nearbyLog, stableEra);

    if (this.survival.status === 'dead') {
      this.handleDeath();
      return;
    }

    this.renderer.render(this.scene, this.player.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };

  private handleEraTransitions(): void {
    const transition = this.orbital.consumeTransition();
    if (!transition) {
      return;
    }

    if (transition.enteredStable) {
      this.stableBanner.show();
      this.audio.playStableEraChime();
    }

    if (transition.leftStable) {
      this.stableBanner.hide();
    }
  }

  private tryReadNearbyLog(stableEra: boolean): void {
    const nearbyLog = this.logMarkers.update(this.anchor, stableEra);
    if (!nearbyLog) {
      return;
    }

    if (!canReadLog(nearbyLog.log, this.orbital.getEraKind())) {
      return;
    }

    const isNew = this.logDiscovery.discover(nearbyLog.log.id);
    if (isNew) {
      this.audio.playLogDiscover();
    }
    this.logReader.open(nearbyLog.log);
    this.syncMovementState();
  }

  private syncMovementState(): void {
    const canMove = !this.logReader.isOpen()
      && this.survival.status !== 'dehydrated'
      && this.survival.status !== 'dead';
    this.player.setMovementEnabled(canMove);
  }

  private handleDeath(): void {
    this.running = false;
    this.audio.stop();
    this.player.unlock();
    this.overlays.deathMessage.textContent = this.survival.getDeathMessage();
    this.overlays.death.classList.remove('hidden');
  }

  private updateHud(
    nearbyLog: ReturnType<LogMarkers['update']>,
    stableEra: boolean,
  ): void {
    const temperature = this.orbital.getTemperature();
    const position = this.player.getPosition();
    const shelter = this.shelterZones.sample(position);
    const nearPit = this.shelterZones.isNearDehydrationPit(position);
    const snapshot = this.survival.getSnapshot(temperature, shelter, nearPit);

    this.hud.era.textContent = this.orbital.getEraLabel();
    this.hud.phase.textContent = this.orbital.getPhaseLabel();
    this.hud.temperature.textContent = `${temperature.label} (${snapshot.effectiveTemperature.toFixed(1)})`;
    this.hud.temperature.dataset.status = temperature.status;
    this.hud.forecast.textContent = this.orbital.getForecastSummary();
    this.hud.position.textContent = this.player.getPositionText();
    this.hud.logs.textContent = `${this.logDiscovery.getDiscoveredCount()} / ${this.logDiscovery.getAllLogs().length}`;

    this.hud.health.textContent = `${Math.ceil(snapshot.health)}`;
    this.hud.healthBar.style.width = `${snapshot.health}%`;
    this.hud.hydration.textContent = `${Math.ceil(snapshot.hydration)}`;
    this.hud.hydrationBar.style.width = `${snapshot.hydration}%`;

    let statusMessage = snapshot.statusMessage;
    if (stableEra) {
      statusMessage = 'Stable Era — the grove lives. Hydration slowly returns.';
    } else if (this.logReader.isOpen()) {
      statusMessage = 'Reading recovered text.';
    } else if (nearbyLog) {
      statusMessage = nearbyLog.discovered
        ? `Press F to re-read ${nearbyLog.log.title.toLowerCase()}.`
        : `Press F to read ${nearbyLog.log.title.toLowerCase()}.`;
    } else if (!stableEra) {
      const stableLogsRemaining = this.logDiscovery.getAllLogs().filter((log) => log.requiresStableEra).length;
      const foundStableLogs = this.logDiscovery.getAllLogs().filter(
        (log) => log.requiresStableEra && this.logDiscovery.isDiscovered(log.id),
      ).length;
      if (foundStableLogs < stableLogsRemaining) {
        statusMessage = `${statusMessage} Grove logs await a Stable Era.`;
      }
    }

    this.hud.status.textContent = statusMessage;

    this.hud.healthBar.parentElement?.classList.toggle('critical', snapshot.health < 30);
    this.hud.hydrationBar.parentElement?.classList.toggle('critical', snapshot.hydration < 25);
    document.body.dataset.survival = snapshot.status;
    document.body.dataset.era = stableEra ? 'stable' : 'chaotic';
    this.hud.era.parentElement?.classList.toggle('stable-era', stableEra);
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
    this.renderer.dispose();
  }
}
