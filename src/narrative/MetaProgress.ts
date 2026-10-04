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

  hasEnteredStableThisRun(): boolean {
    return this.enteredStableThisRun;
  }

  resetRun(): void {
    this.chaoticTransitionsThisRun = 0;
    this.enteredStableThisRun = false;
  }

  exportRunState(): { chaoticTransitionsThisRun: number; enteredStableThisRun: boolean } {
    return {
      chaoticTransitionsThisRun: this.chaoticTransitionsThisRun,
      enteredStableThisRun: this.enteredStableThisRun,
    };
  }

  importRunState(state: { chaoticTransitionsThisRun: number; enteredStableThisRun: boolean }): void {
    this.chaoticTransitionsThisRun = state.chaoticTransitionsThisRun;
    this.enteredStableThisRun = state.enteredStableThisRun;
  }

  getStableEraEnterChance(hasFinalLog: boolean, counselBonus = 0): number {
    const base = hasFinalLog ? 0.08 : 0.18;
    return THREE.MathUtils.clamp(base + counselBonus, 0.05, 0.32);
  }

  shouldForceStableEra(hasFinalLog: boolean, thresholdOffset = 0): boolean {
    if (hasFinalLog) {
      return false;
    }
    if (this.enteredStableThisRun) {
      return false;
    }
    const threshold = THREE.MathUtils.clamp(8 + thresholdOffset, 5, 12);
    return this.chaoticTransitionsThisRun >= threshold;
  }

  static loadMasterVolume(): number {
    try {
      const raw = localStorage.getItem(VOLUME_KEY);
      if (raw === null) {
        return 0.78;
      }
      const value = Number.parseFloat(raw);
      return Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0.78;
    } catch {
      return 0.78;
    }
  }

  static saveMasterVolume(value: number): void {
    localStorage.setItem(VOLUME_KEY, String(THREE.MathUtils.clamp(value, 0, 1)));
  }
}
