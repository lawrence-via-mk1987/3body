import * as THREE from 'three';
import {
  buildCelestialSunVisual,
  updateCelestialSunVisual,
  type CelestialSunPalette,
} from '../world/CelestialSunVisual';

const SUN_PALETTES: CelestialSunPalette[] = [
  { core: '#ffb27a', limb: '#ff6a2a', emissive: '#ff8a3d' },
  { core: '#fff2cc', limb: '#ffb860', emissive: '#ffe08a' },
  { core: '#ff5a3a', limb: '#8a1008', emissive: '#d62818' },
];

const G = 1;
/** Softening avoids blow-ups when bodies pass close (still chaotic). */
const SOFTEN = 0.18;
const STAR_MASS = 1;
const PLANET_MASS = 0.004;
const SUBSTEPS = 10;
const TRAIL_LEN = 72;

interface NBody {
  mass: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  acc: THREE.Vector3;
}

/** Chaotic triple-star + planet: Newtonian N-body in the barycenter frame. */
function createInitialSystem(): NBody[] {
  const triangleR = 3.2;
  const stars: NBody[] = [];
  for (let i = 0; i < 3; i += 1) {
    const ang = i * (Math.PI * 2) / 3 - Math.PI / 2;
    const pos = new THREE.Vector3(Math.cos(ang) * triangleR, 0, Math.sin(ang) * triangleR);
    const tangent = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang));
    const speed = 0.42 + i * 0.06;
    const vel = tangent.multiplyScalar(speed * (i === 1 ? 1.08 : i === 2 ? 0.92 : 1));
    vel.y = (i - 1) * 0.04;
    stars.push({ mass: STAR_MASS, pos, vel, acc: new THREE.Vector3() });
  }

  const planet: NBody = {
    mass: PLANET_MASS,
    pos: new THREE.Vector3(1.1, 0.08, -0.65),
    vel: new THREE.Vector3(-0.35, 0.02, 0.72),
    acc: new THREE.Vector3(),
  };

  return [...stars, planet];
}

function computeAccelerations(bodies: NBody[]): void {
  for (const body of bodies) {
    body.acc.set(0, 0, 0);
  }
  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const a = bodies[i]!;
      const b = bodies[j]!;
      const diff = new THREE.Vector3().subVectors(b.pos, a.pos);
      const distSq = diff.lengthSq() + SOFTEN * SOFTEN;
      const invDist = 1 / Math.sqrt(distSq);
      const invDist3 = invDist * invDist * invDist;
      const scalar = G * invDist3;
      const fA = diff.clone().multiplyScalar(scalar * b.mass);
      const fB = fA.clone().multiplyScalar(-a.mass / b.mass);
      a.acc.add(fA);
      b.acc.sub(fB);
    }
  }
}

function recenterBarycenter(bodies: NBody[]): void {
  let totalMass = 0;
  const com = new THREE.Vector3();
  const comVel = new THREE.Vector3();
  for (const body of bodies) {
    totalMass += body.mass;
    com.addScaledVector(body.pos, body.mass);
    comVel.addScaledVector(body.vel, body.mass);
  }
  if (totalMass <= 0) {
    return;
  }
  com.divideScalar(totalMass);
  comVel.divideScalar(totalMass);
  for (const body of bodies) {
    body.pos.sub(com);
    body.vel.sub(comVel);
  }
}

function velocityVerletStep(bodies: NBody[], dt: number): void {
  computeAccelerations(bodies);
  for (const body of bodies) {
    body.vel.addScaledVector(body.acc, dt * 0.5);
    body.pos.addScaledVector(body.vel, dt);
  }
  computeAccelerations(bodies);
  for (const body of bodies) {
    body.vel.addScaledVector(body.acc, dt * 0.5);
  }
  recenterBarycenter(bodies);
}

/**
 * Intro diagram: three massive stars + Trisolaris as a fourth body.
 * All paths are chaotic; nothing sits on a fixed Kepler ring.
 */
export class TrisolarisOrbitVisual {
  readonly group = new THREE.Group();
  private readonly barycenter: THREE.Group;
  private readonly planet: THREE.Mesh;
  private readonly sunGroups: THREE.Group[] = [];
  private readonly bodies: NBody[];
  private readonly planetTrail: THREE.Line;
  private readonly trailPoints: THREE.Vector3[] = [];
  private time = 0;
  private mode: 'chaos' | 'stable' | 'blend' = 'chaos';
  private stableBlend = 0;

