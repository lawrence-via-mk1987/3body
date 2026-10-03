import type { TextLog } from '../narrative/logs';

export class LogReader {
  private openState = false;
  private onCloseCallback: (() => void) | null = null;
  private onOpenCallback: (() => void) | null = null;

  constructor(
    private readonly overlay: HTMLElement,
    private readonly title: HTMLElement,
    private readonly body: HTMLElement,
    private readonly closeButton: HTMLButtonElement,
  ) {
    closeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.close();
    });

    this.overlay.addEventListener('click', (event) => {
      if (event.target === this.overlay) {
        this.close();
      }
    });

    window.addEventListener('keydown', (event) => {
      if (!this.openState) {
        return;
      }
      if (event.code === 'Escape' || event.code === 'Enter' || event.code === 'NumpadEnter') {
        event.preventDefault();
        event.stopPropagation();
        this.close();
      }
    });
  }

  onOpen(callback: () => void): void {
    this.onOpenCallback = callback;
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
    this.onOpenCallback?.();
    this.closeButton.focus();
  }

  close(): void {
    if (!this.openState) {
      return;
    }
    this.overlay.classList.add('hidden');
    this.openState = false;
    this.onCloseCallback?.();
  }
}
