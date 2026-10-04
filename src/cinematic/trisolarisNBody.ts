import * as THREE from 'three';

export const TRISOLARIS_G = 1;
export const TRISOLARIS_SOFTEN = 0.14;
/** Star masses (hierarchical triple — not identical). */
export const STAR_MASSES = [1, 0.82, 0.68] as const;
/** Trisolaris: heavy enough to tug stars slightly over long runs. */
export const PLANET_MASS = 0.012;

export interface NBody {
  mass: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  acc: THREE.Vector3;
}

const _diff = new THREE.Vector3();

function rotateY(v: THREE.Vector3, angle: number): void {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const x = v.x * c + v.z * s;
  const z = -v.x * s + v.z * c;
  v.x = x;
  v.z = z;
}

function rotateX(v: THREE.Vector3, angle: number): void {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const y = v.y * c - v.z * s;
  const z = v.y * s + v.z * c;
  v.y = y;
  v.z = z;
}

function applyOrbitTilt(v: THREE.Vector3, inclination: number, nodeLongitude: number): void {
  rotateX(v, inclination);
  rotateY(v, nodeLongitude);
}

/** Chaotic hierarchical triple + planet — initial state in 3D with inclined paths. */
export function createTrisolarisSystem(): NBody[] {
  const stars: NBody[] = [];
  const triangleR = 3.1;
  const inclinations = [0.42, -0.58, 0.76];
  const nodes = [0.15, 1.35, -0.95];

  for (let i = 0; i < 3; i += 1) {
    const ang = i * (Math.PI * 2) / 3 - Math.PI / 2;
    const pos = new THREE.Vector3(Math.cos(ang) * triangleR, 0, Math.sin(ang) * triangleR);
    const tangent = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang));
    const speed = 0.38 + i * 0.05;
    const vel = tangent.multiplyScalar(speed * (i === 1 ? 1.06 : i === 2 ? 0.94 : 1));
    applyOrbitTilt(pos, inclinations[i]!, nodes[i]!);
    applyOrbitTilt(vel, inclinations[i]!, nodes[i]!);
    stars.push({
      mass: STAR_MASSES[i]!,
      pos,
      vel,
      acc: new THREE.Vector3(),
    });
  }

  const planet: NBody = {
    mass: PLANET_MASS,
    pos: new THREE.Vector3(0.95, 0.55, -0.8),
    vel: new THREE.Vector3(-0.42, -0.12, 0.68),
    acc: new THREE.Vector3(),
  };
  applyOrbitTilt(planet.pos, 0.33, 0.4);
  applyOrbitTilt(planet.vel, 0.33, 0.4);

  return [...stars, planet];
}

export function computeAccelerations(bodies: NBody[]): void {
  for (const body of bodies) {
    body.acc.set(0, 0, 0);
  }
  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const a = bodies[i]!;
      const b = bodies[j]!;
      _diff.subVectors(b.pos, a.pos);
      const distSq = _diff.lengthSq() + TRISOLARIS_SOFTEN * TRISOLARIS_SOFTEN;
      const invDist3 = 1 / (distSq * Math.sqrt(distSq));
      const scalar = TRISOLARIS_G * invDist3;
      a.acc.addScaledVector(_diff, scalar * b.mass);
      b.acc.addScaledVector(_diff, -scalar * a.mass);
    }
  }
}

export function recenterBarycenter(bodies: NBody[]): void {
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

export function velocityVerletStep(bodies: NBody[], dt: number): void {
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

/** Total kinetic + potential (for debugging / epoch feel). */
export function systemEnergy(bodies: NBody[]): number {
  let kinetic = 0;
  let potential = 0;
  for (const body of bodies) {
    kinetic += 0.5 * body.mass * body.vel.lengthSq();
  }
  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const a = bodies[i]!;
      const b = bodies[j]!;
      _diff.subVectors(b.pos, a.pos);
      const dist = Math.sqrt(_diff.lengthSq() + TRISOLARIS_SOFTEN * TRISOLARIS_SOFTEN);
      potential -= TRISOLARIS_G * a.mass * b.mass / dist;
    }
  }
  return kinetic + potential;
}
