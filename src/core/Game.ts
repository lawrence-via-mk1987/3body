import * as THREE from 'three';
import { OrbitalDirector } from '../orbital/OrbitalDirector';
import { FirstPersonController } from '../player/FirstPersonController';
import { Sky } from '../world/Sky';
import { Terrain } from '../world/Terrain';

interface HudElements {
  era: HTMLElement;
  phase: HTMLElement;
  temperature: HTMLElement;
  forecast: HTMLElement;
  position: HTMLElement;
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
  private readonly hud: HudElements;
  private readonly anchor = new THREE.Vector3();
  private animationId = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement, hud: HudElements) {
    this.hud = hud;

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
    this.renderer.toneMappingExposure = 1.05;

    this.scene.background = new THREE.Color('#120d0a');
    this.fog = new THREE.FogExp2('#2a1810', 0.0022);
    this.scene.fog = this.fog;

    this.terrain = new Terrain();
    this.sky = new Sky();
    this.player = new FirstPersonController(canvas, this.terrain, window.innerWidth / window.innerHeight);
    this.orbital = new OrbitalDirector(this.scene, this.sky, this.fog);

    this.scene.add(this.sky.mesh);
    this.scene.add(this.terrain.mesh);
    this.addLandmarks();

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

    const pit = new THREE.Mesh(
      new THREE.RingGeometry(8, 11, 48),
      new THREE.MeshStandardMaterial({
        color: '#2a1d16',
        roughness: 1,
        side: THREE.DoubleSide,
      }),
    );
    pit.rotation.x = -Math.PI / 2;
    pit.position.set(-42, this.terrain.getHeightAt(-42, 18) + 0.05, 18);
    this.scene.add(pit);
  }

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.player.lock();
    this.clock.start();
    this.animate();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    this.player.unlock();
  }

  private animate = (): void => {
    if (!this.running) {
      return;
    }

    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.player.update(delta);

    this.anchor.copy(this.player.camera.position);
    this.sky.mesh.position.copy(this.anchor);
    this.orbital.update(delta, this.anchor);
    this.sky.update();

    this.updateHud();

    this.renderer.render(this.scene, this.player.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };

  private updateHud(): void {
    const temperature = this.orbital.getTemperature();

    this.hud.era.textContent = this.orbital.getEraLabel();
    this.hud.phase.textContent = this.orbital.getPhaseLabel();
    this.hud.temperature.textContent = `${temperature.label} (${temperature.value.toFixed(1)})`;
    this.hud.temperature.dataset.status = temperature.status;
    this.hud.forecast.textContent = this.orbital.getForecastSummary();
    this.hud.position.textContent = this.player.getPositionText();
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
