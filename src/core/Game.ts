import * as THREE from 'three';
import { OrbitalDirector } from '../orbital/OrbitalDirector';
import { FirstPersonController } from '../player/FirstPersonController';
import { ShelterZones } from '../survival/ShelterZones';
import { SurvivalSystem } from '../survival/SurvivalSystem';
import { CaveShelter } from '../world/CaveShelter';
import { Sky } from '../world/Sky';
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
  private readonly hud: HudElements;
  private readonly overlays: OverlayElements;
  private readonly anchor = new THREE.Vector3();
  private animationId = 0;
  private running = false;

  constructor(
    canvas: HTMLCanvasElement,
    hud: HudElements,
    overlays: OverlayElements,
  ) {
    this.hud = hud;
    this.overlays = overlays;

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

    this.scene.add(this.sky.mesh);
    this.scene.add(this.terrain.mesh);
    this.addLandmarks();
    this.scene.add(new CaveShelter(this.terrain, this.shelterZones).group);

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

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.overlays.death.classList.add('hidden');
    this.player.lock();
    this.clock.start();
    this.animate();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    this.player.unlock();
  }

  private restart(): void {
    this.survival.reset();
    this.orbital.reset();
    this.player.resetToSpawn();
    this.overlays.death.classList.add('hidden');
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

    if (this.player.consumePressedKey('KeyE')) {
      const nearPit = this.shelterZones.isNearDehydrationPit(this.player.getPosition());
      this.survival.toggleDehydration(nearPit);
    }

    const isDehydrated = this.survival.status === 'dehydrated';
    this.player.setMovementEnabled(!isDehydrated && this.survival.status !== 'dead');

    if (this.survival.status !== 'dead') {
      this.player.update(delta);
    }

    this.anchor.copy(this.player.getPosition());
    this.sky.mesh.position.copy(this.anchor);
    this.orbital.update(delta, this.anchor);
    this.sky.update();

    if (this.survival.status !== 'dead') {
      const shelter = this.shelterZones.sample(this.anchor);
      const nearPit = this.shelterZones.isNearDehydrationPit(this.anchor);
      this.survival.update(
        delta,
        this.orbital.getTemperature(),
        shelter,
        nearPit,
        this.player.isSprinting(),
      );
    }

    this.updateHud();

    if (this.survival.status === 'dead') {
      this.handleDeath();
      return;
    }

    this.renderer.render(this.scene, this.player.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };

  private handleDeath(): void {
    this.running = false;
    this.player.unlock();
    this.overlays.deathMessage.textContent = this.survival.getDeathMessage();
    this.overlays.death.classList.remove('hidden');
  }

  private updateHud(): void {
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

    this.hud.health.textContent = `${Math.ceil(snapshot.health)}`;
    this.hud.healthBar.style.width = `${snapshot.health}%`;
    this.hud.hydration.textContent = `${Math.ceil(snapshot.hydration)}`;
    this.hud.hydrationBar.style.width = `${snapshot.hydration}%`;
    this.hud.status.textContent = snapshot.statusMessage;

    this.hud.healthBar.parentElement?.classList.toggle('critical', snapshot.health < 30);
    this.hud.hydrationBar.parentElement?.classList.toggle('critical', snapshot.hydration < 25);
    document.body.dataset.survival = snapshot.status;
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
    this.orbital.dispose();
    this.terrain.dispose();
    this.sky.dispose();
    this.renderer.dispose();
  }
}
