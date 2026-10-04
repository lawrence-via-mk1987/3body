import * as THREE from 'three';
import { createClothTextures, type GroundTextureSet } from './proceduralTextures';

export interface HumanoidNpcStyle {
  skin: string;
  robe: string;
  accent: string;
  accentEmissive: string;
  footRing: number;
}

/** Where the hands sit, and therefore what the silhouette says before you can see a face. */
export type NpcPosture = 'upright' | 'skyward' | 'tending';

export interface HumanoidHands {
  left: THREE.Object3D;
  right: THREE.Object3D;
  /** Waist, in front — baskets and sashes hang here. */
  belt: THREE.Object3D;
}

const GLOW_TAG = 'npcGlow';

let robeTextures: GroundTextureSet | null = null;

function sharedRobeTextures(): GroundTextureSet {
  robeTextures ??= createClothTextures(256, 4, '#e4dcd0', '#8a8072');
  return robeTextures;
}

function robeMaterial(color: string): THREE.MeshStandardMaterial {
  const tex = sharedRobeTextures();
  const mat = new THREE.MeshStandardMaterial({
    color,
    map: tex.albedo,
    normalMap: tex.normal,
    roughnessMap: tex.roughness,
    roughness: 1,
    normalScale: new THREE.Vector2(0.5, 0.5),
  });
  return mat;
}

/** Heavy robe: wide at the hem, cinched at the waist, with folds stronger toward the ground. */
function makeRobeGeometry(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.42, 0.04),
    new THREE.Vector2(0.36, 0.4),
    new THREE.Vector2(0.22, 0.98),
    new THREE.Vector2(0.28, 1.28),
    new THREE.Vector2(0.24, 1.5),
    new THREE.Vector2(0.13, 1.64),
  ];
  const geo = new THREE.LatheGeometry(profile, 18);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const radial = Math.hypot(x, z) || 1;
    const ang = Math.atan2(x, z);
    const hem = THREE.MathUtils.clamp((1.5 - y) / 1.5, 0, 1);
    const fold = Math.sin(ang * 6) * 0.03 * (0.3 + hem) + Math.sin(ang * 2.5 + 0.8) * 0.016;
    const nr = radial + fold;
    pos.setXYZ(i, (x / radial) * nr, y, (z / radial) * nr);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function makeCowlGeometry(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.34, 0),
    new THREE.Vector2(0.4, 0.1),
    new THREE.Vector2(0.22, 0.24),
  ];
  return new THREE.LatheGeometry(profile, 16);
}

/**
 * A settler in heavy climate cloth. The hood leaves only a dark opening where the face
 * would be; the hands and what they hold carry the role. About 1.85 m tall, matching the
 * player's eye line. `posture` poses the arms and the tilt of the hood.
 */
export function buildHumanoidNpc(
  style: HumanoidNpcStyle,
  posture: NpcPosture,
  attachProp?: (hands: HumanoidHands) => void,
): THREE.Group {
  const figure = new THREE.Group();
  figure.userData.idleSeed = Math.random() * Math.PI * 2;

  const robe = robeMaterial(style.robe);
  const skin = new THREE.MeshStandardMaterial({ color: style.skin, roughness: 0.72 });
  const sashMat = new THREE.MeshStandardMaterial({
    color: style.accent,
    emissive: style.accentEmissive,
    emissiveIntensity: 0.35,
    roughness: 0.6,
  });
  sashMat.userData[GLOW_TAG] = true;

  const body = new THREE.Group();
  body.name = 'body';
  body.userData.baseX = posture === 'tending' ? 0.28 : 0;
  body.rotation.x = body.userData.baseX as number;

  const gown = new THREE.Mesh(makeRobeGeometry(), robe);
  gown.castShadow = true;
  gown.receiveShadow = true;

  const cowl = new THREE.Mesh(makeCowlGeometry(), robe);
  cowl.position.y = 1.4;
  cowl.castShadow = true;

  const sash = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 6, 18), sashMat);
  sash.position.y = 1.02;
  sash.rotation.x = Math.PI / 2;

  const head = new THREE.Group();
  head.name = 'head';
  head.position.y = 1.66;
  head.userData.baseX = posture === 'skyward' ? -0.2 : posture === 'tending' ? 0.35 : 0;
  head.rotation.x = head.userData.baseX as number;

  // Hood shell open toward +Z. SphereGeometry: z = sin(phi) sin(theta), so +Z is phi = π/2.
  const opening = 1.9;
  const hood = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 14, 12, Math.PI / 2 + opening / 2, Math.PI * 2 - opening, 0.25, Math.PI * 0.62),
    robe,
  );
  hood.castShadow = true;
  const face = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 10, 8),
    new THREE.MeshStandardMaterial({ color: '#1c1410', roughness: 1 }),
  );
  face.position.set(0, -0.02, 0.06);
  face.scale.set(1, 1.15, 0.8);
  // Cloth band across the opening, so the face reads as a shadowed slit.
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.07), robe);
  veil.position.set(0, -0.07, 0.15);
  head.add(hood, face, veil);

  const armL = makeArm(-1, robe, skin, posture);
  const armR = makeArm(1, robe, skin, posture);

  const belt = new THREE.Object3D();
  belt.name = 'belt';
  belt.position.set(0, 1.0, 0.24);

  body.add(gown, cowl, sash, head, armL, armR, belt);
  figure.add(body);

  const footRing = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.72, 24),
    new THREE.MeshBasicMaterial({
      color: style.footRing,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    }),
  );
  footRing.rotation.x = -Math.PI / 2;
  footRing.position.y = 0.03;
  figure.add(footRing);

  attachProp?.({
    left: armL.getObjectByName('handL')!,
    right: armR.getObjectByName('handR')!,
    belt,
  });

  return figure;
}

