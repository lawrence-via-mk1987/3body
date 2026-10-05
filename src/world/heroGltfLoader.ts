import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const BASE = import.meta.env.BASE_URL;

let dracoLoader: DRACOLoader | null = null;
let gltfLoader: GLTFLoader | null = null;

function decoderPath(): string {
  return `${BASE}assets/draco/gltf/`;
}

function sharedLoader(): GLTFLoader {
  if (!gltfLoader) {
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(decoderPath());
    gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
  }
  return gltfLoader;
}

export interface HeroGltfResult {
  scene: THREE.Object3D;
  animations: THREE.AnimationClip[];
}

/** Prefer Draco `.glb`, then plain `.glb`, then `.gltf`. */
export async function loadHeroGltf(baseName: string): Promise<HeroGltfResult | null> {
  const loader = sharedLoader();
  const candidates = [`${baseName}.glb`, `${baseName}.gltf`];
  for (const file of candidates) {
    try {
      const gltf = await loader.loadAsync(`${BASE}assets/${file}`);
      return { scene: gltf.scene, animations: gltf.animations ?? [] };
    } catch {
      // try next extension
    }
  }
  return null;
}

export function polishHeroRoot(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) {
      return;
    }
    obj.castShadow = true;
    obj.receiveShadow = true;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (m instanceof THREE.MeshStandardMaterial) {
        m.envMapIntensity = 1.05;
        m.polygonOffset = true;
        m.polygonOffsetFactor = -1;
        m.polygonOffsetUnits = -2;
      }
    }
  });
}
