import * as THREE from 'three';

/**
 * CPU-generated ground textures so the remake needs no downloaded assets.
 * Albedo: dust + grit + cracked-clay cells. Normal map derived from the same height field.
 */

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smoothNoise(x: number, y: number): number {
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
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, ux), THREE.MathUtils.lerp(c, d, ux), uy);
}

/** Tileable fbm: sample on a torus so the texture repeats seamlessly. */
function tileableFbm(u: number, v: number, octaves: number, baseFreq: number): number {
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

/** Tileable Worley (cell) distance — gives the cracked-clay polygon look. */
function tileableCells(u: number, v: number, cells: number): { f1: number; f2: number } {
  const px = u * cells;
  const py = v * cells;
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  let f1 = 10;
  let f2 = 10;
  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      const cx = ((ix + ox) % cells + cells) % cells;
      const cy = ((iy + oy) % cells + cells) % cells;
      const jx = hash2(cx, cy);
      const jy = hash2(cx + 17.3, cy + 9.1);
      const dx = ix + ox + jx - px;
      const dy = iy + oy + jy - py;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < f1) {
        f2 = f1;
        f1 = d;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return { f1, f2 };
}

export interface GroundTextureSet {
  albedo: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  /** Baked cavity darkening (ORM-style occlusion). */
  ao: THREE.CanvasTexture;
}

/** Per-texel description returned by a surface sampler. */
interface SurfaceSample {
  color: THREE.Color;
  height: number;
  roughness: number;
}

type SurfaceSampler = (u: number, v: number, x: number, y: number, out: SurfaceSample) => void;

function makeCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; img: ImageData } {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx, img: ctx.createImageData(size, size) };
}

/**
 * Shared baker: runs a sampler over a tileable UV grid and emits albedo, a normal map derived
 * from the sampled height field, and a roughness map.
 */
function bakeSurface(size: number, anisotropy: number, normalStrength: number, sampler: SurfaceSampler): GroundTextureSet {
  const height = new Float32Array(size * size);
  const albedo = makeCanvas(size);
  const rough = makeCanvas(size);
  const sample: SurfaceSample = { color: new THREE.Color(), height: 0, roughness: 1 };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      sampler(x / size, y / size, x, y, sample);
      height[y * size + x] = sample.height;
      const i = (y * size + x) * 4;
      albedo.img.data[i] = Math.round(THREE.MathUtils.clamp(sample.color.r, 0, 1) * 255);
      albedo.img.data[i + 1] = Math.round(THREE.MathUtils.clamp(sample.color.g, 0, 1) * 255);
      albedo.img.data[i + 2] = Math.round(THREE.MathUtils.clamp(sample.color.b, 0, 1) * 255);
      albedo.img.data[i + 3] = 255;
      const r8 = Math.round(THREE.MathUtils.clamp(sample.roughness, 0, 1) * 255);
      rough.img.data[i] = r8;
      rough.img.data[i + 1] = r8;
      rough.img.data[i + 2] = r8;
      rough.img.data[i + 3] = 255;
    }
  }
  albedo.ctx.putImageData(albedo.img, 0, 0);
  rough.ctx.putImageData(rough.img, 0, 0);

  const normal = makeCanvas(size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const xl = height[y * size + ((x - 1 + size) % size)];
      const xr = height[y * size + ((x + 1) % size)];
      const yu = height[((y - 1 + size) % size) * size + x];
      const yd = height[((y + 1) % size) * size + x];
      const nx = (xl - xr) * normalStrength;
      const ny = (yu - yd) * normalStrength;
      const len = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      normal.img.data[i] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      normal.img.data[i + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      normal.img.data[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      normal.img.data[i + 3] = 255;
    }
  }
  normal.ctx.putImageData(normal.img, 0, 0);

  const ao = makeCanvas(size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const c = height[y * size + x];
      let sum = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          if (ox === 0 && oy === 0) {
            continue;
          }
          sum += height[((y + oy + size) % size) * size + ((x + ox + size) % size)];
        }
      }
      const avg = sum / 8;
      const cavity = THREE.MathUtils.clamp((avg - c) * 2.8 + 0.08, 0, 0.85);
      const aoVal = Math.round((1 - cavity) * 255);
      const i = (y * size + x) * 4;
      ao.img.data[i] = aoVal;
      ao.img.data[i + 1] = aoVal;
      ao.img.data[i + 2] = aoVal;
      ao.img.data[i + 3] = 255;
    }
  }
  ao.ctx.putImageData(ao.img, 0, 0);

  const albedoTex = new THREE.CanvasTexture(albedo.canvas);
  albedoTex.colorSpace = THREE.SRGBColorSpace;
  const normalTex = new THREE.CanvasTexture(normal.canvas);
  normalTex.colorSpace = THREE.NoColorSpace;
  const roughTex = new THREE.CanvasTexture(rough.canvas);
  roughTex.colorSpace = THREE.NoColorSpace;
  const aoTex = new THREE.CanvasTexture(ao.canvas);
  aoTex.colorSpace = THREE.NoColorSpace;
  for (const tex of [albedoTex, normalTex, roughTex, aoTex]) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = anisotropy;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
  }
  return { albedo: albedoTex, normal: normalTex, roughness: roughTex, ao: aoTex };
}

