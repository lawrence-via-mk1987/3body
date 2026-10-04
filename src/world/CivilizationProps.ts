import * as THREE from 'three';
import type { Terrain } from './Terrain';
import { GROVE_LANDMARK, OBSERVATORY_LANDMARK, PIT_LANDMARK, SPAWN_HINT } from './landmarks';
import type { LandmarkMaterials } from './landmarkMaterials';
import {
  GeometryBatch,
  addCairn,
  addFireRing,
  addLantern,
  addScaffoldBay,
  beamGeometry,
  clothPanelGeometry,
  flagstoneGeometry,
  postGeometry,
  seededRandom,
} from './meshKit';

/**
 * Civilization-stage dressing. Stage 0 is the spawn clutter every cycle sees; later stages
 * add the pit camp, observatory repairs, grove path and finally lantern roads between hubs.
 */
export class CivilizationProps {
  readonly group = new THREE.Group();

  constructor(
    private readonly terrain: Terrain,
    stage: number,
    private readonly mats: LandmarkMaterials,
  ) {
    const batch = new GeometryBatch();
    this.buildBaseClutter(batch);
    if (stage >= 1) {
      this.buildPitAge(batch);
    }
    if (stage >= 2) {
      this.buildObservatoryScaffold(batch);
    }
    if (stage >= 3) {
      this.buildGrovePaths(batch);
    }
    if (stage >= 4) {
      this.buildUnifiedRoads(batch);
    }
    batch.build(this.group);
  }

  private groundAt(x: number, z: number): number {
    return this.terrain.getHeightAt(x, z);
  }

  private buildBaseClutter(batch: GeometryBatch): void {
    const rnd = seededRandom(900);
    // Trail cairns march up the gully north of the spawn, on its narrow floor (x = 0).
    for (let i = 0; i < 6; i += 1) {
      const x = SPAWN_HINT.x + (rnd() - 0.5) * 0.3;
      const z = SPAWN_HINT.z + 8 + i * 7.5;
      addCairn(batch, this.mats.stone, x, this.terrain.getSettleHeight(x, z, 0.4), z, { height: 0.9 + rnd() * 0.5, seed: 910 + i });
    }

    // Abandoned hand cart on the plateau east of the gully: bed, two shafts, two spoked wheels.
    const cx = 5.5;
    const cz = 30;
    const cy = this.terrain.getSettleHeight(cx, cz, 0.9);
    const yaw = 0.6;
    const { wood, charcoal } = this.mats;
    batch.add(new THREE.BoxGeometry(1.7, 0.12, 1.0), wood, { position: [cx, cy + 0.6, cz], rotation: [0.08, yaw, 0] });
    for (const side of [-0.42, 0.42]) {
      const sx = cx + Math.cos(yaw) * 1.3 + Math.sin(yaw) * side;
      const sz = cz - Math.sin(yaw) * 1.3 + Math.cos(yaw) * side;
      batch.add(beamGeometry(1.5, 0.07), wood, { position: [sx, cy + 0.45, sz], rotation: [0, yaw, Math.PI / 2 + 0.18] });
    }
    for (const side of [-0.6, 0.6]) {
      const wx = cx + Math.sin(yaw) * side;
      const wz = cz + Math.cos(yaw) * side;
      batch.add(new THREE.TorusGeometry(0.5, 0.06, 6, 16), wood, { position: [wx, cy + 0.52, wz], rotation: [0, yaw, 0] });
      for (let s = 0; s < 4; s += 1) {
        batch.add(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 4), charcoal, {
          position: [wx, cy + 0.52, wz],
          rotation: [0, yaw, (s / 4) * Math.PI],
        });
      }
    }

