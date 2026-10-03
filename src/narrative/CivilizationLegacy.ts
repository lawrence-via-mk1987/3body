const CYCLES_CLEARED_KEY = '3body_cycles_cleared';

/** Meta progression across epilogue completions (Final Log read). */
export class CivilizationLegacy {
  private cyclesCleared = 0;

  constructor() {
    this.load();
  }

  getCyclesCleared(): number {
    return this.cyclesCleared;
  }

  /** 0 = wasteland clans … 4 = late unified cycle (fan-inspired abstract tiers). */
  getStage(): number {
    if (this.cyclesCleared >= 5) {
      return 4;
    }
    if (this.cyclesCleared >= 3) {
      return 3;
    }
    if (this.cyclesCleared >= 2) {
      return 2;
    }
    if (this.cyclesCleared >= 1) {
      return 1;
    }
    return 0;
  }

  recordCycleCleared(): void {
    this.cyclesCleared += 1;
    this.save();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(CYCLES_CLEARED_KEY);
      if (raw === null) {
        return;
      }
      const n = Number.parseInt(raw, 10);
      if (Number.isFinite(n) && n >= 0) {
        this.cyclesCleared = n;
      }
    } catch {
      // ignore
    }
  }

  private save(): void {
    localStorage.setItem(CYCLES_CLEARED_KEY, String(this.cyclesCleared));
  }
}
