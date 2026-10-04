import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PIT_LANDMARK } from './landmarks';
import type { Terrain } from './Terrain';

const ASSET_PATH = `${import.meta.env.BASE_URL}assets/pit-rim-hero.gltf`;

/** Optional authored rim segment; procedural pit remains if load fails. */
export async function attachPitHeroGltf(
  parent: THREE.Group,
  terrain: Terrain,
): Promise<THREE.Object3D | null> {
  try {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(ASSET_PATH);
    const root = gltf.scene;
    root.name = 'PitHeroGltf';

    const y = terrain.getHeightAt(PIT_LANDMARK.x, PIT_LANDMARK.z);
    root.position.set(PIT_LANDMARK.x, y + 0.35, PIT_LANDMARK.z);
    root.rotation.y = 0.85;
    root.scale.setScalar(1.05);

    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        const m = obj.material;
        if (m instanceof THREE.MeshStandardMaterial) {
          m.envMapIntensity = 0.85;
        }
      }
    });

    parent.add(root);
    return root;
  } catch {
    return null;
  }
}
