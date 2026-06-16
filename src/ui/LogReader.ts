import type { TextLog } from '../narrative/logs';

export class LogReader {
  private openState = false;
  private onCloseCallback: (() => void) | null = null;

  constructor(
    private readonly overlay: HTMLElement,
    private readonly title: HTMLElement,
    private readonly body: HTMLElement,
    closeButton: HTMLButtonElement,
  ) {
    closeButton.addEventListener('click', () => {
      this.close();
    });
  }

  onClose(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  isOpen(): boolean {
    return this.openState;
  }

  open(log: TextLog): void {
    this.title.textContent = log.title;
    this.body.textContent = log.body;
    this.overlay.classList.remove('hidden');
    this.openState = true;
  }

  close(): void {
    this.overlay.classList.add('hidden');
    this.openState = false;
    this.onCloseCallback?.();
  }
}
