export class PauseMenu {
  private openState = false;

  constructor(
    private readonly overlay: HTMLElement,
    resumeButton: HTMLButtonElement,
    quitButton: HTMLButtonElement,
    private readonly onResume: () => void,
    private readonly onQuit: () => void,
  ) {
    resumeButton.addEventListener('click', () => {
      this.onResume();
    });
    quitButton.addEventListener('click', () => {
      this.onQuit();
    });
  }

  isOpen(): boolean {
    return this.openState;
  }

  show(): void {
    this.overlay.classList.remove('hidden');
    this.openState = true;
  }

  hide(): void {
    this.overlay.classList.add('hidden');
    this.openState = false;
  }
}
