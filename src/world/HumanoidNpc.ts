import * as THREE from 'three';

export interface HumanoidNpcStyle {
  skin: string;
  skinEmissive: string;
  robe: string;
  robeEmissive: string;
  accent: string;
  accentEmissive: string;
  footRing: number;
}

const GLOW_TAG = 'npcGlow';

function skinMat(style: HumanoidNpcStyle, emissiveIntensity = 0.35): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: style.skin,
    roughness: 0.88,
    emissive: style.skinEmissive,
    emissiveIntensity,
  });
  mat.userData[GLOW_TAG] = true;
  return mat;
}

function robeMat(style: HumanoidNpcStyle): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: style.robe,
    roughness: 0.95,
    emissive: style.robeEmissive,
    emissiveIntensity: 0.22,
  });
  mat.userData[GLOW_TAG] = true;
  return mat;
}

/** Low-poly standing figure — readable on mobile at settlement distances. */
export function buildHumanoidNpc(
  style: HumanoidNpcStyle,
  attachProp?: (figure: THREE.Group) => void,
): THREE.Group {
  const figure = new THREE.Group();
  const skin = skinMat(style);
  const robe = robeMat(style);

  const legGeo = new THREE.CapsuleGeometry(0.13, 0.72, 4, 8);
  const leftLeg = new THREE.Mesh(legGeo, skin);
  leftLeg.position.set(-0.16, 0.52, 0);
  const rightLeg = new THREE.Mesh(legGeo, skin);
  rightLeg.position.set(0.16, 0.52, 0);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.62, 0.28), skin);
  torso.position.y = 1.18;

  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.3), skin);
  shoulders.position.y = 1.48;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), skin);
  head.position.y = 1.82;

  const armGeo = new THREE.CapsuleGeometry(0.09, 0.52, 4, 8);
  const leftArm = new THREE.Mesh(armGeo, skin);
  leftArm.position.set(-0.38, 1.22, 0.06);
  leftArm.rotation.z = 0.22;
  const rightArm = new THREE.Mesh(armGeo, skin);
  rightArm.position.set(0.38, 1.22, 0.06);
  rightArm.rotation.z = -0.22;

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.52, 0.78, 10), robe);
  skirt.position.y = 0.72;

  const mantle = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 0.2, 10), robe);
  mantle.position.y = 1.38;

  for (const part of [leftLeg, rightLeg, skirt, torso, shoulders, leftArm, rightArm, head, mantle]) {
    part.castShadow = true;
    part.receiveShadow = true;
  }

  figure.add(leftLeg, rightLeg, skirt, torso, shoulders, leftArm, rightArm, head, mantle);

  attachProp?.(figure);

  const footRing = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.25, 28),
    new THREE.MeshBasicMaterial({
      color: style.footRing,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    }),
  );
  footRing.rotation.x = -Math.PI / 2;
  footRing.position.y = 0.04;
  figure.add(footRing);

  return figure;
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
  skin: '#8a6858',
  skinEmissive: '#3a2018',
  robe: '#6a4838',
  robeEmissive: '#2a1810',
  accent: '#c28a5a',
  accentEmissive: '#ffa060',
  footRing: 0xffa060,
};

export const PREDICTOR_STYLE: HumanoidNpcStyle = {
  skin: '#6a7888',
  skinEmissive: '#1a2838',
  robe: '#4a5868',
  robeEmissive: '#1a2430',
  accent: '#8ec8ff',
  accentEmissive: '#4a88b8',
  footRing: 0x8ec8ff,
};

export const GROVE_KEEPER_STYLE: HumanoidNpcStyle = {
  skin: '#7a8868',
  skinEmissive: '#2a3820',
  robe: '#5a7048',
  robeEmissive: '#2a4020',
  accent: '#8ab86a',
  accentEmissive: '#4a7840',
  footRing: 0x8ab86a,
};
