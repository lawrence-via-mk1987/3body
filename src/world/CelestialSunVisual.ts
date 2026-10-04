import * as THREE from 'three';
import { createSunGlowTexture } from './proceduralTextures';

export interface CelestialSunPalette {
  core: string;
  limb: string;
  emissive: string;
}

function createLimbDiskMaterial(core: string, limb: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uCore: { value: new THREE.Color(core).multiplyScalar(2.6) },
      uLimb: { value: new THREE.Color(limb).multiplyScalar(1.35) },
      uBoost: { value: 1 },
    },
    vertexShader: `
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uCore;
      uniform vec3 uLimb;
      uniform float uBoost;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        float mu = clamp(dot(normalize(vNormalView), normalize(vViewDir)), 0.0, 1.0);
        float limb = 0.35 + 0.65 * mu;
        vec3 color = mix(uLimb, uCore, pow(limb, 1.55)) * uBoost;
        float rim = pow(1.0 - mu, 2.2) * 0.35;
        color += uCore * rim;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    toneMapped: false,
    depthWrite: false,
    fog: false,
  });
}

export interface CelestialSunVisualOptions {
  /** Intro N-body diagram: one tight halo so three stars read as three, not a dozen. */
  diagram?: boolean;
}

/** Limb-darkened disk + layered halos (shared by sky suns and intro orbit diagram). */
export function buildCelestialSunVisual(
  palette: CelestialSunPalette,
  diskRadius = 1,
  options: CelestialSunVisualOptions = {},
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'celestial-sun';

  const diskMat = createLimbDiskMaterial(palette.core, palette.limb);
  const disk = new THREE.Mesh(new THREE.SphereGeometry(diskRadius, 40, 32), diskMat);
  disk.renderOrder = 10;
  disk.frustumCulled = false;
  group.add(disk);

  const makeGlow = (scaleMul: number, opacity: number, color: string) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createSunGlowTexture(color, 512),
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
        fog: false,
      }),
    );
    sprite.renderOrder = 11;
    sprite.scale.setScalar(diskRadius * scaleMul);
    return sprite;
  };

  const diagram = options.diagram === true;
  const inner = makeGlow(diagram ? 2.4 : 3.2, diagram ? 0.72 : 0.95, palette.emissive);
  group.add(inner);
  let outer: THREE.Sprite | null = null;
  let corona: THREE.Sprite | null = null;
  if (!diagram) {
    outer = makeGlow(6.5, 0.55, palette.core);
    corona = makeGlow(10, 0.28, palette.limb);
    group.add(outer, corona);
  }

  const light = new THREE.PointLight(palette.core, diagram ? 0.35 : 1.2, diskRadius * 28, 2);
  group.add(light);

  group.userData.sunVisual = {
    diskMat,
    inner,
    outer,
    corona,
    light,
  };

  return group;
}

export function updateCelestialSunVisual(
  group: THREE.Group,
  intensity: number,
  pulse = 0,
): void {
  const data = group.userData.sunVisual as {
    diskMat: THREE.ShaderMaterial;
    inner: THREE.Sprite;
    outer: THREE.Sprite | null;
    corona: THREE.Sprite | null;
    light: THREE.PointLight;
  } | undefined;
  if (!data) {
    return;
  }
  const flicker = 1 + Math.sin(pulse * 2.4) * 0.04 * intensity;
  data.diskMat.uniforms.uBoost.value = (0.65 + intensity * 0.35) * flicker;
  data.light.intensity = (0.8 + intensity * 1.4) * flicker;
  (data.inner.material as THREE.SpriteMaterial).opacity = THREE.MathUtils.clamp(0.5 + intensity * 0.4, 0.4, 1);
  if (data.outer) {
    (data.outer.material as THREE.SpriteMaterial).opacity = THREE.MathUtils.clamp(0.25 + intensity * 0.35, 0.2, 0.75);
  }
  if (data.corona) {
    (data.corona.material as THREE.SpriteMaterial).opacity = THREE.MathUtils.clamp(0.12 + intensity * 0.22, 0.1, 0.45);
  }
}
