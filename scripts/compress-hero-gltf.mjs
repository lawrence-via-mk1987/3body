/**
 * Draco-compress hero glTF/GLB assets → sibling `.glb` (preferred by heroGltfLoader).
 * Run after: npm run assets:heroes
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { draco, dedup, prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetDir = path.join(__dirname, '../public/assets');

const HERO_BASES = [
  'pit-rim-hero',
  'observatory-dome-hero',
  'observatory-trim-hero',
  'grove-pool-rim-hero',
  'registrar-hero',
  'predictor-hero',
  'grove-keeper-hero',
];

const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression])
  .registerDependencies({
    'draco3d.encoder': await draco3d.createEncoderModule(),
  });

for (const base of HERO_BASES) {
  const gltfPath = path.join(assetDir, `${base}.gltf`);
  if (!fs.existsSync(gltfPath)) {
    console.warn(`skip ${base}: missing ${gltfPath}`);
    continue;
  }
  const doc = await io.read(gltfPath);
  await doc.transform(dedup(), prune(), draco({ method: 'edgebreaker' }));
  const outPath = path.join(assetDir, `${base}.glb`);
  await io.write(outPath, doc);
  const bytes = fs.statSync(outPath).size;
  console.log(`${base}.glb (${bytes} bytes, Draco)`);
}
