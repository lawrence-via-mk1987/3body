import * as THREE from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

const BASE = import.meta.env.BASE_URL;

export type HeroTextureProfile = 'stone' | 'moss' | 'cloth' | 'clothGrove' | 'clothPredictor';

const PROFILE_PREFIX: Record<HeroTextureProfile, string> = {
  stone: 'hero-stone',
  moss: 'hero-moss',
  cloth: 'hero-cloth',
  clothGrove: 'hero-grove-cloth',
  clothPredictor: 'hero-predictor-cloth',
};

interface LoadedSet {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
}

let ktx2Loader: KTX2Loader | null = null;
const cache = new Map<HeroTextureProfile, Promise<LoadedSet | null>>();

function sharedKtx2Loader(renderer: THREE.WebGLRenderer): KTX2Loader {
  if (!ktx2Loader) {
    ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath(`${BASE}assets/basis/`);
    ktx2Loader.detectSupport(renderer);
  }
  return ktx2Loader;
}

async function loadSet(
  renderer: THREE.WebGLRenderer,
  profile: HeroTextureProfile,
): Promise<LoadedSet | null> {
  const prefix = PROFILE_PREFIX[profile];
  const loader = sharedKtx2Loader(renderer);
  const loadOne = async (suffix: string): Promise<THREE.Texture | null> => {
    try {
      return await loader.loadAsync(`${BASE}assets/textures/${prefix}-${suffix}.ktx2`);
    } catch {
      return null;
    }
  };
  const [map, normalMap, roughnessMap] = await Promise.all([
    loadOne('albedo'),
    loadOne('normal'),
    loadOne('roughness'),
  ]);
  if (!map || !normalMap || !roughnessMap) {
    return null;
  }
  map.colorSpace = THREE.SRGBColorSpace;
  normalMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.colorSpace = THREE.NoColorSpace;
  for (const tex of [map, normalMap, roughnessMap]) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
  }
  return { map, normalMap, roughnessMap };
}

export function preloadHeroTextureSets(renderer: THREE.WebGLRenderer): void {
  for (const profile of Object.keys(PROFILE_PREFIX) as HeroTextureProfile[]) {
    cache.set(profile, loadSet(renderer, profile));
  }
}

async function getSet(profile: HeroTextureProfile): Promise<LoadedSet | null> {
  return (await cache.get(profile)) ?? null;
}

function inferProfile(mesh: THREE.Mesh, rootName: string): HeroTextureProfile {
  const n = `${rootName} ${mesh.name}`.toLowerCase();
  if (n.includes('grove') && (n.includes('keeper') || n.includes('grovekeeper'))) {
    return 'clothGrove';
  }
  if (n.includes('predictor')) {
    return 'clothPredictor';
  }
  if (n.includes('registrar')) {
    return 'cloth';
  }
  if (n.includes('grove') || n.includes('moss') || n.includes('pool')) {
    return 'moss';
  }
  if (n.includes('observatory') || n.includes('pit') || n.includes('rim') || n.includes('dome') || n.includes('trim')) {
    return 'stone';
  }
  return 'stone';
}

/** Assign KTX2 PBR maps to hero glTF meshes (no-op if assets missing). */
export async function applyHeroKtx2Textures(root: THREE.Object3D, renderer: THREE.WebGLRenderer): Promise<void> {
  if (!renderer) {
    return;
  }
  const tasks: Promise<void>[] = [];
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) {
      return;
    }
    const profile = inferProfile(obj, root.name);
    tasks.push((async () => {
      const set = await getSet(profile);
      if (!set) {
        return;
      }
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (!(m instanceof THREE.MeshStandardMaterial)) {
          continue;
        }
        m.map = set.map;
        m.normalMap = set.normalMap;
        m.roughnessMap = set.roughnessMap;
        m.roughness = 1;
        m.metalness = 0.04;
        m.normalScale.set(0.65, 0.65);
        m.needsUpdate = true;
      }
    })());
  });
  await Promise.all(tasks);
}
