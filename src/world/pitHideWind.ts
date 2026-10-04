import * as THREE from 'three';

export interface PitHideWindUniforms {
  uWind: { value: number };
  uTime: { value: number };
}

/** Pit floor hides and rack panels — rip upward during Tri-Solar only. */
export function applyPitHideWind(
  material: THREE.MeshStandardMaterial,
  uniforms: PitHideWindUniforms,
): void {
  material.customProgramCacheKey = () => 'pit-hide-wind-v1';

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = uniforms.uWind;
    shader.uniforms.uTime = uniforms.uTime;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uWind;
        uniform float uTime;
        varying float vHideLift;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float hidePhase = uTime * 2.2 + transformed.x * 1.4 + transformed.z * 0.9;
        float hideRipple = sin(hidePhase) * 0.5 + sin(hidePhase * 1.7 + 1.2) * 0.35;
        float hideMask = smoothstep(0.05, 0.85, transformed.y + 0.15);
        vHideLift = uWind * hideMask;
        transformed.x += hideRipple * vHideLift * 0.22;
        transformed.y += abs(hideRipple) * vHideLift * 0.35 + vHideLift * transformed.y * 0.08;
        transformed.z += cos(hidePhase * 0.8) * vHideLift * 0.12;`,
      );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      varying float vHideLift;`,
    );
  };
}

export function createPitHideWindMaterial(
  template: THREE.MeshStandardMaterial,
): { material: THREE.MeshStandardMaterial; uniforms: PitHideWindUniforms } {
  const material = template.clone();
  const uniforms: PitHideWindUniforms = { uWind: { value: 0 }, uTime: { value: 0 } };
  applyPitHideWind(material, uniforms);
  return { material, uniforms };
}
