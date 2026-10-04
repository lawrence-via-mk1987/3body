import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PIT_LANDMARK } from './landmarks';
import { PIT_SITE } from './Terrain';

const PIT_RIM_URL = `${import.meta.env.BASE_URL}models/dehydration_pit_rim.gltf`;

/**
 * Loads the baked partial torus rim and parents it under the ruins group.
 * Procedural rim blocks in `Ruins.buildDehydrationPit` are omitted when this succeeds.
 */
export async function attachDehydrationPitRim(
  parent: THREE.Group,
  stone: THREE.MeshStandardMaterial,
  onLoadFailed?: () => void,
): Promise<THREE.Object3D | null> {
  try {
    const gltf = await new GLTFLoader().loadAsync(PIT_RIM_URL);
    const root = gltf.scene;
    root.position.set(PIT_LANDMARK.x, PIT_SITE.rim + 0.18, PIT_LANDMARK.z);
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.material = stone;
      }
    });
    parent.add(root);
    return root;
  } catch (error) {
    console.warn('[PitGltfRim] Failed to load pit rim; using procedural blocks only.', error);
    onLoadFailed?.();
    return null;
  }
}
