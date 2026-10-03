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
}

export function createGroundTextures(size: number, anisotropy: number): GroundTextureSet {
  const height = new Float32Array(size * size);
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const albedoCtx = albedoCanvas.getContext('2d')!;
  const albedoImg = albedoCtx.createImageData(size, size);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const roughCtx = roughCanvas.getContext('2d')!;
  const roughImg = roughCtx.createImageData(size, size);

  const dustLow = new THREE.Color('#6b4a33');
  const dustHigh = new THREE.Color('#a8785a');
  const grit = new THREE.Color('#4c3627');
  const crackDark = new THREE.Color('#2b1c14');
  const stoneCool = new THREE.Color('#7a6a5c');
  const tmp = new THREE.Color();

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const v = y / size;

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
      height[y * size + x] = h;

      tmp.copy(dustLow).lerp(dustHigh, THREE.MathUtils.clamp(dust * 1.15, 0, 1));
      tmp.lerp(grit, THREE.MathUtils.clamp((fine - 0.45) * 1.8, 0, 1) * 0.55);
      tmp.lerp(stoneCool, stoneMask * 0.6);
      tmp.lerp(crackDark, crack * 0.5);
      const speck = hash2(x * 3.1, y * 7.7);
      if (speck > 0.985) {
        tmp.lerp(stoneCool, 0.7);
      }

      const i = (y * size + x) * 4;
      albedoImg.data[i] = Math.round(tmp.r * 255);
      albedoImg.data[i + 1] = Math.round(tmp.g * 255);
      albedoImg.data[i + 2] = Math.round(tmp.b * 255);
      albedoImg.data[i + 3] = 255;

      const rough = THREE.MathUtils.clamp(0.82 + crack * 0.12 - stoneMask * 0.18 + (fine - 0.5) * 0.1, 0.55, 1);
      const r8 = Math.round(rough * 255);
      roughImg.data[i] = r8;
      roughImg.data[i + 1] = r8;
      roughImg.data[i + 2] = r8;
      roughImg.data[i + 3] = 255;
    }
  }
  albedoCtx.putImageData(albedoImg, 0, 0);
  roughCtx.putImageData(roughImg, 0, 0);

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const normalCtx = normalCanvas.getContext('2d')!;
  const normalImg = normalCtx.createImageData(size, size);
  const strength = 2.6;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const xl = height[y * size + ((x - 1 + size) % size)];
      const xr = height[y * size + ((x + 1) % size)];
      const yu = height[((y - 1 + size) % size) * size + x];
      const yd = height[((y + 1) % size) * size + x];
      const nx = (xl - xr) * strength;
      const ny = (yu - yd) * strength;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * size + x) * 4;
      normalImg.data[i] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      normalImg.data[i + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      normalImg.data[i + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      normalImg.data[i + 3] = 255;
    }
  }
  normalCtx.putImageData(normalImg, 0, 0);

  const albedo = new THREE.CanvasTexture(albedoCanvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  const normal = new THREE.CanvasTexture(normalCanvas);
  const roughness = new THREE.CanvasTexture(roughCanvas);

  for (const tex of [albedo, normal, roughness]) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = anisotropy;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
  }

  return { albedo, normal, roughness };
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
  gradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
  gradient.addColorStop(0.08, `rgba(${rgb}, 0.9)`);
  gradient.addColorStop(0.22, `rgba(${rgb}, 0.38)`);
  gradient.addColorStop(0.5, `rgba(${rgb}, 0.1)`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
