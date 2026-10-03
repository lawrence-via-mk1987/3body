export type RegistrarCounsel = 'survivors' | 'memorial';
export type PredictorCounsel = 'endurance' | 'numbers';
export type GroveCounsel = 'hope' | 'caution';

export interface CounselSnapshot {
  registrar: RegistrarCounsel | null;
  predictor: PredictorCounsel | null;
  grove: GroveCounsel | null;
}

const STORAGE_KEY = '3body_counsel_choices';

export class CounselChoices {
  private snapshot: CounselSnapshot = {
    registrar: null,
    predictor: null,
    grove: null,
  };

  constructor() {
    this.load();
  }

  getSnapshot(): Readonly<CounselSnapshot> {
    return this.snapshot;
  }

  setRegistrar(choice: RegistrarCounsel): void {
    if (this.snapshot.registrar !== null) {
      return;
    }
    this.snapshot.registrar = choice;
    this.save();
  }

  setPredictor(choice: PredictorCounsel): void {
    if (this.snapshot.predictor !== null) {
      return;
    }
    this.snapshot.predictor = choice;
    this.save();
  }

  setGrove(choice: GroveCounsel): void {
    if (this.snapshot.grove !== null) {
      return;
    }
    this.snapshot.grove = choice;
    this.save();
  }

  /** Small meta bonuses — narrative choices nudge the sky, not dominate it. */
  getStableChanceBonus(): number {
    let bonus = 0;
    if (this.snapshot.registrar === 'survivors') {
      bonus += 0.035;
    }
    if (this.snapshot.registrar === 'memorial') {
      bonus += 0.015;
    }
    if (this.snapshot.predictor === 'endurance') {
      bonus += 0.025;
    }
    if (this.snapshot.predictor === 'numbers') {
      bonus += 0.02;
    }
    if (this.snapshot.grove === 'caution') {
      bonus += 0.02;
    }
    if (this.snapshot.grove === 'hope') {
      bonus += 0.01;
    }
    return bonus;
  }

  /** Fewer chaotic phases before a pity Stable Era (memorial / endurance). */
  getForceStableThresholdOffset(): number {
    let offset = 0;
    if (this.snapshot.registrar === 'memorial') {
      offset -= 1;
    }
    if (this.snapshot.predictor === 'endurance') {
      offset -= 1;
    }
    if (this.snapshot.predictor === 'numbers') {
      offset += 1;
    }
    return offset;
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Partial<CounselSnapshot>;
      this.snapshot = {
        registrar: parsed.registrar ?? null,
        predictor: parsed.predictor ?? null,
        grove: parsed.grove ?? null,
      };
    } catch {
      // ignore
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot));
  }
}
