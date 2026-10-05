import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GROVE_LANDMARK, OBSERVATORY_LANDMARK, PIT_LANDMARK } from './landmarks';
import { GROVE_SITE, OBSERVATORY_SITE } from './Terrain';
import type { Terrain } from './Terrain';
import type { Ruins } from './Ruins';
import type { LandmarkWayfinding } from './LandmarkWayfinding';
import type { SettlementNpcs } from './SettlementNpcs';

const BASE = import.meta.env.BASE_URL;

function assetPath(name: string): string {
  return `${BASE}assets/${name}`;
}

function polishHeroRoot(root: THREE.Object3D): void {
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

async function loadHero(name: string): Promise<THREE.Object3D | null> {
  try {
    const gltf = await new GLTFLoader().loadAsync(assetPath(name));
    polishHeroRoot(gltf.scene);
    return gltf.scene;
  } catch {
    return null;
  }
}

/** Path A — authored glTF overlays on procedural landmarks (Pages-friendly). */
export async function attachPathAHeroAssets(
  ruins: Ruins,
  wayfinding: LandmarkWayfinding,
  settlementNpcs: SettlementNpcs,
  terrain: Terrain,
): Promise<void> {
  const pit = await loadHero('pit-rim-hero.gltf');
  if (pit) {
    pit.name = 'PitHeroGltf';
    const y = terrain.getHeightAt(PIT_LANDMARK.x, PIT_LANDMARK.z);
    pit.position.set(PIT_LANDMARK.x, y + 0.35, PIT_LANDMARK.z);
    pit.rotation.y = 0.85;
    pit.scale.setScalar(1.05);
    ruins.group.add(pit);
  }

  const dome = await loadHero('observatory-dome-hero.gltf');
  const trim = await loadHero('observatory-trim-hero.gltf');
  if (dome) {
    dome.name = 'ObservatoryDomeHero';
    const { x, z } = OBSERVATORY_LANDMARK;
    dome.position.set(x, OBSERVATORY_SITE.level + 3.75, z);
    dome.scale.setScalar(1.01);
    ruins.group.add(dome);
  }
  if (trim) {
    trim.name = 'ObservatoryTrimHero';
    const { x, z } = OBSERVATORY_LANDMARK;
    trim.position.set(x, OBSERVATORY_SITE.level, z);
    trim.scale.setScalar(1.01);
    ruins.group.add(trim);
  }

  const groveRim = await loadHero('grove-pool-rim-hero.gltf');
  if (groveRim) {
    groveRim.name = 'GrovePoolRimHero';
    groveRim.position.set(GROVE_LANDMARK.x, GROVE_SITE.level + 0.08, GROVE_LANDMARK.z);
    ruins.groveGroup.add(groveRim);
  }

  const registrar = await loadHero('registrar-hero.gltf');
  if (registrar) {
    registrar.name = 'RegistrarHeroGltf';
    wayfinding.swapRegistrarMesh(registrar);
  }

  const predictor = await loadHero('predictor-hero.gltf');
  if (predictor) {
    predictor.name = 'PredictorHeroGltf';
    settlementNpcs.swapPredictorMesh(predictor);
  }
}
