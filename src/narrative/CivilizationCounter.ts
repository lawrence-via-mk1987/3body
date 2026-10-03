const STORAGE_KEY = '3body_civilization_number';

/** First fresh run after install displays as civilization 188 (Three-Body style). */
const INITIAL_DISPLAY_NUMBER = 187;

export class CivilizationCounter {
  private number = INITIAL_DISPLAY_NUMBER;

  constructor() {
    this.load();
  }

  getNumber(): number {
    return this.number;
  }

  /** Call when a run starts. Fresh runs advance the counter; checkpoint resumes keep it. */
  beginRun(fromCheckpoint: boolean, checkpointCycle?: number): number {
    if (fromCheckpoint && checkpointCycle !== undefined) {
      this.number = checkpointCycle;
      return this.number;
    }
    if (!fromCheckpoint) {
      this.number += 1;
      this.save();
    }
    return this.number;
  }

  formatLabel(locale: 'en' | 'zh'): string {
    if (locale === 'zh') {
      return `文明 #${this.number}`;
    }
    return `Civilization #${this.number}`;
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return;
      }
      const parsed = Number.parseInt(raw, 10);
      if (Number.isFinite(parsed) && parsed >= 1) {
        this.number = parsed;
      }
    } catch {
      // ignore
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, String(this.number));
  }
}
