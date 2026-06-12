import * as THREE from 'three';

const TERRAIN_SIZE = 512;
const TERRAIN_SEGMENTS = 128;
const HEIGHT_SCALE = 18;

function hash(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smoothNoise(x: number, z: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fz = z - z0;

  const a = hash(x0, z0);
  const b = hash(x0 + 1, z0);
  const c = hash(x0, z0 + 1);
  const d = hash(x0 + 1, z0 + 1);

  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);

  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(a, b, ux),
    THREE.MathUtils.lerp(c, d, ux),
    uz,
  );
}

function fbm(x: number, z: number): number {
  let value = 0;
  let amplitude = 0.55;
  let frequency = 0.018;

  for (let i = 0; i < 4; i += 1) {
    value += smoothNoise(x * frequency, z * frequency) * amplitude;
    amplitude *= 0.5;
    frequency *= 2.1;
  }

  return value;
}

function sampleHeight(worldX: number, worldZ: number): number {
  const ridge = Math.pow(Math.abs(fbm(worldX, worldZ) - 0.5) * 2, 1.4);
  const basin = fbm(worldX * 0.5 + 40, worldZ * 0.5 - 20);
  const cracks = Math.pow(1 - Math.abs(Math.sin(worldX * 0.08) * Math.cos(worldZ * 0.07)), 6);

  return (ridge * 0.75 + basin * 0.45 - cracks * 0.35) * HEIGHT_SCALE;
}

export class Terrain {
  readonly mesh: THREE.Mesh;
  private readonly geometry: THREE.PlaneGeometry;

  constructor() {
    this.geometry = new THREE.PlaneGeometry(
      TERRAIN_SIZE,
      TERRAIN_SIZE,
      TERRAIN_SEGMENTS,
      TERRAIN_SEGMENTS,
    );
    this.geometry.rotateX(-Math.PI / 2);

    const position = this.geometry.attributes.position;
    const colors: number[] = [];

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const height = sampleHeight(x, z);
      position.setY(i, height);

      const lowColor = new THREE.Color('#5a3d28');
      const highColor = new THREE.Color('#9a6a45');
      const crackColor = new THREE.Color('#2f2118');
      const blend = THREE.MathUtils.clamp(height / HEIGHT_SCALE, 0, 1);
      const crack = Math.pow(
        1 - Math.abs(Math.sin(x * 0.08) * Math.cos(z * 0.07)),
        10,
      );

      const color = lowColor.clone().lerp(highColor, blend).lerp(crackColor, crack * 0.65);
      colors.push(color.r, color.g, color.b);
    }

    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.04,
      flatShading: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;
  }

  getHeightAt(worldX: number, worldZ: number): number {
    const half = TERRAIN_SIZE / 2;
    const clampedX = THREE.MathUtils.clamp(worldX, -half, half);
    const clampedZ = THREE.MathUtils.clamp(worldZ, -half, half);
    return sampleHeight(clampedX, clampedZ);
  }

  getBounds(): number {
    return TERRAIN_SIZE / 2 - 4;
  }

  dispose(): void {
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
