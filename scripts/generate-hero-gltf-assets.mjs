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
