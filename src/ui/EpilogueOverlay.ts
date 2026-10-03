export class EpilogueOverlay {
  constructor(
    private readonly overlay: HTMLElement,
    private readonly bodyEl: HTMLElement,
    restartButton: HTMLButtonElement,
    private onRestart: () => void,
  ) {
    restartButton.addEventListener('click', () => {
      this.hide();
      this.onRestart();
    });
  }

  show(bodyText: string): void {
    this.bodyEl.textContent = bodyText;
    this.overlay.classList.remove('hidden');
  }

  hide(): void {
    this.overlay.classList.add('hidden');
  }

  isVisible(): boolean {
    return !this.overlay.classList.contains('hidden');
  }
}
