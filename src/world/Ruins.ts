import * as THREE from 'three';
import type { Terrain } from './Terrain';
import { GROVE_SITE, OBSERVATORY_SITE, PIT_SITE } from './Terrain';
import { GROVE_LANDMARK, LAST_PREDICTOR, OBSERVATORY_LANDMARK, PIT_LANDMARK, PIT_REGISTRAR, SPAWN_HINT } from './landmarks';
import type { LandmarkMaterials } from './landmarkMaterials';
import {
  GeometryBatch,
  addCairn,
  addFireRing,
  addLantern,
  beamGeometry,
  boulderGeometry,
  clothPanelGeometry,
  cordGeometry,
  flagstoneGeometry,
  foldedFormGeometry,
  postGeometry,
  roughen,
  seededRandom,
  stoneBlockGeometry,
} from './meshKit';

/** Tree placements around the grove pool (all outside the pool basin). */
export const GROVE_TREES = [
  { x: 24, z: -30, seed: 11 },
  { x: 31.5, z: -35.5, seed: 12 },
  { x: 34, z: -28, seed: 13 },
  { x: 27.5, z: -36.5, seed: 14 },
] as const;

/**
 * The built landmarks: observatory, dehydration pit dressing, grove, waystone, and the
 * collapsed shelter. Everything is merged per material so each landmark is a few draw calls.
 */
export class Ruins {
  readonly group = new THREE.Group();
  readonly groveGroup = new THREE.Group();

  private readonly bark: THREE.MeshStandardMaterial;
  private readonly canopy: THREE.MeshStandardMaterial;

  constructor(
    private readonly terrain: Terrain,
    private readonly mats: LandmarkMaterials,
  ) {
    this.bark = mats.wood.clone();
    this.bark.color.set('#3a2e24');
    this.canopy = new THREE.MeshStandardMaterial({ color: '#2a2820', roughness: 0.9, emissive: '#000000' });

    const batch = new GeometryBatch();
    this.buildObservatory(batch);
    this.buildCollapsedShelter(batch);
    this.buildDehydrationPit(batch);
    this.buildWaystone(batch);
    batch.build(this.group);

    this.buildGrove();
    this.group.add(this.groveGroup);
  }

  setStableEraActive(active: boolean): void {
    this.bark.color.set(active ? '#5a4632' : '#3a2e24');
    this.canopy.color.set(active ? '#4a7a3c' : '#2a2820');
    this.canopy.emissive.set(active ? '#16300f' : '#000000');
    this.canopy.emissiveIntensity = active ? 0.25 : 0;
    for (const child of this.groveGroup.children) {
      if (child.userData.groveType === 'canopy') {
        child.visible = active;
      }
    }
  }

  private groundAt(x: number, z: number): number {
    return this.terrain.getHeightAt(x, z);
  }

  // ---------------------------------------------------------------- observatory

