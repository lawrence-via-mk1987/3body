import * as THREE from 'three';

export class Sky {
  readonly mesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;
  private readonly targetTop = new THREE.Color('#1a2238');
  private readonly targetHorizon = new THREE.Color('#6d3d28');
  private readonly targetBottom = new THREE.Color('#2a1810');
  private readonly currentTop = new THREE.Color('#1a2238');
  private readonly currentHorizon = new THREE.Color('#6d3d28');
  private readonly currentBottom = new THREE.Color('#2a1810');

  constructor() {
    const geometry = new THREE.SphereGeometry(480, 32, 16);
    this.material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTopColor: { value: this.currentTop.clone() },
        uHorizonColor: { value: this.currentHorizon.clone() },
        uBottomColor: { value: this.currentBottom.clone() },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uBottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y * 0.5 + 0.5;
          vec3 color = mix(uBottomColor, uHorizonColor, smoothstep(0.0, 0.42, h));
          color = mix(color, uTopColor, smoothstep(0.35, 1.0, h));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
  }

  setPalette(top: string, horizon: string, bottom: string): void {
    this.targetTop.set(top);
    this.targetHorizon.set(horizon);
    this.targetBottom.set(bottom);
  }

  update(): void {
    this.currentTop.lerp(this.targetTop, 0.05);
    this.currentHorizon.lerp(this.targetHorizon, 0.05);
    this.currentBottom.lerp(this.targetBottom, 0.05);

    this.material.uniforms.uTopColor.value.copy(this.currentTop);
    this.material.uniforms.uHorizonColor.value.copy(this.currentHorizon);
    this.material.uniforms.uBottomColor.value.copy(this.currentBottom);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
