import * as THREE from 'three';
import { GROVE_TREES } from './Ruins';
import {
  GROVE_LANDMARK,
  LAST_PREDICTOR,
  OBSERVATORY_LANDMARK,
  PIT_LANDMARK,
  PIT_REGISTRAR,
  SPAWN_HINT,
} from './landmarks';
import { OBSERVATORY_SITE, PIT_SITE } from './Terrain';
import type { ShelterZones } from '../survival/ShelterZones';
import type { Terrain } from './Terrain';

const PLAYER_RADIUS = 0.35;

interface CylinderCollider {
  x: number;
  z: number;
  radius: number;
  minY?: number;
  maxY?: number;
}

interface WallSegment {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  thickness: number;
}

export class WorldColliders {
  private readonly cylinders: CylinderCollider[] = [];
  private readonly walls: WallSegment[] = [];

  constructor(
    private readonly terrain: Terrain,
    private readonly shelterZones: ShelterZones,
  ) {
    this.buildStaticColliders();
  }

  private buildStaticColliders(): void {
    const obs = OBSERVATORY_LANDMARK;
    const obsY = OBSERVATORY_SITE.level;
    const drumR = 5.35;
    const doorYaw = Math.atan2(LAST_PREDICTOR.x - obs.x, LAST_PREDICTOR.z - obs.z);
    const eastYaw = Math.PI / 2;
    const arcSegments = 22;
    for (let i = 0; i < arcSegments; i += 1) {
      const a0 = (i / arcSegments) * Math.PI * 2;
      const a1 = ((i + 1) / arcSegments) * Math.PI * 2;
      const mid = (a0 + a1) / 2;
      if (Math.abs(this.angleDelta(mid, doorYaw)) < 0.44) {
        continue;
      }
      if (Math.abs(this.angleDelta(mid, eastYaw)) < 0.75) {
        continue;
      }
      const x0 = obs.x + Math.sin(a0) * drumR;
      const z0 = obs.z + Math.cos(a0) * drumR;
      const x1 = obs.x + Math.sin(a1) * drumR;
      const z1 = obs.z + Math.cos(a1) * drumR;
      this.walls.push({ x0, z0, x1, z1, thickness: 0.62 });
    }

    const dx = Math.sin(doorYaw);
    const dz = Math.cos(doorYaw);
    const doorR = 4.75;
    for (const side of [-1, 1]) {
      const jx = obs.x + dx * (doorR + 0.1) + dz * side * 1.05;
      const jz = obs.z + dz * (doorR + 0.1) - dx * side * 1.05;
      this.cylinders.push({
        x: jx,
        z: jz,
        radius: 0.45,
        minY: obsY,
        maxY: obsY + 3.2,
      });
    }

    this.cylinders.push({
      x: obs.x + 9.5,
      z: obs.z + 1.8,
      radius: 3.4,
      minY: obsY - 3,
      maxY: obsY + 2.5,
    });

    for (const side of [-1.7, 1.7]) {
      const bx = obs.x + 6.2;
      const bz = obs.z + side;
      this.walls.push({ x0: bx - 0.55, z0: bz - 2.6, x1: bx - 0.55, z1: bz + 2.6, thickness: 0.65 });
      this.walls.push({ x0: bx + 0.55, z0: bz - 2.6, x1: bx + 0.55, z1: bz + 2.6, thickness: 0.65 });
    }

    this.cylinders.push({ x: -18, z: -8, radius: 2.6 });
    this.cylinders.push({ x: 24, z: 12, radius: 2.4 });
    this.cylinders.push({ x: -6, z: 28, radius: 2.2 });
    this.cylinders.push({ x: 36, z: -22, radius: 2.5 });
    this.cylinders.push({
      x: 5.5,
      z: 30,
      radius: 1.4,
      minY: this.terrain.getHeightAt(5.5, 30) - 0.5,
      maxY: this.terrain.getHeightAt(5.5, 30) + 2.5,
    });

    const cx = 20;
    const cz = -15;
    this.walls.push({ x0: cx - 4.8, z0: cz + 1.4, x1: cx + 0.2, z1: cz + 1.4, thickness: 0.55 });
    this.walls.push({ x0: cx + 1.8, z0: cz - 3.3, x1: cx + 1.8, z1: cz + 1.0, thickness: 0.55 });

    const bounds = this.shelterZones.getCaveBounds();
    this.walls.push({ x0: bounds.minX, z0: bounds.minZ, x1: bounds.maxX, z1: bounds.minZ, thickness: 0.45 });
    this.walls.push({ x0: bounds.maxX, z0: bounds.minZ, x1: bounds.maxX, z1: bounds.maxZ, thickness: 0.45 });
    this.walls.push({ x0: bounds.maxX, z0: bounds.maxZ, x1: bounds.minX, z1: bounds.maxZ, thickness: 0.45 });
    this.walls.push({ x0: bounds.minX, z0: bounds.maxZ, x1: bounds.minX, z1: bounds.minZ, thickness: 0.45 });

    const portalX = bounds.maxX + 1.5;
    const portalZ = (bounds.minZ + bounds.maxZ) / 2;
    this.cylinders.push({
      x: portalX,
      z: portalZ,
      radius: 0.95,
      minY: this.terrain.getHeightAt(portalX, portalZ),
      maxY: this.terrain.getHeightAt(portalX, portalZ) + 2.8,
    });

    this.cylinders.push({
      x: 8.7,
      z: 21.3,
      radius: 0.55,
      minY: this.terrain.getHeightAt(8.7, 21.3),
      maxY: this.terrain.getHeightAt(8.7, 21.3) + 3.2,
    });

    const gx = GROVE_LANDMARK.x;
    const gz = GROVE_LANDMARK.z;
    this.walls.push({ x0: gx - 4, z0: gz - 7.5, x1: gx + 2, z1: gz - 7.5, thickness: 0.5 });

    for (const tree of GROVE_TREES) {
      const y = this.terrain.getHeightAt(tree.x, tree.z);
      this.cylinders.push({
        x: tree.x,
        z: tree.z,
        radius: 0.42,
        minY: y,
        maxY: y + 3.6,
      });
    }

    const pit = PIT_LANDMARK;
    const floorY = PIT_SITE.floor;
    const rampYaw = Math.atan2(SPAWN_HINT.x - pit.x, SPAWN_HINT.z - pit.z);
    const rowYaw = rampYaw + Math.PI / 2;
    const dirX = Math.sin(rampYaw);
    const dirZ = Math.cos(rampYaw);
    const rx = Math.sin(rowYaw);
    const rz = Math.cos(rowYaw);
    for (let k = 0; k < 2; k += 1) {
      const across = -3.6;
      const along = (k - 0.5) * 4.4;
      const px = pit.x + rx * along + dirX * across;
      const pz = pit.z + rz * along + dirZ * across;
      for (const s of [-1.6, 1.6]) {
        this.cylinders.push({
          x: px + rx * s,
          z: pz + rz * s,
          radius: 0.22,
          minY: floorY,
          maxY: floorY + 2.6,
        });
      }
    }

    const tx = PIT_REGISTRAR.x - 1.6;
    const tz = PIT_REGISTRAR.z + 1.2;
    const ty = this.terrain.getHeightAt(tx, tz);
    this.cylinders.push({
      x: tx,
      z: tz,
      radius: 0.85,
      minY: ty,
      maxY: ty + 1.05,
    });
  }