  private buildObservatory(batch: GeometryBatch): void {
    const { x, z } = OBSERVATORY_LANDMARK;
    const y = OBSERVATORY_SITE.level;
    const { stone, stoneDark, stonePale, bronze } = this.mats;

    // Plinth and drum.
    batch.add(roughen(new THREE.CylinderGeometry(5.4, 5.7, 0.45, 28), 0.04, 2, 1), stone, { position: [x, y + 0.22, z] });
    batch.add(roughen(new THREE.CylinderGeometry(4.6, 4.9, 3.3, 28, 3), 0.06, 1.2, 2), stone, { position: [x, y + 0.45 + 1.65, z] });
    // A string course and masonry seams so the drum reads as stacked courses, not a tube.
    batch.add(new THREE.TorusGeometry(4.78, 0.09, 6, 40), stoneDark, { position: [x, y + 1.6, z], rotation: [Math.PI / 2, 0, 0] });
    batch.add(new THREE.TorusGeometry(4.68, 0.1, 6, 40), stoneDark, { position: [x, y + 3.75, z], rotation: [Math.PI / 2, 0, 0] });

    // Dome, missing the wedge that collapsed toward the east.
    const gap = 1.38;
    const outer = new THREE.SphereGeometry(4.7, 30, 14, Math.PI + gap / 2, Math.PI * 2 - gap, 0, Math.PI * 0.5);
    roughen(outer, 0.05, 1.4, 3);
    batch.add(outer, stone, { position: [x, y + 3.75, z] });
    const inner = new THREE.SphereGeometry(4.5, 30, 14, Math.PI + gap / 2, Math.PI * 2 - gap, 0, Math.PI * 0.5);
    batch.add(inner, stoneDark, { position: [x, y + 3.75, z] });
    // Broken edges along the gap.
    for (const side of [-1, 1]) {
      const a = Math.PI + side * gap / 2;
      for (let i = 0; i < 4; i += 1) {
        const t = i / 4;
        const theta = 0.2 + t * 1.1;
        const r = 4.6;
        const px = x - Math.cos(a) * Math.sin(theta) * r;
        const pz = z + Math.sin(a) * Math.sin(theta) * r;
        const py = y + 3.75 + Math.cos(theta) * r;
        batch.add(boulderGeometry(0.42 + (i % 2) * 0.15, 30 + i + side * 7, 1), stone, { position: [px, py, pz] });
      }
    }

    // The fallen section lies east of the drum, half-buried.
    // Shell fragment, convex side up (the patch is centred near the sphere's pole), half-buried.
    const chunk = new THREE.SphereGeometry(4.7, 16, 8, 0, 1.3, 0.1, 0.8);
    roughen(chunk, 0.08, 1, 4);
    batch.add(chunk, stone, { position: [x + 9.5, y - 2.6, z + 1.8], rotation: [0.25, 1.1, -0.2] });
    const chunkInner = new THREE.SphereGeometry(4.5, 16, 8, 0, 1.3, 0.1, 0.8);
    batch.add(chunkInner, stoneDark, { position: [x + 9.5, y - 2.6, z + 1.8], rotation: [0.25, 1.1, -0.2] });
    const rnd = seededRandom(41);
    for (let i = 0; i < 9; i += 1) {
      const a = rnd() * Math.PI * 2;
      const r = 5.6 + rnd() * 4;
      const px = x + 4 + Math.cos(a) * r * 0.6;
      const pz = z + Math.sin(a) * r * 0.5;
      const size = 0.25 + rnd() * 0.5;
      batch.add(boulderGeometry(size, 50 + i, 1), stone, {
        position: [px, this.groundAt(px, pz) + size * 0.45, pz],
        rotation: [0, rnd() * Math.PI, 0],
      });
    }

    // Doorway facing the Last Predictor.
    const doorYaw = Math.atan2(LAST_PREDICTOR.x - x, LAST_PREDICTOR.z - z);
    const dx = Math.sin(doorYaw);
    const dz = Math.cos(doorYaw);
    const doorR = 4.75;
    batch.add(new THREE.BoxGeometry(1.6, 2.6, 0.7), stoneDark, {
      position: [x + dx * doorR, y + 0.45 + 1.3, z + dz * doorR],
      rotation: [0, doorYaw, 0],
    });
    batch.add(stoneBlockGeometry(2.4, 0.45, 0.9, 5), stonePale, {
      position: [x + dx * (doorR + 0.15), y + 0.45 + 2.85, z + dz * (doorR + 0.15)],
      rotation: [0, doorYaw, 0],
    });
    for (const side of [-1, 1]) {
      const jx = x + dx * (doorR + 0.1) + dz * side * 1.05;
      const jz = z + dz * (doorR + 0.1) - dx * side * 1.05;
      batch.add(stoneBlockGeometry(0.5, 2.6, 0.8, 6 + side), stonePale, {
        position: [jx, y + 0.45 + 1.3, jz],
        rotation: [0, doorYaw, 0],
      });
    }
    // Threshold steps.
    for (let i = 0; i < 2; i += 1) {
      const sr = doorR + 1.1 + i * 0.7;
      batch.add(stoneBlockGeometry(2.6, 0.22, 0.7, 9 + i), stone, {
        position: [x + dx * sr, y + 0.34 - i * 0.14, z + dz * sr],
        rotation: [0, doorYaw, 0],
      });
    }

    // Armillary dial near the predictor: plinth, three bronze rings, gnomon.
    const ax = LAST_PREDICTOR.x + 2.4;
    const az = LAST_PREDICTOR.z + 1.6;
    const ay = this.groundAt(ax, az);
    batch.add(stoneBlockGeometry(0.9, 1.0, 0.9, 12), stonePale, { position: [ax, ay + 0.5, az] });
    batch.add(new THREE.TorusGeometry(0.72, 0.035, 8, 40), bronze, { position: [ax, ay + 1.85, az], rotation: [Math.PI / 2, 0, 0] });
    batch.add(new THREE.TorusGeometry(0.66, 0.03, 8, 40), bronze, { position: [ax, ay + 1.85, az], rotation: [0.55, 0.4, 0] });
    batch.add(new THREE.TorusGeometry(0.58, 0.03, 8, 40), bronze, { position: [ax, ay + 1.85, az], rotation: [1.2, -0.8, 0.3] });
    batch.add(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 6), bronze, { position: [ax, ay + 1.85, az], rotation: [0.55, 0.4, 0] });
    batch.add(new THREE.CylinderGeometry(0.06, 0.1, 0.8, 8), bronze, { position: [ax, ay + 1.4, az] });
  }

  // ---------------------------------------------------------------- collapsed shelter

  private buildCollapsedShelter(batch: GeometryBatch): void {
    const cx = 20;
    const cz = -15;
    this.addRuinedWall(batch, cx - 2.2, cz + 1.4, 0.5, 5.2, [4, 4, 3, 2, 1], 20);
    this.addRuinedWall(batch, cx + 1.8, cz - 1.2, 0.5 + Math.PI / 2, 4.2, [4, 3, 3, 1], 21);
    const rnd = seededRandom(22);
    for (let i = 0; i < 7; i += 1) {
      const px = cx + (rnd() - 0.5) * 7;
      const pz = cz + (rnd() - 0.5) * 6;
      const size = 0.2 + rnd() * 0.4;
      batch.add(boulderGeometry(size, 60 + i, 1), this.mats.stoneDark, {
        position: [px, this.groundAt(px, pz) + size * 0.4, pz],
        rotation: [0, rnd() * Math.PI, 0],
      });
    }
    const hy = this.groundAt(cx + 0.8, cz + 0.6);
    addFireRing(batch, this.mats, cx + 0.8, hy, cz + 0.6, 0.55, 23, false);
    batch.add(new THREE.CylinderGeometry(0.3, 0.38, 0.2, 10), this.mats.stonePale, { position: [cx + 1.6, this.groundAt(cx + 1.6, cz - 0.4) + 0.1, cz - 0.4] });
  }

  /** Dry-stone wall of staggered blocks; `rows` is how many blocks survive per course. */
  private addRuinedWall(batch: GeometryBatch, x: number, z: number, yaw: number, length: number, rows: number[], seed: number): void {
    const rnd = seededRandom(seed);
    const blockLen = 0.95;
    const blockH = 0.42;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const perCourse = Math.floor(length / blockLen);
    for (let course = 0; course < rows.length; course += 1) {
      const survive = Math.min(rows[course], perCourse);
      const offset = (course % 2) * blockLen * 0.5;
      for (let i = 0; i < survive; i += 1) {
        const along = -length / 2 + offset + blockLen * (i + 0.5) + (rnd() - 0.5) * 0.08;
        const px = x + along * cos;
        const pz = z - along * sin;
        const ground = this.groundAt(x, z);
        const py = ground + blockH * (course + 0.5);
        batch.add(stoneBlockGeometry(blockLen * 0.96, blockH, 0.55, seed * 10 + course * 7 + i), this.mats.stone, {
          position: [px, py, pz],
          rotation: [(rnd() - 0.5) * 0.04, yaw + (rnd() - 0.5) * 0.06, (rnd() - 0.5) * 0.04],
        });
      }
    }
  }

  // ---------------------------------------------------------------- dehydration pit

  private buildDehydrationPit(batch: GeometryBatch): void {
    const { x, z } = PIT_LANDMARK;
    const floorY = PIT_SITE.floor;
    const rimY = PIT_SITE.rim;
    const { stone, stoneDark, stonePale, hide, charcoal, wood } = this.mats;
    const rnd = seededRandom(70);

    // Rim coping: a ring of worn blocks along the lip, leaving the eastern ramp open.
    const rimR = 10.3;
    const rampYaw = Math.atan2(SPAWN_HINT.x - x, SPAWN_HINT.z - z);
    const count = 44;
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2;
      const blockYaw = Math.atan2(Math.sin(a), Math.cos(a));
      const angleToRamp = Math.abs(Math.atan2(Math.sin(a - (Math.PI / 2 - rampYaw)), Math.cos(a - (Math.PI / 2 - rampYaw))));
      if (angleToRamp < 0.2) {
        continue;
      }
      const px = x + Math.cos(a) * rimR;
      const pz = z + Math.sin(a) * rimR;
      const h = 0.35 + rnd() * 0.2;
      batch.add(stoneBlockGeometry(1.25, h, 0.7, 100 + i), stone, {
        position: [px, rimY + h / 2 - 0.05, pz],
        rotation: [0, -blockYaw + Math.PI / 2, 0],
      });
    }

    // Ramp of flag steps down toward the floor, following the bowl slope.
    const dirX = Math.sin(rampYaw);
    const dirZ = Math.cos(rampYaw);
    for (let i = 0; i < 9; i += 1) {
      const r = PIT_SITE.rimRadius + 0.6 - i * 0.62;
      const px = x + dirX * r;
      const pz = z + dirZ * r;
      batch.add(stoneBlockGeometry(2.2, 0.2, 0.7, 130 + i), stonePale, {
        position: [px, this.groundAt(px, pz) + 0.08, pz],
        rotation: [0, rampYaw, 0],
      });
    }

    // Folded rows on the floor: slabs with bound bundles.
    const rowYaw = rampYaw + Math.PI / 2;
    const rx = Math.sin(rowYaw);
    const rz = Math.cos(rowYaw);
    let seed = 200;
    for (let row = -1; row <= 1; row += 1) {
      for (let col = -2; col <= 1; col += 1) {
        const along = (col + 0.5) * 1.9;
        const across = row * 2.3 - 0.8;
        const px = x + rx * along + dirX * across;
        const pz = z + rz * along + dirZ * across;
        seed += 1;
        batch.add(flagstoneGeometry(0.85, seed), stoneDark, { position: [px, floorY + 0.07, pz] });
        batch.add(foldedFormGeometry(1.1 + rnd() * 0.3, seed), hide, {
          position: [px, floorY + 0.14 + 0.13, pz],
          rotation: [0, rowYaw + (rnd() - 0.5) * 0.3, 0],
        });
        for (const c of [-0.32, 0.3]) {
          batch.add(cordGeometry(0.31), charcoal, {
            position: [px + dirX * c, floorY + 0.14 + 0.13, pz + dirZ * c],
            rotation: [0, rowYaw, 0],
          });
        }
      }
    }

    // Drying racks on the far side of the floor with hides hung to cure.
    for (let k = 0; k < 2; k += 1) {
      const across = -3.6;
      const along = (k - 0.5) * 4.4;
      const px = x + rx * along + dirX * across;
      const pz = z + rz * along + dirZ * across;
      const rackH = 2.4;
      for (const s of [-1.6, 1.6]) {
        batch.add(postGeometry(rackH, 0.09), wood, { position: [px + rx * s, floorY + rackH / 2, pz + rz * s] });
      }
      batch.add(beamGeometry(3.6, 0.08), wood, { position: [px, floorY + rackH - 0.05, pz], rotation: [Math.PI / 2, rowYaw, 0] });
      for (const s of [-0.9, 0.4]) {
        batch.add(clothPanelGeometry(1.0, 1.5, 0.18, 300 + k * 3 + s), hide, {
          position: [px + rx * s, floorY + rackH - 0.1 - 0.75, pz + rz * s],
          rotation: [0, rowYaw + Math.PI / 2, 0],
        });
      }
    }

    // Registrar's table and tally stones.
    const tx = PIT_REGISTRAR.x - 1.6;
    const tz = PIT_REGISTRAR.z + 1.2;
    const ty = this.groundAt(tx, tz);
    batch.add(stoneBlockGeometry(1.3, 0.75, 0.8, 400), stonePale, { position: [tx, ty + 0.38, tz] });
    for (let i = 0; i < 5; i += 1) {
      batch.add(boulderGeometry(0.06, 410 + i, 0), stoneDark, { position: [tx - 0.4 + i * 0.18, ty + 0.8, tz + (rnd() - 0.5) * 0.3] });
    }

    // Two lanterns flank the ramp at the rim.
    for (const side of [-1, 1]) {
      const a = Math.PI / 2 - rampYaw + side * 0.26;
      const lx = x + Math.cos(a) * (rimR + 0.9);
      const lz = z + Math.sin(a) * (rimR + 0.9);
      addLantern(batch, { wood, cage: charcoal, glow: this.mats.ember }, lx, this.groundAt(lx, lz), lz, rampYaw + Math.PI);
    }
  }

  // ---------------------------------------------------------------- waystone

  private buildWaystone(batch: GeometryBatch): void {
    const x = 8.7;
    const z = 21.3;
    const y = this.groundAt(x, z);
    const { stonePale, stoneDark, stone } = this.mats;
    const stele = new THREE.CylinderGeometry(0.34, 0.58, 2.9, 6, 4);
    roughen(stele, 0.05, 2.2, 500);
    batch.add(stele, stonePale, { position: [x, y + 1.3, z], rotation: [0.06, -0.3, -0.04] });
    batch.add(new THREE.TorusGeometry(0.46, 0.05, 6, 24), stoneDark, { position: [x, y + 2.05, z], rotation: [Math.PI / 2, 0, 0] });
    batch.add(new THREE.TorusGeometry(0.5, 0.05, 6, 24), stoneDark, { position: [x, y + 1.35, z], rotation: [Math.PI / 2, 0, 0] });
    const rnd = seededRandom(501);
    for (let i = 0; i < 5; i += 1) {
      const a = rnd() * Math.PI * 2;
      const r = 0.7 + rnd() * 0.5;
      const px = x + Math.cos(a) * r;
      const pz = z + Math.sin(a) * r;
      batch.add(flagstoneGeometry(0.35 + rnd() * 0.25, 510 + i), stone, { position: [px, this.groundAt(px, pz) + 0.06, pz] });
    }
    addCairn(batch, stone, x - 1.6, this.groundAt(x - 1.6, z + 0.8), z + 0.8, { height: 0.9, seed: 520 });
  }

  // ---------------------------------------------------------------- grove

  private buildGrove(): void {
    const batch = new GeometryBatch();
    const { x, z } = GROVE_LANDMARK;
    const rnd = seededRandom(600);

    // Pool rim stones.
    const rimR = GROVE_SITE.poolRadius + 0.3;
    for (let i = 0; i < 16; i += 1) {
      const a = (i / 16) * Math.PI * 2 + rnd() * 0.2;
      const r = rimR + (rnd() - 0.5) * 0.4;
      const px = x + Math.cos(a) * r;
      const pz = z + Math.sin(a) * r;
      const size = 0.28 + rnd() * 0.22;
      batch.add(boulderGeometry(size, 610 + i, 1), this.mats.stone, {
        position: [px, this.groundAt(px, pz) + size * 0.35, pz],
        rotation: [0, rnd() * Math.PI, 0],
      });
    }
    // A low garden wall on the north edge, kept by the grove keeper.
    this.addRuinedWall(batch, x - 1, z - 7.5, 0.15, 6, [5, 4], 620);

    // Trees: trunks and branches merge into the bark mesh; canopies into one toggleable mesh.
    const canopyBatch = new GeometryBatch();
    for (const tree of GROVE_TREES) {
      this.addTree(batch, canopyBatch, tree.x, tree.z, tree.seed);
    }
    batch.build(this.groveGroup);
    const canopies = canopyBatch.build(new THREE.Group());
    for (const mesh of canopies.children) {
      mesh.userData.groveType = 'canopy';
      mesh.visible = false;
      this.groveGroup.add(mesh);
    }
  }

  private addTree(batch: GeometryBatch, canopyBatch: GeometryBatch, x: number, z: number, seed: number): void {
    const y = this.groundAt(x, z);
    const rnd = seededRandom(seed);
    const height = 2.4 + rnd() * 0.8;
    const trunk = new THREE.CylinderGeometry(0.14, 0.3, height, 7, 3);
    roughen(trunk, 0.03, 4, seed);
    const lean = (rnd() - 0.5) * 0.16;
    batch.add(trunk, this.bark, { position: [x, y + height / 2, z], rotation: [lean, 0, lean * 0.5] });
    // Root flare.
    for (let i = 0; i < 3; i += 1) {
      const a = rnd() * Math.PI * 2;
      batch.add(new THREE.CylinderGeometry(0.05, 0.14, 0.7, 5), this.bark, {
        position: [x + Math.cos(a) * 0.25, y + 0.1, z + Math.sin(a) * 0.25],
        rotation: [Math.PI / 2 - 0.6, -a + Math.PI / 2, 0],
      });
    }
    const branches = 3 + Math.floor(rnd() * 2);
    for (let i = 0; i < branches; i += 1) {
      const a = (i / branches) * Math.PI * 2 + rnd() * 0.8;
      const tilt = 0.6 + rnd() * 0.5;
      const len = 1.3 + rnd() * 0.8;
      const startY = y + height - 0.6 - rnd() * 0.6;
      const bx = x + Math.sin(a) * Math.sin(tilt) * len * 0.5;
      const bz = z + Math.cos(a) * Math.sin(tilt) * len * 0.5;
      const by = startY + Math.cos(tilt) * len * 0.5;
      batch.add(new THREE.CylinderGeometry(0.04, 0.09, len, 5), this.bark, {
        position: [bx, by, bz],
        rotation: [tilt, a, 0],
      });
      const ex = x + Math.sin(a) * Math.sin(tilt) * len;
      const ez = z + Math.cos(a) * Math.sin(tilt) * len;
      const ey = startY + Math.cos(tilt) * len;
      // Two overlapping lobes per branch so the crown reads as foliage, not a ball.
      for (let lobe = 0; lobe < 2; lobe += 1) {
        const canopy = new THREE.IcosahedronGeometry(0.6 + rnd() * 0.35, 2);
        canopy.scale(1.25, 0.62, 1.25);
        roughen(canopy, 0.14, 2.4, seed + i * 3 + lobe);
        canopyBatch.add(canopy, this.canopy, {
          position: [ex + (rnd() - 0.5) * 0.7, ey + 0.1 + lobe * 0.3, ez + (rnd() - 0.5) * 0.7],
        });
      }
    }
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
    this.bark.dispose();
    this.canopy.dispose();
  }
}
