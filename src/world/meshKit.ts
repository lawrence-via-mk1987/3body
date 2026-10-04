import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Small procedural "asset kit" for landmarks: weathered primitives plus a batcher that merges
 * everything sharing a material into a single draw call. No downloaded meshes.
 */

export function seededRandom(seed: number): () => number {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hash3(x: number, y: number, z: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise3(x: number, y: number, z: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fy = y - y0;
  const fz = z - z0;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);
  const lerp = THREE.MathUtils.lerp;
  const c00 = lerp(hash3(x0, y0, z0), hash3(x0 + 1, y0, z0), ux);
  const c10 = lerp(hash3(x0, y0 + 1, z0), hash3(x0 + 1, y0 + 1, z0), ux);
  const c01 = lerp(hash3(x0, y0, z0 + 1), hash3(x0 + 1, y0, z0 + 1), ux);
  const c11 = lerp(hash3(x0, y0 + 1, z0 + 1), hash3(x0 + 1, y0 + 1, z0 + 1), ux);
  return lerp(lerp(c00, c10, uy), lerp(c01, c11, uy), uz);
}

/**
 * Displaces vertices by a position-driven noise vector. Because the offset depends only on
 * position (not the vertex normal), shared edges on boxes stay closed.
 */
export function roughen(geometry: THREE.BufferGeometry, amplitude: number, frequency: number, seed = 0): THREE.BufferGeometry {
  const pos = geometry.attributes.position;
  const offset = seed * 17.31;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) * frequency + offset;
    const y = pos.getY(i) * frequency + offset;
    const z = pos.getZ(i) * frequency + offset;
    const dx = (valueNoise3(x, y, z) - 0.5) * 2;
    const dy = (valueNoise3(x + 31.7, y + 11.3, z + 5.1) - 0.5) * 2;
    const dz = (valueNoise3(x + 7.9, y + 43.1, z + 19.7) - 0.5) * 2;
    pos.setXYZ(i, pos.getX(i) + dx * amplitude, pos.getY(i) + dy * amplitude, pos.getZ(i) + dz * amplitude);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export interface Placement {
  position?: THREE.Vector3 | [number, number, number];
  rotation?: THREE.Euler | [number, number, number];
  scale?: THREE.Vector3 | [number, number, number] | number;
}

const tmpMatrix = new THREE.Matrix4();
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();
const tmpEuler = new THREE.Euler();

function placementMatrix(placement: Placement): THREE.Matrix4 {
  const p = placement.position;
  if (p instanceof THREE.Vector3) {
    tmpPos.copy(p);
  } else if (p) {
    tmpPos.set(p[0], p[1], p[2]);
  } else {
    tmpPos.set(0, 0, 0);
  }
  const r = placement.rotation;
  if (r instanceof THREE.Euler) {
    tmpQuat.setFromEuler(r);
  } else if (r) {
    // YXZ: tilt (x/z) first, then yaw — so [tilt, yaw, roll] arrays read naturally.
    tmpQuat.setFromEuler(tmpEuler.set(r[0], r[1], r[2], 'YXZ'));
  } else {
    tmpQuat.identity();
  }
  const s = placement.scale;
  if (s instanceof THREE.Vector3) {
    tmpScale.copy(s);
  } else if (typeof s === 'number') {
    tmpScale.setScalar(s);
  } else if (s) {
    tmpScale.set(s[0], s[1], s[2]);
  } else {
    tmpScale.set(1, 1, 1);
  }
  return tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
}

/** Collects geometry per material and merges into one mesh per material. */
export class GeometryBatch {
  private readonly parts = new Map<THREE.Material, THREE.BufferGeometry[]>();

  add(geometry: THREE.BufferGeometry, material: THREE.Material, placement: Placement = {}): void {
    const geo = geometry.index ? geometry.toNonIndexed() : geometry;
    if (geo !== geometry) {
      geometry.dispose();
    }
    // Only position/normal/uv survive merging; drop anything else so all parts are compatible.
    for (const name of Object.keys(geo.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') {
        geo.deleteAttribute(name);
      }
    }
    if (!geo.attributes.uv) {
      geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    }
    geo.applyMatrix4(placementMatrix(placement));
    const list = this.parts.get(material) ?? [];
    list.push(geo);
    this.parts.set(material, list);
  }

  build(target: THREE.Group = new THREE.Group(), shadows = true): THREE.Group {
    for (const [material, list] of this.parts) {
      const merged = mergeGeometries(list, false);
      for (const g of list) {
        g.dispose();
      }
      if (!merged) {
        continue;
      }
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = shadows;
      mesh.receiveShadow = true;
      target.add(mesh);
    }
    this.parts.clear();
    return target;
  }
}

export function boulderGeometry(radius: number, seed: number, detail = 2): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  geo.scale(1, 0.72 + seededRandom(seed)() * 0.2, 1);
  return roughen(geo, radius * 0.22, 1.6 / radius, seed);
}

