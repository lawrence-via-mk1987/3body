const STORAGE_KEY = '3body_forecast_calibrated';

export class ForecastMeta {
  private calibrated = false;

  constructor() {
    this.load();
  }

  isCalibrated(): boolean {
    return this.calibrated;
  }

  calibrate(): void {
    this.calibrated = true;
    localStorage.setItem(STORAGE_KEY, '1');
  }

  /** Added to each forecast slot confidence when predictor is calibrated. */
  getConfidenceBonus(): number {
    return this.calibrated ? 0.18 : 0;
  }

  private load(): void {
    try {
      this.calibrated = localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      this.calibrated = false;
    }
  }
}
