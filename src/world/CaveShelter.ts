import * as THREE from 'three';
import type { Terrain } from './Terrain';
import type { ShelterZones } from '../survival/ShelterZones';
import type { LandmarkMaterials } from './landmarkMaterials';
import { GeometryBatch, boulderGeometry, roughen, seededRandom, stoneBlockGeometry } from './meshKit';

/**
 * Underground shelter: a rock-cut chamber below the slope, entered through a stone portal
 * with jambs and a lintel. The collision bounds come from ShelterZones and are unchanged.
 */
export class CaveShelter {
  readonly group = new THREE.Group();

  constructor(terrain: Terrain, shelterZones: ShelterZones, mats: LandmarkMaterials) {
    const bounds = shelterZones.getCaveBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const width = bounds.maxX - bounds.minX;
    const depth = bounds.maxZ - bounds.minZ;

    const batch = new GeometryBatch();

    // Chamber shell that follows the slope: ceiling just under the terrain, floor at the
    // walkable depth, so nothing pokes out of the hillside. Seen from inside only.
    const ceilingAt = (x: number, z: number) => terrain.getHeightAt(x, z) - 0.3;
    const floorAt = (x: number, z: number) => terrain.getHeightAt(x, z) - bounds.depthBelowSurface - 0.05;
    const makeSheet = (heightAt: (x: number, z: number) => number) => {
      const sheet = new THREE.PlaneGeometry(width, depth, 8, 8);
      sheet.rotateX(-Math.PI / 2);
      const pos = sheet.attributes.position;
      for (let i = 0; i < pos.count; i += 1) {
        const wx = centerX + pos.getX(i);
        const wz = centerZ + pos.getZ(i);
        pos.setY(i, heightAt(wx, wz));
      }
      sheet.computeVertexNormals();
      return sheet;
    };
    const ceiling = makeSheet(ceilingAt);
    roughen(ceiling, 0.12, 0.9, 7);
    batch.add(ceiling, mats.stoneDark, { position: [centerX, 0, centerZ] });
    batch.add(makeSheet(floorAt), mats.stoneDark, { position: [centerX, 0, centerZ] });
    // Walls: strips whose top/bottom edges follow ceiling and floor.
    const edges: Array<[number, number, number, number]> = [
      [bounds.minX, bounds.minZ, bounds.maxX, bounds.minZ],
      [bounds.maxX, bounds.minZ, bounds.maxX, bounds.maxZ],
      [bounds.maxX, bounds.maxZ, bounds.minX, bounds.maxZ],
      [bounds.minX, bounds.maxZ, bounds.minX, bounds.minZ],
    ];
    for (const [x0, z0, x1, z1] of edges) {
      const len = Math.hypot(x1 - x0, z1 - z0);
      const wall = new THREE.PlaneGeometry(len, 1, 8, 1);
      const pos = wall.attributes.position;
      for (let i = 0; i < pos.count; i += 1) {
        const t = pos.getX(i) / len + 0.5;
        const wx = THREE.MathUtils.lerp(x0, x1, t);
        const wz = THREE.MathUtils.lerp(z0, z1, t);
        const top = pos.getY(i) > 0;
        pos.setXYZ(i, wx, top ? ceilingAt(wx, wz) : floorAt(wx, wz), wz);
      }
      wall.computeVertexNormals();
      roughen(wall, 0.1, 1.1, 8);
      batch.add(wall, mats.stoneDark);
    }

    // Portal on the eastern edge where the player drops in.
    const portalX = bounds.maxX + 1.5;
    const portalZ = centerZ;
    const yaw = -0.35;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const portalY = terrain.getHeightAt(portalX, portalZ);
    for (const side of [-1, 1]) {
      const jx = portalX + cos * side * 1.3;
      const jz = portalZ - sin * side * 1.3;
      batch.add(stoneBlockGeometry(0.8, 2.6, 1.1, 10 + side), mats.stone, {
        position: [jx, portalY + 0.9, jz],
        rotation: [0, yaw, 0],
      });
    }
    batch.add(stoneBlockGeometry(3.6, 0.6, 1.3, 13), mats.stone, {
      position: [portalX, portalY + 2.45, portalZ],
      rotation: [0, yaw, 0.03],
    });
    // Dark mouth under the lintel.
    batch.add(new THREE.BoxGeometry(1.8, 2.2, 1.0), mats.charcoal, {
      position: [portalX, portalY + 0.75, portalZ],
      rotation: [0, yaw, 0],
    });
    // Rubble that spilled from the dig.
    const rnd = seededRandom(14);
    for (let i = 0; i < 8; i += 1) {
      const px = portalX + 1.2 + rnd() * 3.5;
      const pz = portalZ + (rnd() - 0.5) * 5;
      const size = 0.2 + rnd() * 0.4;
      batch.add(boulderGeometry(size, 20 + i, 1), mats.stone, {
        position: [px, terrain.getHeightAt(px, pz) + size * 0.4, pz],
        rotation: [0, rnd() * Math.PI, 0],
      });
    }
    batch.build(this.group);

    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 2.4, 8),
      new THREE.MeshStandardMaterial({
        color: '#8a7a62',
        emissive: '#3a3020',
        emissiveIntensity: 0.35,
      }),
    );
    marker.position.set(portalX + 2.6, portalY + 1.0, portalZ + 2.2);

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.6),
      new THREE.MeshBasicMaterial({
        color: '#d8c7a8',
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      }),
    );
    sign.position.set(portalX + 2.6, portalY + 2.4, portalZ + 2.2);
    sign.rotation.y = -0.8;

    this.group.add(marker, sign);
  }
}
