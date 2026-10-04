import * as THREE from 'three';

export interface GrovePoolWaterUniforms {
  uTime: { value: number };
  uHorizon: { value: THREE.Color };
  uTop: { value: THREE.Color };
  uSunDir: { value: THREE.Vector3 };
  uSunStrength: { value: number };
  uRipple: { value: number };
}

/** Stable grove pool — ripples, fresnel sky reflection, boosted env response. */
export function applyGrovePoolWater(
  material: THREE.MeshStandardMaterial,
  uniforms: GrovePoolWaterUniforms,
): void {
  material.customProgramCacheKey = () => 'grove-pool-water-v2';

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uHorizon = uniforms.uHorizon;
    shader.uniforms.uTop = uniforms.uTop;
    shader.uniforms.uSunDir = uniforms.uSunDir;
    shader.uniforms.uSunStrength = uniforms.uSunStrength;
    shader.uniforms.uRipple = uniforms.uRipple;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        uniform float uRipple;
        varying vec3 vPoolWorldPos;
        varying vec3 vPoolNormal;`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        float wave = sin(position.x * 3.2 + uTime * 1.4) * cos(position.y * 2.8 - uTime * 1.1);
        objectNormal = normalize(objectNormal + vec3(wave, wave * 0.35, -wave * 0.6) * uRipple * 0.22);`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        transformed.y += sin(position.x * 2.6 + uTime) * cos(position.y * 2.3 - uTime * 0.9) * uRipple * 0.012;`,
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        vPoolWorldPos = worldPosition.xyz;
        vPoolNormal = normalize(mat3(modelMatrix) * objectNormal);`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uHorizon;
        uniform vec3 uTop;
        uniform vec3 uSunDir;
        uniform float uSunStrength;
        varying vec3 vPoolWorldPos;
        varying vec3 vPoolNormal;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 viewDir = normalize(cameraPosition - vPoolWorldPos);
        vec3 n = normalize(vPoolNormal);
        float fresnel = pow(1.0 - max(dot(viewDir, n), 0.0), 3.2);
        float skyT = clamp(n.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 skyReflect = mix(uHorizon, uTop, pow(skyT, 0.65));
        float sunSpec = pow(max(dot(reflect(-viewDir, n), normalize(uSunDir)), 0.0), 48.0);
        skyReflect += vec3(1.0, 0.92, 0.75) * sunSpec * uSunStrength * 0.85;
        diffuseColor.rgb = mix(diffuseColor.rgb, skyReflect, fresnel * 0.72 + 0.08);
        diffuseColor.rgb += skyReflect * fresnel * 0.18;`,
      );
  };
}