function makeArm(
  side: -1 | 1,
  robe: THREE.Material,
  skin: THREE.Material,
  posture: NpcPosture,
): THREE.Group {
  const arm = new THREE.Group();
  arm.name = side < 0 ? 'armL' : 'armR';
  arm.position.set(side * 0.3, 1.46, 0);

  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.56, 8), robe);
  sleeve.position.y = -0.3;
  sleeve.castShadow = true;
  const oversleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.28, 8), robe);
  oversleeve.position.y = -0.16;
  oversleeve.castShadow = true;

  const handMesh = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), skin);
  handMesh.scale.set(0.85, 0.65, 1.2);
  handMesh.position.y = -0.6;
  handMesh.castShadow = true;

  const hand = new THREE.Object3D();
  hand.name = side < 0 ? 'handL' : 'handR';
  hand.position.y = -0.6;

  arm.add(sleeve, oversleeve, handMesh, hand);

  // Rest pose. Local -Y runs down the sleeve; negative rotation.x brings the hand forward.
  let pitch = -0.15;
  let inward = side * -0.12;
  if (posture === 'upright') {
    // Right hand holds the record against the chest; the left is raised, counting.
    pitch = side > 0 ? -1.05 : -0.6;
    inward = side > 0 ? -0.5 : 0.4;
  } else if (posture === 'skyward') {
    // The staff hand rests low; the other hangs.
    pitch = side > 0 ? -0.4 : -0.15;
    inward = side > 0 ? -0.18 : 0.1;
  } else {
    // Both hands forward and low, working the cuttings.
    pitch = -0.6;
    inward = side * -0.35;
  }
  arm.userData.baseX = pitch;
  arm.rotation.x = pitch;
  arm.rotation.z = inward;
  return arm;
}

/** Re-pose an existing figure without rebuilding geometry. */
export function applyHumanoidPosture(root: THREE.Object3D, posture: NpcPosture): void {
  const body = root.getObjectByName('body');
  if (body) {
    body.userData.baseX = posture === 'tending' ? 0.28 : 0;
    body.rotation.x = body.userData.baseX as number;
  }
  const head = root.getObjectByName('head');
  if (head) {
    head.userData.baseX = posture === 'skyward' ? -0.2 : posture === 'tending' ? 0.35 : 0;
    head.rotation.x = head.userData.baseX as number;
  }
  for (const side of [-1, 1] as const) {
    const arm = root.getObjectByName(side < 0 ? 'armL' : 'armR');
    if (!arm) {
      continue;
    }
    let pitch = -0.15;
    let inward = side * -0.12;
    if (posture === 'upright') {
      pitch = side > 0 ? -1.05 : -0.6;
      inward = side > 0 ? -0.5 : 0.4;
    } else if (posture === 'skyward') {
      pitch = side > 0 ? -0.4 : -0.15;
      inward = side > 0 ? -0.18 : 0.1;
    } else {
      pitch = -0.6;
      inward = side * -0.35;
    }
    arm.userData.baseX = pitch;
    arm.rotation.x = pitch;
    arm.rotation.z = inward;
  }
}

/** Slow breathing, a sway, and a small turn of the hood. Safe to call every frame. */
export function stepHumanoidIdle(root: THREE.Object3D, time: number): void {
  let seed = root.userData.idleSeed as number | undefined;
  if (seed === undefined) {
    root.traverse((obj) => {
      if (seed === undefined && typeof obj.userData.idleSeed === 'number') {
        seed = obj.userData.idleSeed as number;
      }
    });
  }
  seed ??= 0;
  const body = root.getObjectByName('body');
  if (body) {
    body.rotation.x = (body.userData.baseX as number) + Math.sin(time * 0.9 + seed) * 0.012;
    body.rotation.z = Math.sin(time * 0.55 + seed) * 0.018;
    body.position.y = Math.sin(time * 1.3 + seed) * 0.008;
  }
  const head = root.getObjectByName('head');
  if (head) {
    head.rotation.x = (head.userData.baseX as number) + Math.sin(time * 0.7 + seed) * 0.02;
    head.rotation.y = Math.sin(time * 0.4 + seed) * 0.1;
  }
  for (const name of ['armL', 'armR']) {
    const arm = root.getObjectByName(name);
    if (!arm) {
      continue;
    }
    arm.rotation.x = (arm.userData.baseX as number)
      + Math.sin(time * 0.8 + seed + (name === 'armL' ? 1.4 : 0)) * 0.03;
  }
}

export function applyNpcGlow(root: THREE.Object3D, intensity: number): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) {
      return;
    }
    const mat = obj.material;
    const materials = Array.isArray(mat) ? mat : [mat];
    for (const m of materials) {
      if (m instanceof THREE.MeshStandardMaterial && m.userData[GLOW_TAG]) {
        m.emissiveIntensity = intensity;
      }
    }
  });
}

export const REGISTRAR_STYLE: HumanoidNpcStyle = {
  skin: '#c4a48c',
  robe: '#a07858',
  accent: '#c28a5a',
  accentEmissive: '#8a4a20',
  footRing: 0xc28a5a,
};

export const PREDICTOR_STYLE: HumanoidNpcStyle = {
  skin: '#b89880',
  robe: '#7e92a6',
  accent: '#8ec8ff',
  accentEmissive: '#2a5a88',
  footRing: 0x6aa8d8,
};

export const GROVE_KEEPER_STYLE: HumanoidNpcStyle = {
  skin: '#c6a07a',
  robe: '#6e8a52',
  accent: '#8ab86a',
  accentEmissive: '#2a5018',
  footRing: 0x7aa86a,
};