  /** Push player out of solids; returns whether position was adjusted. */
  resolveHorizontal(position: THREE.Vector3, prev: THREE.Vector3): void {
    if (!this.canStandAtStep(prev, position)) {
      position.x = prev.x;
      position.z = prev.z;
      return;
    }

    this.resolveTerrainCliffs(position, prev);
    this.resolvePitRim(position, prev);
    this.resolveCaveBounds(position, prev);

    for (let pass = 0; pass < 3; pass += 1) {
      for (const wall of this.walls) {
        this.resolveWall(position, wall);
      }
      for (const cyl of this.cylinders) {
        this.resolveCylinder(position, cyl);
      }
    }
  }

  private resolveTerrainCliffs(position: THREE.Vector3, prev: THREE.Vector3): void {
    const h0 = this.terrain.getHeightAt(prev.x, prev.z);
    const h1 = this.terrain.getHeightAt(position.x, position.z);
    const horiz = Math.hypot(position.x - prev.x, position.z - prev.z);
    if (horiz < 1e-4) {
      return;
    }

    const midX = (prev.x + position.x) * 0.5;
    const midZ = (prev.z + position.z) * 0.5;
    const hMid = this.terrain.getHeightAt(midX, midZ);
    const linearMid = (h0 + h1) * 0.5;
    if (hMid > linearMid + 0.5 && hMid - Math.min(h0, h1) > 1.0) {
      position.x = prev.x;
      position.z = prev.z;
      return;
    }

    const rise = h1 - h0;
    if (rise / horiz > 0.68 && rise > 0.32) {
      position.x = prev.x;
      position.z = prev.z;
      return;
    }

    const grad = this.gradientMagnitude(position.x, position.z);
    if (grad > 0.95 && rise > 0.12) {
      position.x = prev.x;
      position.z = prev.z;
    }
  }

  private angleDelta(a: number, b: number): number {
    let delta = a - b;
    while (delta > Math.PI) {
      delta -= Math.PI * 2;
    }
    while (delta < -Math.PI) {
      delta += Math.PI * 2;
    }
    return delta;
  }

