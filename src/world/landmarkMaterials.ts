import * as THREE from 'three';
import {
  createClothTextures,
  createStoneTextures,
  createWoodTextures,
  type GroundTextureSet,
} from './proceduralTextures';
import { makeTriplanar } from './triplanar';

export interface LandmarkMaterials {
  /** Weathered basalt, triplanar — boulders, rims, walls, dome. */
  stone: THREE.MeshStandardMaterial;
  /** Soot-darkened basalt, triplanar — interiors, fire rings, old masonry. */
  stoneDark: THREE.MeshStandardMaterial;
  /** Pale limestone, triplanar — the waystone and flagstones. */
  stonePale: THREE.MeshStandardMaterial;
  /** Bleached timber, UV mapped along posts and beams. */
  wood: THREE.MeshStandardMaterial;
  /** Heavy ochre cloth for banners and awnings. */
  cloth: THREE.MeshStandardMaterial;
  /** Dehydrated hide — the folded rows in the pit. */
  hide: THREE.MeshStandardMaterial;
  bronze: THREE.MeshStandardMaterial;
  ember: THREE.MeshStandardMaterial;
  charcoal: THREE.MeshStandardMaterial;
  dispose(): void;
}

let cached: LandmarkMaterials | null = null;

function applySet(material: THREE.MeshStandardMaterial, set: GroundTextureSet, normalScale: number): void {
  material.map = set.albedo;
  material.normalMap = set.normal;
  material.roughnessMap = set.roughness;
  material.aoMap = set.ao;
  material.aoMapIntensity = 1;
  material.normalScale.set(normalScale, normalScale);
}

/**
 * Lazily bakes the shared prop materials once per session. Every landmark reuses these so
 * the whole built environment compiles a handful of shader programs.
 */
export function getLandmarkMaterials(textureSize: number, anisotropy: number): LandmarkMaterials {
  if (cached) {
    return cached;
  }
  const stoneSet = createStoneTextures(textureSize, anisotropy);
  const woodSet = createWoodTextures(Math.max(256, textureSize / 2), anisotropy);
  const clothSet = createClothTextures(256, anisotropy, '#8a6a46', '#5a4030');
  const hideSet = createClothTextures(256, anisotropy, '#6e5a44', '#3c2c20');

  const stone = new THREE.MeshStandardMaterial({ color: '#cfc3b3', roughness: 1, metalness: 0 });
  applySet(stone, stoneSet, 1.1);
  makeTriplanar(stone, 2.2);

  const stoneDark = new THREE.MeshStandardMaterial({ color: '#6e625a', roughness: 1, metalness: 0, side: THREE.DoubleSide });
  applySet(stoneDark, stoneSet, 1.0);
  makeTriplanar(stoneDark, 1.8);

  const stonePale = new THREE.MeshStandardMaterial({ color: '#eee2cc', roughness: 1, metalness: 0 });
  applySet(stonePale, stoneSet, 0.8);
  makeTriplanar(stonePale, 1.4);

  const wood = new THREE.MeshStandardMaterial({ color: '#c8b494', roughness: 1, metalness: 0 });
  applySet(wood, woodSet, 0.9);

  const cloth = new THREE.MeshStandardMaterial({ color: '#d8c0a0', roughness: 1, metalness: 0, side: THREE.DoubleSide });
  applySet(cloth, clothSet, 0.6);
  cloth.map!.repeat.set(2, 2);
  cloth.normalMap!.repeat.set(2, 2);
  cloth.roughnessMap!.repeat.set(2, 2);

  const hide = new THREE.MeshStandardMaterial({ color: '#c4b098', roughness: 1, metalness: 0, side: THREE.DoubleSide });
  applySet(hide, hideSet, 0.5);

  const bronze = new THREE.MeshStandardMaterial({
    color: '#8c6a3a',
    roughness: 0.42,
    metalness: 0.85,
  });

  const ember = new THREE.MeshStandardMaterial({
    color: '#ff9a4a',
    emissive: '#ff5a18',
    emissiveIntensity: 1.6,
    roughness: 0.7,
  });

  const charcoal = new THREE.MeshStandardMaterial({ color: '#17120f', roughness: 1 });

  cached = {
    stone,
    stoneDark,
    stonePale,
    wood,
    cloth,
    hide,
    bronze,
    ember,
    charcoal,
    dispose() {
      for (const set of [stoneSet, woodSet, clothSet, hideSet]) {
        set.albedo.dispose();
        set.normal.dispose();
        set.roughness.dispose();
      }
      for (const mat of [stone, stoneDark, stonePale, wood, cloth, hide, bronze, ember, charcoal]) {
        mat.dispose();
      }
      cached = null;
    },
  };
  return cached;
}
