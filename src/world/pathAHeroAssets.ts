import * as THREE from 'three';
import { GROVE_LANDMARK, OBSERVATORY_LANDMARK, PIT_LANDMARK } from './landmarks';
import { GROVE_SITE, OBSERVATORY_SITE } from './Terrain';
import type { Terrain } from './Terrain';
import type { Ruins } from './Ruins';
import type { LandmarkWayfinding } from './LandmarkWayfinding';
import type { SettlementNpcs } from './SettlementNpcs';
import { loadHeroGltf, polishHeroRoot } from './heroGltfLoader';
import { applyPredictorHeroIdleBases } from './predictorHeroIdle';
import { applyHeroKtx2Textures } from './heroKtx2Textures';

async function loadHero(baseName: string): Promise<THREE.Object3D | null> {
  const loaded = await loadHeroGltf(baseName);
  if (!loaded) {
    return null;
  }
  polishHeroRoot(loaded.scene);
  return loaded.scene;
}

async function loadHeroWithAnimations(
  baseName: string,
): Promise<{ scene: THREE.Object3D; animations: THREE.AnimationClip[] } | null> {
  const loaded = await loadHeroGltf(baseName);
  if (!loaded) {
    return null;
  }
  polishHeroRoot(loaded.scene);
  return loaded;
}

/** Path A — authored glTF overlays on procedural landmarks (Pages-friendly). */
async function textureHero(root: THREE.Object3D | null, renderer: THREE.WebGLRenderer): Promise<void> {
  if (root) {
    await applyHeroKtx2Textures(root, renderer);
  }
}

export async function attachPathAHeroAssets(
  ruins: Ruins,
  wayfinding: LandmarkWayfinding,
  settlementNpcs: SettlementNpcs,
  terrain: Terrain,
  renderer: THREE.WebGLRenderer,
): Promise<void> {
  const pit = await loadHero('pit-rim-hero');
  if (pit) {
    pit.name = 'PitHeroGltf';
    const y = terrain.getHeightAt(PIT_LANDMARK.x, PIT_LANDMARK.z);
    pit.position.set(PIT_LANDMARK.x, y + 0.35, PIT_LANDMARK.z);
    pit.rotation.y = 0.85;
    pit.scale.setScalar(1.05);
    ruins.group.add(pit);
  }

  const dome = await loadHero('observatory-dome-hero');
  const trim = await loadHero('observatory-trim-hero');
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
  if (dome && trim) {
    ruins.setObservatoryShellVisible(false);
  }

  const groveRim = await loadHero('grove-pool-rim-hero');
  if (groveRim) {
    groveRim.name = 'GrovePoolRimHero';
    groveRim.position.set(GROVE_LANDMARK.x, GROVE_SITE.level + 0.08, GROVE_LANDMARK.z);
    ruins.groveGroup.add(groveRim);
  }

  const registrar = await loadHero('registrar-hero');
  if (registrar) {
    registrar.name = 'RegistrarHeroGltf';
    wayfinding.swapRegistrarMesh(registrar);
  }

  const predictorLoad = await loadHeroWithAnimations('predictor-hero');
  if (predictorLoad) {
    predictorLoad.scene.name = 'PredictorHeroGltf';
    applyPredictorHeroIdleBases(predictorLoad.scene);
    settlementNpcs.swapPredictorMesh(predictorLoad.scene, predictorLoad.animations);
  }

  const groveKeeper = await loadHero('grove-keeper-hero');
  if (groveKeeper) {
    groveKeeper.name = 'GroveKeeperHeroGltf';
    settlementNpcs.swapGroveKeeperMesh(groveKeeper);
  }

  await Promise.all([
    textureHero(pit, renderer),
    textureHero(dome, renderer),
    textureHero(trim, renderer),
    textureHero(groveRim, renderer),
    textureHero(registrar, renderer),
    textureHero(predictorLoad?.scene ?? null, renderer),
    textureHero(groveKeeper, renderer),
  ]);
}
