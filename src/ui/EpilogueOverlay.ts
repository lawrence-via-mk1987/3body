export class EpilogueOverlay {
  constructor(
    private readonly overlay: HTMLElement,
    restartButton: HTMLButtonElement,
    private onRestart: () => void,
  ) {
    restartButton.addEventListener('click', () => {
      this.hide();
      this.onRestart();
    });
  }

  show(): void {
    this.overlay.classList.remove('hidden');
  }

  hide(): void {
    this.overlay.classList.add('hidden');
  }

  isVisible(): boolean {
    return !this.overlay.classList.contains('hidden');
  }
}
