import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Terrain } from './Terrain';
import { GROVE_SITE } from './Terrain';
import { seededRandom } from './meshKit';

/**
 * One instanced clump of grass around the grove pool. In a Chaotic Era the blades stay
 * short and straw-coloured; in a Stable Era they grow in and turn green. A single uniform
 * drives every blade, so the swap is one value, not a rebuild.
 */
export class GroveGrass {
  readonly mesh: THREE.InstancedMesh;
  private grow = 0;
  private time = 0;
  private readonly uniforms = {
    uGrow: { value: 0 },
    uTime: { value: 0 },
  };

  constructor(terrain: Terrain, count: number) {
    const geometry = bladeGeometry();
    const material = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.9,
      side: THREE.DoubleSide,
      vertexColors: true,
    });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uGrow = this.uniforms.uGrow;
      shader.uniforms.uTime = this.uniforms.uTime;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform float uGrow;
          uniform float uTime;
          varying float vGrow;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vGrow = uGrow;
          transformed.y *= mix(0.22, 1.0, uGrow);
          float tip = transformed.y;
          float sway = sin(uTime * 1.7 + float(gl_InstanceID) * 0.73);
          transformed.x += sway * tip * 0.16 * uGrow;
          transformed.z += cos(uTime * 1.3 + float(gl_InstanceID) * 0.5) * tip * 0.08 * uGrow;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          varying float vGrow;`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          vec3 straw = vec3(0.72, 0.50, 0.22);
          vec3 lush = diffuseColor.rgb * vec3(0.45, 1.55, 0.45);
          diffuseColor.rgb = mix(straw, lush, vGrow);`,
        );
    };
    material.customProgramCacheKey = () => 'grove-grass-v3';

    this.mesh = new THREE.InstancedMesh(geometry, material, count);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;

    const rnd = seededRandom(1400);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      const angle = rnd() * Math.PI * 2;
      // Outside the pool basin, inside the grove clearing.
      const radius = GROVE_SITE.poolRadius + 0.6 + rnd() * 9;
      const x = GROVE_SITE.x + Math.cos(angle) * radius;
      const z = GROVE_SITE.z + Math.sin(angle) * radius;
      const scale = 0.65 + rnd() * 0.7;
      dummy.position.set(x, terrain.getHeightAt(x, z), z);
      dummy.rotation.y = rnd() * Math.PI;
      dummy.scale.set(scale, 0.7 + rnd() * 0.6, scale);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
      color.setHSL(0.30 + rnd() * 0.06, 0.62 + rnd() * 0.2, 0.36 + rnd() * 0.1);
      this.mesh.setColorAt(i, color);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
    this.mesh.computeBoundingSphere();
  }

  setStable(active: boolean, delta: number): void {
    this.time += delta;
    this.grow = THREE.MathUtils.lerp(this.grow, active ? 1 : 0, Math.min(delta * 2.4, 1));
    this.uniforms.uGrow.value = this.grow;
    this.uniforms.uTime.value = this.time;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/** Two crossed, tapered blades with the tip bent over. */
function bladeGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.09, 0);
  shape.lineTo(0.09, 0);
  shape.lineTo(0.025, 0.5);
  shape.lineTo(0, 0.72);
  shape.lineTo(-0.025, 0.5);
  const blade = new THREE.ShapeGeometry(shape);
  const pos = blade.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    if (y > 0.2) {
      pos.setZ(i, (y - 0.2) * 0.18);
    }
  }
  blade.computeVertexNormals();
  const white = new Float32Array(blade.attributes.position.count * 3);
  white.fill(1);
  blade.setAttribute('color', new THREE.BufferAttribute(white, 3));
  const twin = blade.clone();
  twin.rotateY(Math.PI * 0.5);
  const third = blade.clone();
  third.rotateY(Math.PI * 0.25);
  third.scale(0.7, 0.85, 0.7);
  const merged = mergeGeometries([blade, twin, third]);
  blade.dispose();
  twin.dispose();
  third.dispose();
  if (!merged) {
    throw new Error('grass blade merge failed');
  }
  return merged;
}
