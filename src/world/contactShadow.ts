import * as THREE from 'three';

const shadowMaterial = new THREE.MeshBasicMaterial({
  color: '#000000',
  transparent: true,
  opacity: 0.38,
  depthWrite: false,
  toneMapped: false,
});

/** Soft ground blob under a standing figure — cheap contact shadow. */
export function addContactShadow(parent: THREE.Object3D, radius = 0.58): THREE.Mesh {
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(radius, 22), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.04;
  shadow.renderOrder = -2;
  shadow.frustumCulled = false;
  parent.add(shadow);
  return shadow;
}