export function stoneBlockGeometry(w: number, h: number, d: number, seed: number): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(w, h, d, 2, 2, 2);
  return roughen(geo, Math.min(w, h, d) * 0.08, 2.5, seed);
}

export function flagstoneGeometry(radius: number, seed: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radius, radius * 1.08, 0.14, 7);
  geo.rotateY(seededRandom(seed)() * Math.PI);
  return roughen(geo, radius * 0.12, 3, seed);
}

/** Square-section timber as a 4-sided cylinder so grain runs along V. */
export function beamGeometry(length: number, thickness: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(thickness * 0.72, thickness * 0.72, length, 4, 1);
  geo.rotateY(Math.PI / 4);
  return geo;
}

export function postGeometry(height: number, radius: number): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radius * 0.82, radius, height, 7, 1);
}

/** Hanging cloth, pinned along its top edge, sagging and rippling below. */
export function clothPanelGeometry(width: number, height: number, sag: number, seed = 0): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, height, 8, 8);
  const pos = geo.attributes.position;
  const rnd = seededRandom(seed)();
  for (let i = 0; i < pos.count; i += 1) {
    const u = pos.getX(i) / width + 0.5;
    const v = pos.getY(i) / height + 0.5;
    const hang = 1 - v;
    const z = Math.sin(u * Math.PI) * hang * sag
      + Math.sin(u * Math.PI * 4 + rnd * 6) * hang * sag * 0.25;
    pos.setZ(i, z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** A dehydrated person rolled for storage: a flattened bundle. */
export function foldedFormGeometry(length: number, seed: number): THREE.BufferGeometry {
  const geo = new THREE.CapsuleGeometry(0.3, length, 6, 10);
  geo.rotateZ(Math.PI / 2);
  geo.scale(1, 0.4, 1);
  return roughen(geo, 0.03, 6, seed);
}

export function cordGeometry(radius: number): THREE.BufferGeometry {
  const geo = new THREE.TorusGeometry(radius, 0.025, 5, 14);
  geo.rotateY(Math.PI / 2);
  geo.scale(1, 0.42, 1);
  return geo;
}

export interface CairnOptions {
  height: number;
  seed: number;
}

/** Stack of flattened stones, each slightly offset and rotated. */
export function addCairn(batch: GeometryBatch, material: THREE.Material, x: number, y: number, z: number, opts: CairnOptions): void {
  const rnd = seededRandom(opts.seed);
  const layers = 4 + Math.floor(rnd() * 3);
  let cursor = 0;
  for (let i = 0; i < layers; i += 1) {
    const t = i / layers;
    const radius = (0.5 - t * 0.28) * (opts.height / 1.3);
    const thick = radius * 0.55;
    const geo = new THREE.CylinderGeometry(radius * 0.92, radius, thick, 7);
    roughen(geo, radius * 0.1, 4, opts.seed + i);
    batch.add(geo, material, {
      position: [x + (rnd() - 0.5) * 0.12, y + cursor + thick / 2, z + (rnd() - 0.5) * 0.12],
      rotation: [(rnd() - 0.5) * 0.12, rnd() * Math.PI, (rnd() - 0.5) * 0.12],
    });
    cursor += thick * 0.9;
  }
}

export interface LanternMaterials {
  wood: THREE.Material;
  cage: THREE.Material;
  glow: THREE.Material;
}

/** Post lantern: timber post, bronze arm, charcoal cage with an emissive panel inside. */
export function addLantern(batch: GeometryBatch, mats: LanternMaterials, x: number, y: number, z: number, yaw = 0): void {
  const height = 3.2;
  batch.add(postGeometry(height, 0.1), mats.wood, { position: [x, y + height / 2, z] });
  const armLen = 0.7;
  const ax = x + Math.sin(yaw) * armLen * 0.5;
  const az = z + Math.cos(yaw) * armLen * 0.5;
  batch.add(beamGeometry(armLen, 0.08), mats.cage, {
    position: [ax, y + height - 0.1, az],
    rotation: [Math.PI / 2, yaw, 0],
  });
  const lx = x + Math.sin(yaw) * armLen;
  const lz = z + Math.cos(yaw) * armLen;
  const ly = y + height - 0.55;
  batch.add(new THREE.BoxGeometry(0.34, 0.5, 0.34), mats.cage, { position: [lx, ly, lz], rotation: [0, yaw, 0] });
  batch.add(new THREE.BoxGeometry(0.22, 0.34, 0.22), mats.glow, { position: [lx, ly, lz], rotation: [0, yaw, 0] });
}

/** Ring of fire stones with charred logs and an ember core. */
export function addFireRing(
  batch: GeometryBatch,
  mats: { stone: THREE.Material; charcoal: THREE.Material; ember: THREE.Material },
  x: number,
  y: number,
  z: number,
  radius: number,
  seed: number,
  lit: boolean,
): void {
  const rnd = seededRandom(seed);
  const count = Math.round(radius * 14);
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    const r = radius + (rnd() - 0.5) * 0.08;
    const size = 0.12 + rnd() * 0.08;
    batch.add(boulderGeometry(size, seed + i, 1), mats.stone, {
      position: [x + Math.cos(a) * r, y + size * 0.5, z + Math.sin(a) * r],
      rotation: [0, rnd() * Math.PI, 0],
    });
  }
  for (let i = 0; i < 3; i += 1) {
    const a = rnd() * Math.PI;
    batch.add(new THREE.CylinderGeometry(0.05, 0.07, radius * 1.4, 5), mats.charcoal, {
      position: [x, y + 0.08 + i * 0.05, z],
      rotation: [Math.PI / 2, 0, a],
    });
  }
  if (lit) {
    batch.add(new THREE.SphereGeometry(radius * 0.32, 8, 6), mats.ember, {
      position: [x, y + 0.1, z],
      scale: [1, 0.5, 1],
    });
  }
}

/** Timber scaffold bay: two uprights, ledgers, a diagonal brace and a plank deck. */
export function addScaffoldBay(
  batch: GeometryBatch,
  wood: THREE.Material,
  x: number,
  y: number,
  z: number,
  yaw: number,
  width: number,
  height: number,
  depth: number,
): void {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  // Matches three's Ry(yaw): local +X → (cos, -sin), local +Z → (sin, cos).
  const local = (lx: number, lz: number): [number, number] => [x + lx * cos + lz * sin, z - lx * sin + lz * cos];
  for (const lx of [-width / 2, width / 2]) {
    for (const lz of [-depth / 2, depth / 2]) {
      const [px, pz] = local(lx, lz);
      batch.add(postGeometry(height, 0.09), wood, { position: [px, y + height / 2, pz] });
    }
  }
  for (const level of [height * 0.45, height * 0.95]) {
    for (const lz of [-depth / 2, depth / 2]) {
      const [px, pz] = local(0, lz);
      batch.add(beamGeometry(width + 0.3, 0.08), wood, { position: [px, y + level, pz], rotation: [0, yaw, Math.PI / 2] });
    }
    for (const lx of [-width / 2, width / 2]) {
      const [px, pz] = local(lx, 0);
      batch.add(beamGeometry(depth + 0.3, 0.08), wood, { position: [px, y + level, pz], rotation: [Math.PI / 2, yaw, 0] });
    }
  }
  const braceLen = Math.hypot(width, height * 0.5);
  const [bx, bz] = local(0, -depth / 2);
  batch.add(beamGeometry(braceLen, 0.07), wood, {
    position: [bx, y + height * 0.7, bz],
    rotation: [0, yaw, Math.atan2(width, height * 0.5)],
  });
  const planks = Math.max(2, Math.floor(depth / 0.3));
  for (let i = 0; i < planks; i += 1) {
    const lz = -depth / 2 + 0.15 + i * (depth - 0.3) / Math.max(1, planks - 1);
    const [px, pz] = local(0, lz);
    batch.add(new THREE.BoxGeometry(width + 0.2, 0.05, 0.24), wood, { position: [px, y + height * 0.95 + 0.07, pz], rotation: [0, yaw, 0] });
  }
}