    // Signal fire by the trench mouth, lit as a message to whoever unfolds next.
    addFireRing(batch, this.mats, -8, this.terrain.getSettleHeight(-8, 14, 0.8), 14, 0.7, 920, true);
  }

  private buildPitAge(batch: GeometryBatch): void {
    const { wood, cloth } = this.mats;
    for (let i = 0; i < 4; i += 1) {
      const angle = (i / 4) * Math.PI * 2 + 0.6;
      const x = PIT_LANDMARK.x + Math.cos(angle) * 12.2;
      const z = PIT_LANDMARK.z + Math.sin(angle) * 12.2;
      const y = this.groundAt(x, z);
      const yaw = -angle + Math.PI / 2;
      batch.add(postGeometry(3.4, 0.1), wood, { position: [x, y + 1.7, z] });
      batch.add(beamGeometry(1.5, 0.07), wood, { position: [x, y + 3.3, z], rotation: [0, yaw, Math.PI / 2] });
      batch.add(clothPanelGeometry(1.3, 1.7, 0.22, 930 + i), cloth, {
        position: [x, y + 3.25 - 0.85, z],
        rotation: [0, yaw, 0],
      });
    }
  }

  private buildObservatoryScaffold(batch: GeometryBatch): void {
    const { x, z } = OBSERVATORY_LANDMARK;
    // Two bays against the collapsed eastern side, where the dome is being rebuilt.
    for (const dz of [-1.7, 1.7]) {
      const bx = x + 6.2;
      const bz = z + dz;
      addScaffoldBay(batch, this.mats.wood, bx, this.groundAt(bx, bz), bz, Math.PI / 2, 3.2, 5.2, 1.4);
    }
    addFireRing(batch, this.mats, x + 5, this.groundAt(x + 5, z - 5), z - 5, 0.55, 940, true);
  }

  private buildGrovePaths(batch: GeometryBatch): void {
    const rnd = seededRandom(950);
    const steps = 14;
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      const x = THREE.MathUtils.lerp(SPAWN_HINT.x, GROVE_LANDMARK.x, t) + (rnd() - 0.5) * 0.8;
      const z = THREE.MathUtils.lerp(SPAWN_HINT.z, GROVE_LANDMARK.z, t) + (rnd() - 0.5) * 0.8;
      batch.add(flagstoneGeometry(0.55 + rnd() * 0.2, 960 + i), this.mats.stonePale, { position: [x, this.groundAt(x, z) + 0.05, z] });
    }
    addFireRing(batch, this.mats, GROVE_LANDMARK.x - 4.5, this.groundAt(GROVE_LANDMARK.x - 4.5, GROVE_LANDMARK.z + 3), GROVE_LANDMARK.z + 3, 0.75, 970, true);
  }

  private buildUnifiedRoads(batch: GeometryBatch): void {
    const lanternMats = { wood: this.mats.wood, cage: this.mats.charcoal, glow: this.mats.ember };
    const routes: Array<[{ x: number; z: number }, { x: number; z: number }]> = [
      [SPAWN_HINT, PIT_LANDMARK],
      [SPAWN_HINT, OBSERVATORY_LANDMARK],
      [SPAWN_HINT, GROVE_LANDMARK],
    ];
    for (const [from, to] of routes) {
      const yaw = Math.atan2(to.x - from.x, to.z - from.z);
      for (let i = 1; i <= 3; i += 1) {
        const t = i / 4;
        const x = THREE.MathUtils.lerp(from.x, to.x, t) + Math.cos(yaw) * 1.6;
        const z = THREE.MathUtils.lerp(from.z, to.z, t) - Math.sin(yaw) * 1.6;
        addLantern(batch, lanternMats, x, this.groundAt(x, z), z, yaw);
      }
    }
    for (const hub of [PIT_LANDMARK, OBSERVATORY_LANDMARK, GROVE_LANDMARK]) {
      const x = hub.x + 6;
      const z = hub.z + 6;
      addLantern(batch, lanternMats, x, this.groundAt(x, z), z, Math.atan2(hub.x - x, hub.z - z));
    }
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
  }
}