export function createGroundTextures(size: number, anisotropy: number): GroundTextureSet {
  const dustLow = new THREE.Color('#6b4a33');
  const dustHigh = new THREE.Color('#a8785a');
  const grit = new THREE.Color('#4c3627');
  const crackDark = new THREE.Color('#2b1c14');
  const stoneCool = new THREE.Color('#7a6a5c');

  return bakeSurface(size, anisotropy, 3.4, (u, v, x, y, out) => {
    const dust = tileableFbm(u, v, 5, 4);
    const fine = tileableFbm(u + 0.37, v + 0.61, 4, 24);
    const { f1, f2 } = tileableCells(u, v, 14);
    const crackWidth = 0.05 + fine * 0.04;
    // Cracked clay only where the ground once held water; elsewhere the dust buries it.
    const crackRegion = THREE.MathUtils.smoothstep(tileableFbm(u + 0.15, v + 0.9, 3, 2), 0.4, 0.66);
    const crack = (1 - THREE.MathUtils.smoothstep(f2 - f1, 0, crackWidth)) * crackRegion;
    const plateDome = THREE.MathUtils.clamp(1 - f1 * 1.6, 0, 1) * crackRegion;
    const stoneMask = THREE.MathUtils.smoothstep(tileableFbm(u + 0.8, v + 0.2, 3, 3), 0.56, 0.72);

    // Height: dust undulation + plate domes, carved by cracks and sprinkled with grit.
    let h = dust * 0.6 + plateDome * 0.2 + fine * 0.2;
    h -= crack * 0.35;
    h += (hash2(x, y) - 0.5) * 0.06;
    out.height = h;

    out.color.copy(dustLow).lerp(dustHigh, THREE.MathUtils.clamp(dust * 1.15, 0, 1));
    out.color.lerp(grit, THREE.MathUtils.clamp((fine - 0.45) * 1.8, 0, 1) * 0.55);
    out.color.lerp(stoneCool, stoneMask * 0.6);
    out.color.lerp(crackDark, crack * 0.5);
    if (hash2(x * 3.1, y * 7.7) > 0.985) {
      out.color.lerp(stoneCool, 0.7);
    }
    out.roughness = 0.82 + crack * 0.12 - stoneMask * 0.18 + (fine - 0.5) * 0.1;
  });
}