  constructor() {
    this.group.name = 'trisolaris-orbit-visual';
    this.group.position.set(0, 24, 14);
    this.bodies = createInitialSystem();

    this.barycenter = new THREE.Group();
    this.barycenter.name = 'barycenter';
    const baryMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 6),
      new THREE.MeshBasicMaterial({ color: '#5a5048', transparent: true, opacity: 0.45 }),
    );
    this.barycenter.add(baryMarker);

    const zone = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 4.8, 96),
      new THREE.MeshBasicMaterial({
        color: '#4a4038',
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
      }),
    );
    zone.rotation.x = -Math.PI / 2;
    this.barycenter.add(zone);

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
      this.trailPoints.push(new THREE.Vector3());
    }
    const trailGeo = new THREE.BufferGeometry().setFromPoints(this.trailPoints);
    this.planetTrail = new THREE.Line(
      trailGeo,
      new THREE.LineBasicMaterial({
        color: '#6a98b8',
        transparent: true,
        opacity: 0.55,
      }),
    );
    this.barycenter.add(this.planetTrail);

    this.group.add(this.barycenter);

    for (let i = 0; i < 120; i += 1) {
      velocityVerletStep(this.bodies, 0.04);
    }
    this.syncMeshes(1);
  }

  setMode(mode: 'chaos' | 'stable' | 'blend', stableBlend = 0): void {
    this.mode = mode;
    this.stableBlend = THREE.MathUtils.clamp(stableBlend, 0, 1);
  }

  private syncMeshes(chaos: number): void {
    const stable = 1 - chaos;
    for (let i = 0; i < 3; i += 1) {
      const sunGroup = this.sunGroups[i]!;
      sunGroup.position.copy(this.bodies[i]!.pos);
      const intensity = THREE.MathUtils.lerp(1.15 + chaos * 0.85, 0.52, stable);
      updateCelestialSunVisual(sunGroup, intensity, this.time + i);
    }
    const planetBody = this.bodies[3]!;
    this.planet.position.copy(planetBody.pos);
  }

  private pushTrail(): void {
    const p = this.bodies[3]!.pos;
    this.trailPoints.shift();
    this.trailPoints.push(p.clone());
    const attr = this.planetTrail.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < TRAIL_LEN; i += 1) {
      const pt = this.trailPoints[i]!;
      attr.setXYZ(i, pt.x, pt.y, pt.z);
    }
    attr.needsUpdate = true;
  }

  update(delta: number): void {
    this.time += delta;
    const chaos = this.mode === 'chaos' ? 1 : this.mode === 'stable' ? 0 : 1 - this.stableBlend;
    const stable = 1 - chaos;

    const timeScale = THREE.MathUtils.lerp(1.15, 0.55, stable);
    const dt = (delta * timeScale) / SUBSTEPS;

    for (let s = 0; s < SUBSTEPS; s += 1) {
      velocityVerletStep(this.bodies, dt);
      if (stable > 0.02 && s === SUBSTEPS - 1) {
        for (let i = 0; i < 3; i += 1) {
          const target = new THREE.Vector3(
            -2.2 + i * 0.35,
            0.04 * (i - 1),
            0.55 + i * 0.12,
          );
          this.bodies[i]!.pos.lerp(target, stable * 0.012);
          this.bodies[i]!.vel.multiplyScalar(1 - stable * 0.02);
        }
      }
    }

    this.barycenter.rotation.y = Math.sin(this.time * 0.06) * 0.04 * chaos;
    this.planet.rotation.y += delta * (0.35 + chaos * 0.25);
    this.syncMeshes(chaos);
    this.pushTrail();

    (this.planetTrail.material as THREE.LineBasicMaterial).opacity = THREE.MathUtils.lerp(
      0.55,
      0.35,
      stable,
    );
  }

  dispose(): void {
    this.planetTrail.geometry.dispose();
    (this.planetTrail.material as THREE.Material).dispose();
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
      if (obj instanceof THREE.Sprite) {
        const mat = obj.material as THREE.SpriteMaterial;
        mat.map?.dispose();
        mat.dispose();
      }
    });
  }
}
