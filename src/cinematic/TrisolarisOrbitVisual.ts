import * as THREE from 'three';
import {
  buildCelestialSunVisual,
  updateCelestialSunVisual,
  type CelestialSunPalette,
} from '../world/CelestialSunVisual';
import {
  createTrisolarisSystem,
  velocityVerletStep,
  type NBody,
} from './trisolarisNBody';

const SUN_PALETTES: CelestialSunPalette[] = [
  { core: '#ffb27a', limb: '#ff6a2a', emissive: '#ff8a3d' },
  { core: '#fff2cc', limb: '#ffb860', emissive: '#ffe08a' },
  { core: '#ff5a3a', limb: '#8a1008', emissive: '#d62818' },
];

const SUBSTEPS = 12;
const TRAIL_LEN = 80;
const STAR_TRAIL_LEN = 56;

function makeTrailLine(color: string, opacity: number, pointCount: number): THREE.Line {
  const points = Array.from({ length: pointCount }, () => new THREE.Vector3());
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}

function pushTrailLine(line: THREE.Line, point: THREE.Vector3, len: number, buffer: THREE.Vector3[]): void {
  buffer.shift();
  buffer.push(point.clone());
  const attr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < len; i += 1) {
    const pt = buffer[i]!;
    attr.setXYZ(i, pt.x, pt.y, pt.z);
  }
  attr.needsUpdate = true;
}

/** Inclined reference rings — remind viewer orbits are not coplanar. */
function addInclinationGuides(parent: THREE.Group): void {
  const specs = [
    { inc: 0.42, node: 0.15, color: 0x5a5048 },
    { inc: -0.58, node: 1.35, color: 0x4a4540 },
    { inc: 0.76, node: -0.95, color: 0x554840 },
  ];
  for (const spec of specs) {
    const curve = new THREE.EllipseCurve(0, 0, 3.6, 3.6, 0, Math.PI * 2, false, 0);
    const pts = curve.getPoints(64).map((p) => new THREE.Vector3(p.x, 0, p.y));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.14,
      }),
    );
    line.rotation.x = spec.inc;
    line.rotation.y = spec.node;
    parent.add(line);
  }
}

/**
 * Intro diagram: 3D Newtonian triple star + Trisolaris.
 * Mutual gravity includes planet back-reaction on the stars.
 */
