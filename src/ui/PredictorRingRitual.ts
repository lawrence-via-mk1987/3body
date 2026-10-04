import type { CinematicReplayUi } from '../i18n/cinematicReplay';
import type { EraPhase } from '../orbital/types';

const PHASE_ORDER: EraPhase[] = [
  'deep_cold',
  'thaw',
  'scorch',
  'binary_chaos',
  'tri_solar',
  'flying_star',
  'eclipse_relief',
  'stable_golden',
];

export type PredictorRitualResult = 'success' | 'fail' | 'cancel';

export class PredictorRingRitual {
  private openState = false;
  private ringAngles = [0, 0, 0];
  private targetIndex = 0;
  private onDone: ((result: PredictorRitualResult) => void) | null = null;

  constructor(
    private readonly overlay: HTMLElement,
    private readonly ringEls: [HTMLElement, HTMLElement, HTMLElement],
    private readonly hintEl: HTMLElement,
    private readonly lockButton: HTMLButtonElement,
    private readonly cancelButton: HTMLButtonElement,
    private readonly rotateButtons: HTMLButtonElement[],
  ) {
    lockButton.addEventListener('click', () => this.tryLock());
    cancelButton.addEventListener('click', () => this.finish('cancel'));
    rotateButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const ring = index % 3;
        this.ringAngles[ring] = (this.ringAngles[ring]! + 45) % 360;
        this.renderRings();
      });
    });
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        this.finish('cancel');
      }
    });
  }

  isOpen(): boolean {
    return this.openState;
  }

  applyLabels(ui: CinematicReplayUi): void {
    this.lockButton.textContent = ui.predictorRitualLock;
    this.cancelButton.textContent = ui.predictorRitualCancel;
    this.rotateButtons.forEach((btn) => {
      btn.textContent = ui.predictorRitualRotate;
    });
  }

  open(currentPhase: EraPhase, hint: string, onDone: (result: PredictorRitualResult) => void): void {
    this.targetIndex = PHASE_ORDER.indexOf(currentPhase);
    this.ringAngles = [
      Math.floor(Math.random() * 8) * 45,
      Math.floor(Math.random() * 8) * 45,
      Math.floor(Math.random() * 8) * 45,
    ];
    this.hintEl.textContent = hint;
    this.onDone = onDone;
    this.renderRings();
    this.overlay.classList.remove('hidden');
    this.openState = true;
  }

  private renderRings(): void {
    this.ringEls.forEach((el, i) => {
      el.style.transform = `rotate(${this.ringAngles[i]}deg)`;
    });
  }

  private tryLock(): void {
    const target = this.targetIndex * 45;
    const ok = this.ringAngles.every((a) => angleDelta(a, target) <= 22);
    this.finish(ok ? 'success' : 'fail');
  }

  private finish(result: PredictorRitualResult): void {
    if (!this.openState) {
      return;
    }
    this.overlay.classList.add('hidden');
    this.openState = false;
    const cb = this.onDone;
    this.onDone = null;
    cb?.(result);
  }
}

function angleDelta(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