/** Weathered basalt: flaky grain, pitting, pale mineral veins. Non-directional, for triplanar use. */
export function createStoneTextures(size: number, anisotropy: number): GroundTextureSet {
  const base = new THREE.Color('#857666');
  const dark = new THREE.Color('#4a3e36');
  const pale = new THREE.Color('#b4a896');
  const rust = new THREE.Color('#8a5e42');

  return bakeSurface(size, anisotropy, 3.2, (u, v, x, y, out) => {
    const grain = tileableFbm(u, v, 5, 6);
    const flakes = tileableCells(u + 0.3, v + 0.7, 9);
    const flake = THREE.MathUtils.smoothstep(flakes.f2 - flakes.f1, 0, 0.12);
    const pits = tileableCells(u + 0.6, v + 0.1, 26);
    const pit = 1 - THREE.MathUtils.smoothstep(pits.f1, 0.08, 0.3);
    const vein = Math.pow(1 - Math.abs(tileableFbm(u + 0.2, v + 0.4, 3, 3) - 0.5) * 2, 8);
    const rustMask = THREE.MathUtils.smoothstep(tileableFbm(u + 0.9, v + 0.3, 3, 2), 0.55, 0.75);

    out.height = grain * 0.5 + flake * 0.3 - pit * 0.35 + (hash2(x, y) - 0.5) * 0.05;
    out.color.copy(base).lerp(pale, THREE.MathUtils.clamp((grain - 0.4) * 1.6, 0, 1) * 0.5);
    out.color.lerp(dark, (1 - flake) * 0.45 + pit * 0.5);
    out.color.lerp(pale, vein * 0.5);
    out.color.lerp(rust, rustMask * 0.4);
    out.roughness = 0.78 + pit * 0.15 - vein * 0.2 + (grain - 0.5) * 0.12;
  });
}

/** Sun-bleached timber: long grain along V, checking cracks, grey weathering. */
export function createWoodTextures(size: number, anisotropy: number): GroundTextureSet {
  const heart = new THREE.Color('#5a3f2a');
  const bleached = new THREE.Color('#8f7c62');
  const crackCol = new THREE.Color('#2a1c12');

  return bakeSurface(size, anisotropy, 2.2, (u, v, x, y, out) => {
    // Grain: stretch noise along v so streaks run the length of a post.
    const grain = tileableFbm(u * 1.0, v * 0.12, 4, 10);
    const streak = Math.sin((u + grain * 0.35) * Math.PI * 2 * 9) * 0.5 + 0.5;
    const checking = Math.pow(1 - Math.abs(tileableFbm(u * 0.5 + 0.3, v * 0.1, 3, 14) - 0.5) * 2, 10);
    const weather = tileableFbm(u + 0.4, v + 0.2, 3, 3);

    out.height = streak * 0.3 + grain * 0.4 - checking * 0.5 + (hash2(x, y) - 0.5) * 0.04;
    out.color.copy(heart).lerp(bleached, THREE.MathUtils.clamp(weather * 1.3, 0, 1));
    out.color.multiplyScalar(0.85 + streak * 0.25);
    out.color.lerp(crackCol, checking * 0.7);
    out.roughness = 0.86 + checking * 0.1 - streak * 0.06;
  });
}

/** Heavy woven cloth: weave bumps, patches, dust staining. */
export function createClothTextures(size: number, anisotropy: number, base: string, stain: string): GroundTextureSet {
  const baseCol = new THREE.Color(base);
  const stainCol = new THREE.Color(stain);
  const thread = new THREE.Color('#1c1612');

  return bakeSurface(size, anisotropy, 1.4, (u, v, x, y, out) => {
    const weaveU = Math.sin(u * Math.PI * 2 * 48) * 0.5 + 0.5;
    const weaveV = Math.sin(v * Math.PI * 2 * 48) * 0.5 + 0.5;
    const weave = weaveU * weaveV;
    const stains = tileableFbm(u, v, 4, 3);
    const wear = THREE.MathUtils.smoothstep(tileableFbm(u + 0.5, v + 0.8, 3, 5), 0.6, 0.8);

    out.height = weave * 0.6 + stains * 0.2 + (hash2(x, y) - 0.5) * 0.08;
    out.color.copy(baseCol).lerp(stainCol, THREE.MathUtils.clamp(stains * 1.4 - 0.2, 0, 1));
    out.color.lerp(thread, (1 - weave) * 0.25 + wear * 0.3);
    out.roughness = 0.92 - wear * 0.05;
  });
}

/** Radial glow with a hot core and long soft falloff, used for sun halos. */
export function createSunGlowTexture(color: string, size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = new THREE.Color(color);
  const rgb = `${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}`;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.04, `rgba(255, 248, 230, 0.98)`);
  gradient.addColorStop(0.1, `rgba(${rgb}, 0.92)`);
  gradient.addColorStop(0.2, `rgba(${rgb}, 0.55)`);
  gradient.addColorStop(0.38, `rgba(${rgb}, 0.22)`);
  gradient.addColorStop(0.62, `rgba(${rgb}, 0.08)`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
