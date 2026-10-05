/** Shared CPU samplers for hero PNG/KTX2 generation (mirrors proceduralTextures style). */

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smoothNoise(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0);
  const b = hash2(x0 + 1, y0);
  const c = hash2(x0, y0 + 1);
  const d = hash2(x0 + 1, y0 + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function tileableFbm(u, v, octaves, baseFreq) {
  let value = 0;
  let amp = 0.5;
  let freq = baseFreq;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    const ang = u * Math.PI * 2;
    const ang2 = v * Math.PI * 2;
    const nx = Math.cos(ang) * freq;
    const ny = Math.sin(ang) * freq;
    const nz = Math.cos(ang2) * freq;
    const nw = Math.sin(ang2) * freq;
    value += smoothNoise(nx + nz * 1.7, ny + nw * 1.3) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return value / norm;
}

function parseHex(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function sampleStone(u, v) {
  const n = tileableFbm(u, v, 5, 2.2);
  const grit = tileableFbm(u * 3.1 + 0.2, v * 3.1, 3, 6);
  const base = parseHex('#8a8078');
  const dark = parseHex('#5c5650');
  const r = lerp(dark.r, base.r, n * 0.85 + grit * 0.15);
  const g = lerp(dark.g, base.g, n * 0.85 + grit * 0.15);
  const b = lerp(dark.b, base.b, n * 0.85 + grit * 0.15);
  const rough = 0.72 + grit * 0.22;
  return { r, g, b, height: n, roughness: rough };
}

function sampleMossStone(u, v) {
  const s = sampleStone(u, v);
  const moss = tileableFbm(u * 2.4 + 1.1, v * 2.4, 4, 4);
  s.g += moss * 28;
  s.r -= moss * 8;
  s.roughness *= 0.92 - moss * 0.08;
  return s;
}

function sampleCloth(u, v, baseHex, threadHex) {
  const base = parseHex(baseHex);
  const thread = parseHex(threadHex);
  const weaveU = Math.sin(u * Math.PI * 2 * 48) * 0.5 + 0.5;
  const weaveV = Math.sin(v * Math.PI * 2 * 36) * 0.5 + 0.5;
  const weave = weaveU * 0.55 + weaveV * 0.45;
  const fold = tileableFbm(u, v, 3, 3.5);
  const t = weave * 0.35 + fold * 0.65;
  const r = lerp(base.r, thread.r, t);
  const g = lerp(base.g, thread.g, t);
  const b = lerp(base.b, thread.b, t);
  return { r, g, b, height: fold, roughness: 0.88 + weave * 0.08 };
}

export function fillHeroPixels(size, sampler) {
  const rgba = new Uint8Array(size * size * 4);
  const height = new Float32Array(size * size);
  const rough = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const v = y / size;
      const s = sampler(u, v);
      const i = (y * size + x) * 4;
      rgba[i] = Math.round(s.r);
      rgba[i + 1] = Math.round(s.g);
      rgba[i + 2] = Math.round(s.b);
      rgba[i + 3] = 255;
      const hi = y * size + x;
      height[hi] = s.height;
      rough[hi] = s.roughness;
    }
  }
  return { rgba, height, rough };
}

export function heightToNormalMap(height, size, strength = 4) {
  const rgba = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const at = (py, px) => height[py * size + px];
      const hL = at(y, (x - 1 + size) % size);
      const hR = at(y, (x + 1) % size);
      const hD = at((y - 1 + size) % size, x);
      const hU = at((y + 1) % size, x);
      const dx = (hR - hL) * strength;
      const dy = (hU - hD) * strength;
      let nx = -dx;
      let ny = -dy;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * size + x) * 4;
      rgba[i] = Math.round((nx * 0.5 + 0.5) * 255);
      rgba[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      rgba[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

export function roughnessToRgba(rough, size) {
  const rgba = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    const g = Math.round(Math.min(1, Math.max(0, rough[i])) * 255);
    const o = i * 4;
    rgba[o] = g;
    rgba[o + 1] = g;
    rgba[o + 2] = g;
    rgba[o + 3] = 255;
  }
  return rgba;
}

export const HERO_TEXTURE_SETS = {
  stone: { sample: sampleStone, label: 'hero-stone' },
  moss: { sample: sampleMossStone, label: 'hero-moss' },
  cloth: { sample: (u, v) => sampleCloth(u, v, '#e4dcd0', '#8a8072'), label: 'hero-cloth' },
  clothGrove: { sample: (u, v) => sampleCloth(u, v, '#c8d4b8', '#6e8a52'), label: 'hero-grove-cloth' },
  clothPredictor: { sample: (u, v) => sampleCloth(u, v, '#9aa8b8', '#5a6878'), label: 'hero-predictor-cloth' },
};