  private gradientMagnitude(x: number, z: number): number {
    const eps = 0.45;
    const hx = this.terrain.getHeightAt(x + eps, z) - this.terrain.getHeightAt(x - eps, z);
    const hz = this.terrain.getHeightAt(x, z + eps) - this.terrain.getHeightAt(x, z - eps);
    return Math.hypot(hx, hz) / (2 * eps);
  }

  private canStandAtStep(prev: THREE.Vector3, next: THREE.Vector3): boolean {
    const h0 = this.terrain.getHeightAt(prev.x, prev.z);
    const h1 = this.terrain.getHeightAt(next.x, next.z);
    const maxStep = 1.05;
    if (h1 - h0 > maxStep) {
      return false;
    }
    const drop = h0 - h1;
    if (drop > 2.8) {
      return false;
    }

    const cell = 0.85;
    let maxRise = 0;
    for (const [dx, dz] of [[cell, 0], [-cell, 0], [0, cell], [0, -cell]] as const) {
      const h = this.terrain.getHeightAt(next.x + dx, next.z + dz);
      maxRise = Math.max(maxRise, h - h1);
    }
    return maxRise < 1.35;
  }

  private resolvePitRim(position: THREE.Vector3, prev: THREE.Vector3): void {
    const { x: px, z: pz } = PIT_LANDMARK;
    const dx = position.x - px;
    const dz = position.z - pz;
    const r = Math.hypot(dx, dz);
    const inner = PIT_SITE.floorRadius + 0.5;
    const outer = PIT_SITE.rimRadius + 0.8;
    if (r < inner || r > outer + 1.2) {
      return;
    }

    const angle = Math.atan2(dx, dz);
    const ramp = Math.atan2(SPAWN_HINT.x - px, SPAWN_HINT.z - pz);
    let delta = angle - ramp;
    while (delta > Math.PI) {
      delta -= Math.PI * 2;
    }
    while (delta < -Math.PI) {
      delta += Math.PI * 2;
    }
    if (Math.abs(delta) < 0.32) {
      return;
    }

    const rimY = PIT_SITE.rim + 0.6;
    if (position.y > rimY + 2.2) {
      return;
    }

    const wallR = PIT_SITE.rimRadius + PLAYER_RADIUS + 0.15;
    const prevR = Math.hypot(prev.x - px, prev.z - pz);
    const targetR = prevR < wallR ? inner : wallR + 0.05;
    if (Math.abs(r - wallR) < 1.4) {
      const scale = targetR / (r || 1);
      position.x = px + dx * scale;
      position.z = pz + dz * scale;
    }
  }

  private resolveCaveBounds(position: THREE.Vector3, prev: THREE.Vector3): void {
    const bounds = this.shelterZones.getCaveBounds();
    const surface = this.terrain.getHeightAt(position.x, position.z);
    const underground = position.y < surface - 0.75;
    if (!underground) {
      return;
    }

    const margin = 0.35 + PLAYER_RADIUS;
    const minX = bounds.minX + margin;
    const maxX = bounds.maxX - margin;
    const minZ = bounds.minZ + margin;
    const maxZ = bounds.maxZ - margin;

    if (position.x < minX || position.x > maxX || position.z < minZ || position.z > maxZ) {
      position.x = THREE.MathUtils.clamp(prev.x, minX, maxX);
      position.z = THREE.MathUtils.clamp(prev.z, minZ, maxZ);
    }
  }

  private resolveCylinder(position: THREE.Vector3, cyl: CylinderCollider): void {
    if (cyl.minY !== undefined && position.y < cyl.minY) {
      return;
    }
    if (cyl.maxY !== undefined && position.y > cyl.maxY + PLAYER_RADIUS) {
      return;
    }
    const dx = position.x - cyl.x;
    const dz = position.z - cyl.z;
    const dist = Math.hypot(dx, dz);
    const minDist = cyl.radius + PLAYER_RADIUS;
    if (dist >= minDist || dist < 1e-4) {
      return;
    }
    const push = minDist / dist;
    position.x = cyl.x + dx * push;
    position.z = cyl.z + dz * push;
  }

  private resolveWall(position: THREE.Vector3, wall: WallSegment): void {
    const ax = wall.x1 - wall.x0;
    const az = wall.z1 - wall.z0;
    const lenSq = ax * ax + az * az;
    if (lenSq < 1e-4) {
      return;
    }
    const t = THREE.MathUtils.clamp(
      ((position.x - wall.x0) * ax + (position.z - wall.z0) * az) / lenSq,
      0,
      1,
    );
    const cx = wall.x0 + ax * t;
    const cz = wall.z0 + az * t;
    const dx = position.x - cx;
    const dz = position.z - cz;
    const dist = Math.hypot(dx, dz);
    const minDist = wall.thickness + PLAYER_RADIUS;
    if (dist >= minDist || dist < 1e-4) {
      return;
    }
    const push = minDist / dist;
    position.x = cx + dx * push;
    position.z = cz + dz * push;
  }
}
