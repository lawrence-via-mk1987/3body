/**
 * Procedural hero PBR maps → KTX2 (Basis UASTC) for Path A landmarks/NPCs.
 * Run: npm run assets:heroes:ktx2
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { encodeToKTX2 } from 'ktx2-encoder';
import {
  fillHeroPixels,
  heightToNormalMap,
  roughnessToRgba,
  HERO_TEXTURE_SETS,
} from './hero-texture-sampler.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/assets/textures');
fs.mkdirSync(outDir, { recursive: true });

const SIZE = 512;

async function imageDecoder(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), width: info.width, height: info.height };
}

async function rgbaToKtx2(rgba, width, height, name) {
  const png = await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
  const ktx2 = await encodeToKTX2(new Uint8Array(png), {
    isUASTC: true,
    generateMipmap: true,
    imageDecoder,
    enableDebug: false,
  });
  const outPath = path.join(outDir, `${name}.ktx2`);
  fs.writeFileSync(outPath, ktx2);
  return fs.statSync(outPath).size;
}

for (const { sample, label } of Object.values(HERO_TEXTURE_SETS)) {
  const { rgba, height, rough } = fillHeroPixels(SIZE, sample);
  const normal = heightToNormalMap(height, SIZE, 5);
  const roughRgba = roughnessToRgba(rough, SIZE);

  const albedoBytes = await rgbaToKtx2(rgba, SIZE, SIZE, `${label}-albedo`);
  const normalBytes = await rgbaToKtx2(normal, SIZE, SIZE, `${label}-normal`);
  const roughBytes = await rgbaToKtx2(roughRgba, SIZE, SIZE, `${label}-roughness`);
  console.log(`${label}: albedo ${albedoBytes}, normal ${normalBytes}, rough ${roughBytes} bytes`);
}
