import * as THREE from 'three';

/**
 * Patches a MeshStandardMaterial so its map / normalMap / roughnessMap are projected in world
 * space along the three axes and blended by the surface normal. Code-built props then get
 * consistent texel density on any shape without authored UVs, and boulders, rims, and walls
 * share one material (one shader program) regardless of geometry.
 */
export function makeTriplanar(material: THREE.MeshStandardMaterial, metresPerTile: number): void {
  const uTriScale = { value: 1 / metresPerTile };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTriScale = uTriScale;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vTriPos;
        varying vec3 vTriNormal;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        {
          vec4 triWorld = vec4(transformed, 1.0);
          vec3 triNormal = objectNormal;
          #ifdef USE_INSTANCING
            triWorld = instanceMatrix * triWorld;
            triNormal = mat3(instanceMatrix) * triNormal;
          #endif
          vTriPos = (modelMatrix * triWorld).xyz;
          vTriNormal = normalize(mat3(modelMatrix) * triNormal);
        }`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTriScale;
        varying vec3 vTriPos;
        varying vec3 vTriNormal;
        vec3 triBlendWeights(vec3 n) {
          vec3 b = pow(abs(n), vec3(4.0));
          return b / (b.x + b.y + b.z);
        }
        vec4 triSample(sampler2D tex, vec3 w) {
          vec2 uvX = vTriPos.zy * uTriScale;
          vec2 uvY = vTriPos.xz * uTriScale;
          vec2 uvZ = vTriPos.xy * uTriScale;
          return texture2D(tex, uvX) * w.x + texture2D(tex, uvY) * w.y + texture2D(tex, uvZ) * w.z;
        }`,
      )
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
          vec3 triW = triBlendWeights(vTriNormal);
          diffuseColor *= triSample(map, triW);
        #endif`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `float roughnessFactor = roughness;
        #ifdef USE_ROUGHNESSMAP
          roughnessFactor *= triSample(roughnessMap, triBlendWeights(vTriNormal)).g;
        #endif`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#ifdef USE_NORMALMAP
        {
          vec3 wN = normalize(vTriNormal);
          #ifdef DOUBLE_SIDED
            wN *= faceDirection;
          #endif
          vec3 w = triBlendWeights(wN);
          vec3 tx = texture2D(normalMap, vTriPos.zy * uTriScale).xyz * 2.0 - 1.0;
          vec3 ty = texture2D(normalMap, vTriPos.xz * uTriScale).xyz * 2.0 - 1.0;
          vec3 tz = texture2D(normalMap, vTriPos.xy * uTriScale).xyz * 2.0 - 1.0;
          tx.xy *= normalScale;
          ty.xy *= normalScale;
          tz.xy *= normalScale;
          // Whiteout blend: add the geometric normal's in-plane components, keep its sign on Z.
          tx = vec3(tx.xy + wN.zy, abs(tx.z) * wN.x);
          ty = vec3(ty.xy + wN.xz, abs(ty.z) * wN.y);
          tz = vec3(tz.xy + wN.xy, abs(tz.z) * wN.z);
          vec3 worldN = normalize(tx.zyx * w.x + ty.xzy * w.y + tz.xyz * w.z);
          normal = normalize((viewMatrix * vec4(worldN, 0.0)).xyz);
        }
        #endif`,
      );
  };
  material.customProgramCacheKey = () => `triplanar-${metresPerTile}`;
}
