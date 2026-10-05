/**
 * 16³ strip LUTs for desktop cinematic grade (PNG + optional KTX2).
 * Run: npm run assets:luts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { encodeToKTX2 } from 'ktx2-encoder';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/assets/luts');
fs.mkdirSync(outDir, { recursive: true });

const LUT_SIZE = 16;
const STRIP_W = LUT_SIZE * LUT_SIZE;
const STRIP_H = LUT_SIZE;

async function imageDecoder(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), width: info.width, height: info.height };
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

/** Apply grade in linear-ish space before encoding to LUT. */
function grade(rgb, { lift, gamma, gain, warmth }) {
  let r = rgb[0] * gain[0] + lift[0];
  let g = rgb[1] * gain[1] + lift[1];
  let b = rgb[2] * gain[2] + lift[2];
  r = Math.pow(clamp01(r), gamma[0]);
  g = Math.pow(clamp01(g), gamma[1]);
  b = Math.pow(clamp01(b), gamma[2]);
  r += warmth * 0.08;
  b -= warmth * 0.06;
  return [clamp01(r), clamp01(g), clamp01(b)];
}

const PRESETS = {
  'era-neutral': { lift: [0, 0, 0], gamma: [1, 1, 1], gain: [1, 1, 1], warmth: 0 },
  'era-stable': { lift: [0.02, 0.015, -0.01], gamma: [0.95, 0.98, 1.02], gain: [1.04, 1.02, 0.96], warmth: 0.35 },
  'era-chaos': { lift: [-0.01, 0, -0.02], gamma: [1.05, 1.02, 0.98], gain: [1.08, 0.98, 0.92], warmth: 0.55 },
  'era-flying': { lift: [0.03, -0.02, -0.04], gamma: [0.92, 0.96, 1.05], gain: [1.14, 0.9, 0.86], warmth: 0.85 },
  'era-cold': { lift: [-0.02, 0, 0.03], gamma: [1.02, 1, 0.96], gain: [0.92, 0.96, 1.06], warmth: -0.25 },
};

function buildLutRgba(preset) {
  const rgba = new Uint8Array(STRIP_W * STRIP_H * 4);
  for (let b = 0; b < LUT_SIZE; b += 1) {
    for (let g = 0; g < LUT_SIZE; g += 1) {
      for (let r = 0; r < LUT_SIZE; r += 1) {
        const inRgb = [
          r / (LUT_SIZE - 1),
          g / (LUT_SIZE - 1),
          b / (LUT_SIZE - 1),
        ];
        const out = grade(inRgb, preset);
        const x = r + b * LUT_SIZE;
        const y = g;
        const i = (y * STRIP_W + x) * 4;
        rgba[i] = Math.round(out[0] * 255);
        rgba[i + 1] = Math.round(out[1] * 255);
        rgba[i + 2] = Math.round(out[2] * 255);
        rgba[i + 3] = 255;
      }
    }
  }
  return rgba;
}

for (const [name, preset] of Object.entries(PRESETS)) {
  const rgba = buildLutRgba(preset);
  const pngPath = path.join(outDir, `${name}.png`);
  await sharp(rgba, { raw: { width: STRIP_W, height: STRIP_H, channels: 4 } }).png().toFile(pngPath);
  const png = fs.readFileSync(pngPath);
  const ktx2 = await encodeToKTX2(new Uint8Array(png), {
    isUASTC: false,
    generateMipmap: false,
    imageDecoder,
  });
  fs.writeFileSync(path.join(outDir, `${name}.ktx2`), ktx2);
  console.log(`${name}.png + .ktx2 (${fs.statSync(pngPath).size} / ${ktx2.length} bytes)`);
}
