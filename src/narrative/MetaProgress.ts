import * as THREE from 'three';

const FINAL_LOG_ID = 'final_log';
const VOLUME_KEY = '3body_master_volume';

export class MetaProgress {
  private chaoticTransitionsThisRun = 0;
  private enteredStableThisRun = false;

  hasSeenFinalLog(discovery: { isDiscovered(id: string): boolean }): boolean {
    return discovery.isDiscovered(FINAL_LOG_ID);
  }

  onChaoticPhaseEnded(): void {
    this.chaoticTransitionsThisRun += 1;
  }

  onStableEntered(): void {
    this.enteredStableThisRun = true;
  }

  resetRun(): void {
    this.chaoticTransitionsThisRun = 0;
    this.enteredStableThisRun = false;
  }

  getStableEraEnterChance(hasFinalLog: boolean): number {
    if (hasFinalLog) {
      return 0.08;
    }
    return 0.18;
  }

  shouldForceStableEra(hasFinalLog: boolean): boolean {
    if (hasFinalLog) {
      return false;
    }
    if (this.enteredStableThisRun) {
      return false;
    }
    return this.chaoticTransitionsThisRun >= 8;
  }

  static loadMasterVolume(): number {
    try {
      const raw = localStorage.getItem(VOLUME_KEY);
      if (raw === null) {
        return 0.55;
      }
      const value = Number.parseFloat(raw);
      return Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0.55;
    } catch {
      return 0.55;
    }
  }

  static saveMasterVolume(value: number): void {
    localStorage.setItem(VOLUME_KEY, String(THREE.MathUtils.clamp(value, 0, 1)));
  }
}
