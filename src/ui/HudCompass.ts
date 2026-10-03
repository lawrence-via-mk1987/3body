import type { WayfindingTarget } from '../world/WayfindingObjective';
import { wayfindingLabel } from '../world/WayfindingObjective';

export class HudCompass {
  constructor(
    private readonly root: HTMLElement,
    private readonly labelEl: HTMLElement,
    private readonly arrowEl: HTMLElement,
  ) {}

  update(
    target: WayfindingTarget | null,
    cameraYaw: number,
    bearingToTarget: number | null,
  ): void {
    if (!target || bearingToTarget === null) {
      this.root.classList.add('hidden');
      return;
    }

    this.root.classList.remove('hidden');
    this.labelEl.textContent = wayfindingLabel(target);

    let delta = bearingToTarget - cameraYaw;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    const deg = (delta * 180) / Math.PI;
    this.arrowEl.style.transform = `rotate(${deg}deg)`;
    this.root.dataset.target = target;
  }
}

/** Horizontal bearing from player to target (0 = world −Z / “north” in game space). */
export function horizontalBearing(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
): number {
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  return Math.atan2(dx, -dz);
}