export class TrisolarisOrbitVisual {
  readonly group = new THREE.Group();
  private readonly barycenter: THREE.Group;
  private readonly planet: THREE.Mesh;
  private readonly sunGroups: THREE.Group[] = [];
  private readonly bodies: NBody[];
  private readonly planetTrail: THREE.Line;
  private readonly starTrails: THREE.Line[] = [];
  private readonly planetTrailBuf: THREE.Vector3[] = [];
  private readonly starTrailBufs: THREE.Vector3[][] = [[], [], []];
  private time = 0;
  private mode: 'chaos' | 'stable' | 'blend' = 'chaos';
  private stableBlend = 0;
  constructor() {
    this.group.name = 'trisolaris-orbit-visual';
    this.group.position.set(0, 24, 14);
    this.bodies = createTrisolarisSystem();

    this.barycenter = new THREE.Group();
    this.barycenter.name = 'barycenter';
    const baryMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 6),
      new THREE.MeshBasicMaterial({ color: '#5a5048', transparent: true, opacity: 0.4 }),
    );
    this.barycenter.add(baryMarker);
    addInclinationGuides(this.barycenter);

    const planetMat = new THREE.MeshStandardMaterial({
      color: '#4a6a8a',
      emissive: '#1a2838',
      emissiveIntensity: 0.35,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.planet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 20), planetMat);
    this.planet.castShadow = true;
    this.barycenter.add(this.planet);

    for (let i = 0; i < 3; i += 1) {
      const sunGroup = buildCelestialSunVisual(SUN_PALETTES[i]!, 0.5 + i * 0.04);
      this.sunGroups.push(sunGroup);
      this.barycenter.add(sunGroup);
    }

    for (let i = 0; i < TRAIL_LEN; i += 1) {
      this.planetTrailBuf.push(new THREE.Vector3());
    }
    this.planetTrail = makeTrailLine('#6a98b8', 0.58, TRAIL_LEN);
    this.barycenter.add(this.planetTrail);

    const starColors = ['#c89868', '#d8c890', '#c87058'];
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < STAR_TRAIL_LEN; j += 1) {
        this.starTrailBufs[i]!.push(new THREE.Vector3());
      }
      const trail = makeTrailLine(starColors[i]!, 0.22, STAR_TRAIL_LEN);
      this.starTrails.push(trail);
      this.barycenter.add(trail);
    }

    this.group.add(this.barycenter);

    for (let i = 0; i < 180; i += 1) {
      velocityVerletStep(this.bodies, 0.035);
    }
    this.syncMeshes(1);
    for (let i = 0; i < TRAIL_LEN; i += 1) {
      this.planetTrailBuf[i]!.copy(this.bodies[3]!.pos);
    }
    for (let s = 0; s < 3; s += 1) {
      for (let i = 0; i < STAR_TRAIL_LEN; i += 1) {
        this.starTrailBufs[s]![i]!.copy(this.bodies[s]!.pos);
      }
    }
  }

  setMode(mode: 'chaos' | 'stable' | 'blend', stableBlend = 0): void {
    this.mode = mode;
    this.stableBlend = THREE.MathUtils.clamp(stableBlend, 0, 1);
  }

  /** Suggested camera look-at shift for 3D motion (optional). */
  getFocusOffset(out: THREE.Vector3): THREE.Vector3 {
    out.set(0, 0, 0);
    for (let i = 0; i < 3; i += 1) {
      out.addScaledVector(this.bodies[i]!.pos, this.bodies[i]!.mass);
    }
    out.addScaledVector(this.bodies[3]!.pos, this.bodies[3]!.mass);
    const m = this.bodies.reduce((s, b) => s + b.mass, 0);
    out.divideScalar(m);
    return out;
  }

  private syncMeshes(chaos: number): void {
    const stable = 1 - chaos;
    for (let i = 0; i < 3; i += 1) {
      const sunGroup = this.sunGroups[i]!;
      sunGroup.position.copy(this.bodies[i]!.pos);
      const intensity = THREE.MathUtils.lerp(1.15 + chaos * 0.85, 0.52, stable);
      updateCelestialSunVisual(sunGroup, intensity, this.time + i);
    }
    this.planet.position.copy(this.bodies[3]!.pos);
  }

  update(delta: number): void {
    this.time += delta;
    const chaos = this.mode === 'chaos' ? 1 : this.mode === 'stable' ? 0 : 1 - this.stableBlend;
    const stable = 1 - chaos;

    const timeScale = THREE.MathUtils.lerp(1.12, 0.62, stable);
    const dt = (delta * timeScale) / SUBSTEPS;

    for (let s = 0; s < SUBSTEPS; s += 1) {
      velocityVerletStep(this.bodies, dt);
      if (stable > 0.01) {
        const damp = 1 - stable * 0.018;
        for (const body of this.bodies) {
          body.vel.multiplyScalar(damp);
        }
      }
    }

    this.planet.rotation.y += delta * (0.35 + chaos * 0.25);
    this.syncMeshes(chaos);

    pushTrailLine(this.planetTrail, this.bodies[3]!.pos, TRAIL_LEN, this.planetTrailBuf);
    for (let i = 0; i < 3; i += 1) {
      pushTrailLine(this.starTrails[i]!, this.bodies[i]!.pos, STAR_TRAIL_LEN, this.starTrailBufs[i]!);
    }

    (this.planetTrail.material as THREE.LineBasicMaterial).opacity = THREE.MathUtils.lerp(
      0.58,
      0.38,
      stable,
    );
  }

  dispose(): void {
    this.planetTrail.geometry.dispose();
    (this.planetTrail.material as THREE.Material).dispose();
    for (const trail of this.starTrails) {
      trail.geometry.dispose();
      (trail.material as THREE.Material).dispose();
    }
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const m = obj.material;
        if (Array.isArray(m)) {
          m.forEach((mat) => mat.dispose());
        } else {
          m.dispose();
        }
      }
      if (obj instanceof THREE.Line && obj !== this.planetTrail && !this.starTrails.includes(obj)) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
      if (obj instanceof THREE.Sprite) {
        const mat = obj.material as THREE.SpriteMaterial;
        mat.map?.dispose();
        mat.dispose();
      }
    });
  }
}
