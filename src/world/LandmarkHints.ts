import * as THREE from 'three';

const LANDMARKS = [
  { name: 'Waystone', x: 8, z: 22 },
  { name: 'Underground shelter (east)', x: -2, z: 10 },
  { name: 'Dehydration pit (northwest)', x: -42, z: 18 },
  { name: 'Observatory (southeast)', x: 45, z: -35 },
  { name: 'Stable Era grove (southwest)', x: 28, z: -32 },
];

export function nearestLandmarkHint(position: THREE.Vector3): string | null {
  let best: { name: string; distance: number } | null = null;

  for (const landmark of LANDMARKS) {
    const distance = Math.hypot(position.x - landmark.x, position.z - landmark.z);
    if (distance > 55) {
      continue;
    }
    if (!best || distance < best.distance) {
      best = { name: landmark.name, distance };
    }
  }

  if (!best || best.distance > 40) {
    return null;
  }

  const bearing = bearingLabel(position.x, position.z, LANDMARKS.find((l) => l.name === best!.name)!);
  return `${best.name} — ${bearing}, ~${Math.round(best.distance)}m`;
}

function bearingLabel(fromX: number, fromZ: number, to: { x: number; z: number }): string {
  const dx = to.x - fromX;
  const dz = to.z - fromZ;
  const angle = Math.atan2(dx, -dz);
  const deg = ((angle * 180) / Math.PI + 360) % 360;

  if (deg < 22.5 || deg >= 337.5) return 'north';
  if (deg < 67.5) return 'northeast';
  if (deg < 112.5) return 'east';
  if (deg < 157.5) return 'southeast';
  if (deg < 202.5) return 'south';
  if (deg < 247.5) return 'southwest';
  if (deg < 292.5) return 'west';
  return 'northwest';
}
