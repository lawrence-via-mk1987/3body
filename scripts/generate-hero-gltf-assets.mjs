/**
 * Path A hero meshes → public/assets/*.gltf
 * Run: npm run assets:heroes
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportGeometryToGltf } from './gltf-export-util.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/assets');
fs.mkdirSync(outDir, { recursive: true });

const stoneMat = {
  name: 'HeroStone',
  pbrMetallicRoughness: {
    baseColorFactor: [0.52, 0.48, 0.42, 1],
    metallicFactor: 0.05,
    roughnessFactor: 0.82,
  },
};

const basaltMat = {
  name: 'HeroBasalt',
  pbrMetallicRoughness: {
    baseColorFactor: [0.48, 0.43, 0.38, 1],
    metallicFactor: 0.06,
    roughnessFactor: 0.88,
  },
};

const mossStoneMat = {
  name: 'HeroMossStone',
  pbrMetallicRoughness: {
    baseColorFactor: [0.42, 0.46, 0.38, 1],
    metallicFactor: 0.04,
    roughnessFactor: 0.78,
  },
};

const clothMat = {
  name: 'HeroCloth',
  pbrMetallicRoughness: {
    baseColorFactor: [0.78, 0.72, 0.62, 1],
    metallicFactor: 0.02,
    roughnessFactor: 0.92,
  },
};

const predictorClothMat = {
  name: 'PredictorCloth',
  pbrMetallicRoughness: {
    baseColorFactor: [0.62, 0.58, 0.52, 1],
    metallicFactor: 0.02,
    roughnessFactor: 0.9,
  },
};

// Pit rim
{
  const geo = new THREE.TorusGeometry(9.2, 0.55, 10, 48, Math.PI * 1.35);
  geo.rotateX(Math.PI / 2);
  const bytes = exportGeometryToGltf(geo, {
    outPath: path.join(outDir, 'pit-rim-hero.gltf'),
    meshName: 'PitRimHero',
    material: basaltMat,
  });
  console.log(`pit-rim-hero.gltf (${bytes} bytes)`);
  geo.dispose();
}

// Observatory dome (collapsed wedge — matches Ruins gap)
{
  const gap = 1.38;
  const outer = new THREE.SphereGeometry(4.7, 32, 16, Math.PI + gap / 2, Math.PI * 2 - gap, 0, Math.PI * 0.5);
  const bytes = exportGeometryToGltf(outer, {
    outPath: path.join(outDir, 'observatory-dome-hero.gltf'),
    meshName: 'ObservatoryDomeHero',
    material: stoneMat,
  });
  console.log(`observatory-dome-hero.gltf (${bytes} bytes)`);
  outer.dispose();
}

// Grove pool coping ring
{
  const geo = new THREE.TorusGeometry(3.95, 0.32, 12, 56);
  geo.rotateX(Math.PI / 2);
  const bytes = exportGeometryToGltf(geo, {
    outPath: path.join(outDir, 'grove-pool-rim-hero.gltf'),
    meshName: 'GrovePoolRimHero',
    material: mossStoneMat,
  });
  console.log(`grove-pool-rim-hero.gltf (${bytes} bytes)`);
  geo.dispose();
}

// Registrar — merged lathe robe + cowl + scroll (static hero mesh)
{
  const robeProfile = [
    new THREE.Vector2(0.42, 0.04),
    new THREE.Vector2(0.36, 0.4),
    new THREE.Vector2(0.22, 0.98),
    new THREE.Vector2(0.28, 1.28),
    new THREE.Vector2(0.24, 1.5),
    new THREE.Vector2(0.13, 1.64),
  ];
  const robe = new THREE.LatheGeometry(robeProfile, 20);
  const cowl = new THREE.LatheGeometry(
    [new THREE.Vector2(0.34, 0), new THREE.Vector2(0.4, 0.1), new THREE.Vector2(0.22, 0.24)],
    16,
  );
  cowl.translate(0, 1.52, 0);
  const scroll = new THREE.CylinderGeometry(0.045, 0.045, 0.3, 12);
  scroll.rotateZ(Math.PI / 2);
  scroll.translate(0.22, 1.05, 0.12);
  const merged = mergeGeometries([robe, cowl, scroll]);
  merged.translate(0, -0.02, 0);
  const bytes = exportGeometryToGltf(merged, {
    outPath: path.join(outDir, 'registrar-hero.gltf'),
    meshName: 'RegistrarHero',
    material: clothMat,
  });
  console.log(`registrar-hero.gltf (${bytes} bytes)`);
  robe.dispose();
  cowl.dispose();
  scroll.dispose();
  merged.dispose();
}

// Observatory drum trim — string courses, lintel, threshold (local Y relative to site level)
{
  const parts = [];
  for (const y of [1.6, 3.75]) {
    const ring = new THREE.TorusGeometry(y === 1.6 ? 4.78 : 4.68, y === 1.6 ? 0.09 : 0.1, 8, 44);
    ring.rotateX(Math.PI / 2);
    ring.translate(0, y, 0);
    parts.push(ring);
  }
  const lintel = new THREE.BoxGeometry(2.6, 0.45, 0.85);
  lintel.translate(0, 3.3, 4.72);
  parts.push(lintel);
  for (const side of [-1, 1]) {
    const jamb = new THREE.BoxGeometry(0.5, 2.6, 0.75);
    jamb.translate(side * 1.05, 1.75, 4.65);
    parts.push(jamb);
  }
  for (let i = 0; i < 2; i += 1) {
    const step = new THREE.BoxGeometry(2.6, 0.22, 0.65);
    step.translate(0, 0.28 - i * 0.14, 5.85 + i * 0.55);
    parts.push(step);
  }
  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  const bytes = exportGeometryToGltf(merged, {
    outPath: path.join(outDir, 'observatory-trim-hero.gltf'),
    meshName: 'ObservatoryTrimHero',
    material: stoneMat,
  });
  console.log(`observatory-trim-hero.gltf (${bytes} bytes)`);
  merged.dispose();
}

// Last Predictor — robe + staff + armillary rings (static hero)
{
  const robeProfile = [
    new THREE.Vector2(0.4, 0.04),
    new THREE.Vector2(0.34, 0.42),
    new THREE.Vector2(0.2, 1.0),
    new THREE.Vector2(0.26, 1.32),
    new THREE.Vector2(0.22, 1.52),
    new THREE.Vector2(0.12, 1.62),
  ];
  const robe = new THREE.LatheGeometry(robeProfile, 20);
  robe.rotateZ(0.12);
  const cowl = new THREE.LatheGeometry(
    [new THREE.Vector2(0.32, 0), new THREE.Vector2(0.38, 0.12), new THREE.Vector2(0.2, 0.26)],
    16,
  );
  cowl.translate(0, 1.48, 0);
  cowl.rotateZ(0.18);
  const staff = new THREE.CylinderGeometry(0.032, 0.038, 1.65, 8);
  staff.translate(0.28, 0.82, 0.08);
  staff.rotateZ(0.15);
  const ring1 = new THREE.TorusGeometry(0.17, 0.014, 8, 24);
  ring1.translate(0.28, 1.38, 0.08);
  ring1.rotateX(Math.PI / 2);
  const ring2 = new THREE.TorusGeometry(0.12, 0.012, 8, 20);
  ring2.translate(0.28, 1.38, 0.08);
  ring2.rotateX(1.05);
  ring2.rotateZ(0.4);
  const merged = mergeGeometries([robe, cowl, staff, ring1, ring2]);
  merged.translate(0, -0.02, 0);
  const bytes = exportGeometryToGltf(merged, {
    outPath: path.join(outDir, 'predictor-hero.gltf'),
    meshName: 'PredictorHero',
    material: predictorClothMat,
  });
  console.log(`predictor-hero.gltf (${bytes} bytes)`);
  robe.dispose();
  cowl.dispose();
  staff.dispose();
  ring1.dispose();
  ring2.dispose();
  merged.dispose();
}
