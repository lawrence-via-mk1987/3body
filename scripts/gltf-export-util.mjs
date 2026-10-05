import fs from 'node:fs';

/** Write a single-mesh glTF 2.0 JSON with embedded base64 buffer. */
export function exportGeometryToGltf(geo, { outPath, meshName, material }) {
  geo.computeVertexNormals();

  const pos = new Float32Array(geo.attributes.position.array);
  const nor = new Float32Array(geo.attributes.normal.array);
  const idx = geo.index ? new Uint16Array(geo.index.array) : null;

  const posBytes = Buffer.from(pos.buffer);
  const norBytes = Buffer.from(nor.buffer);
  const idxBytes = idx ? Buffer.from(idx.buffer) : Buffer.alloc(0);

  const bin = Buffer.concat([posBytes, norBytes, idxBytes]);
  const binB64 = bin.toString('base64');

  const posMin = [Infinity, Infinity, Infinity];
  const posMax = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) {
    for (let j = 0; j < 3; j += 1) {
      posMin[j] = Math.min(posMin[j], pos[i + j]);
      posMax[j] = Math.max(posMax[j], pos[i + j]);
    }
  }

  const posView = { buffer: 0, byteOffset: 0, byteLength: posBytes.length };
  const norView = { buffer: 0, byteOffset: posBytes.length, byteLength: norBytes.length };
  const idxView = idx
    ? { buffer: 0, byteOffset: posBytes.length + norBytes.length, byteLength: idxBytes.length }
    : null;

  const accessors = [
    {
      bufferView: 0,
      componentType: 5126,
      count: pos.length / 3,
      type: 'VEC3',
      min: posMin,
      max: posMax,
    },
    {
      bufferView: 1,
      componentType: 5126,
      count: nor.length / 3,
      type: 'VEC3',
    },
  ];

  const bufferViews = [
    { ...posView, target: 34962 },
    { ...norView, target: 34962 },
  ];

  const primitive = {
    attributes: { POSITION: 0, NORMAL: 1 },
    material: 0,
  };

  if (idx && idxView) {
    accessors.push({
      bufferView: 2,
      componentType: 5123,
      count: idx.length,
      type: 'SCALAR',
    });
    bufferViews.push({ ...idxView, target: 34963 });
    primitive.indices = 2;
  }

  const gltf = {
    asset: { version: '2.0', generator: '3body-hero-gltf-script' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: meshName }],
    meshes: [{ name: meshName, primitives: [primitive] }],
    materials: [material],
    accessors,
    bufferViews,
    buffers: [{ byteLength: bin.length, uri: `data:application/octet-stream;base64,${binB64}` }],
  };

  fs.writeFileSync(outPath, JSON.stringify(gltf));
  return fs.statSync(outPath).size;
}
