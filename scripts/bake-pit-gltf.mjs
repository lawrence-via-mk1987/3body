/**
 * Bakes a partial torus (pit rim with ramp gap) to public/models/dehydration_pit_rim.gltf.
 * Run: node scripts/bake-pit-gltf.mjs
 */
import * as THREE from 'three';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/models');
fs.mkdirSync(outDir, { recursive: true });

const major = 10.28;
const tube = 0.52;
const arc = Math.PI * 2 * 0.92;
const geo = new THREE.TorusGeometry(major, tube, 14, 72, arc);
geo.rotateX(Math.PI / 2);
geo.rotateY(Math.atan2(0 - (-42), 24 - 18) + Math.PI * 0.5);
geo.computeVertexNormals();

const pos = geo.getAttribute('position');
const norm = geo.getAttribute('normal');
const idx = geo.getIndex();

const posArr = new Float32Array(pos.array);
const normArr = new Float32Array(norm.array);
const idxArr = idx ? new Uint16Array(idx.array) : null;

const blob = new Uint8Array(posArr.byteLength + normArr.byteLength + (idxArr?.byteLength ?? 0));
blob.set(new Uint8Array(posArr.buffer), 0);
blob.set(new Uint8Array(normArr.buffer), posArr.byteLength);
let idxOffset = posArr.byteLength + normArr.byteLength;
if (idxArr) {
  blob.set(new Uint8Array(idxArr.buffer), idxOffset);
}

const base64 = Buffer.from(blob).toString('base64');

const gltf = {
  asset: { version: '2.0', generator: '3body bake-pit-gltf' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: 'PitRimRing' }],
  meshes: [{
    name: 'PitRimRing',
    primitives: [{
      attributes: { POSITION: 0, NORMAL: 1 },
      indices: idxArr ? 2 : undefined,
      mode: 4,
    }],
  }],
  accessors: [
    {
      bufferView: 0,
      componentType: 5126,
      count: pos.count,
      type: 'VEC3',
      max: [major + tube, tube, major + tube],
      min: [-(major + tube), -tube, -(major + tube)],
    },
    {
      bufferView: 1,
      componentType: 5126,
      count: norm.count,
      type: 'VEC3',
    },
    ...(idxArr ? [{
      bufferView: 2,
      componentType: 5123,
      count: idxArr.length,
      type: 'SCALAR',
    }] : []),
  ],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: posArr.byteLength, target: 34962 },
    { buffer: 0, byteOffset: posArr.byteLength, byteLength: normArr.byteLength, target: 34962 },
    ...(idxArr ? [{ buffer: 0, byteOffset: idxOffset, byteLength: idxArr.byteLength, target: 34963 }] : []),
  ],
  buffers: [{ byteLength: blob.byteLength, uri: `data:application/octet-stream;base64,${base64}` }],
};

const outPath = path.join(outDir, 'dehydration_pit_rim.gltf');
fs.writeFileSync(outPath, JSON.stringify(gltf));
console.log('Wrote', outPath, blob.byteLength, 'bytes');
