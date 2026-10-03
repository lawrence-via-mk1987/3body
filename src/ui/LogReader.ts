import type { TextLog } from '../narrative/logs';

export class LogReader {
  private openState = false;
  private onCloseCallback: (() => void) | null = null;
  private onOpenCallback: (() => void) | null = null;
  private gallery: TextLog[] | null = null;
  private galleryIndex = 0;

  constructor(
    private readonly overlay: HTMLElement,
    private readonly title: HTMLElement,
    private readonly body: HTMLElement,
    private readonly closeButton: HTMLButtonElement,
    private readonly navRow: HTMLElement,
    private readonly prevButton: HTMLButtonElement,
    private readonly nextButton: HTMLButtonElement,
    private readonly navIndicator: HTMLElement,
    private readonly actionHint: HTMLElement,
  ) {
    closeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.close();
    });

    prevButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.step(-1);
    });

    nextButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.step(1);
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

  open(log: TextLog, actionHint: string | null = null): void {
    this.gallery = null;
    this.galleryIndex = 0;
    this.showLog(log, actionHint);
    this.updateNavigation();
    this.overlay.classList.remove('hidden');
    this.openState = true;
    this.onOpenCallback?.();
    this.closeButton.focus();
  }

  openFromJournal(log: TextLog, gallery: TextLog[]): void {
    const index = gallery.findIndex((entry) => entry.id === log.id);
    this.gallery = gallery.length > 1 ? gallery : null;
    this.galleryIndex = index >= 0 ? index : 0;
    this.showLog(gallery[this.galleryIndex] ?? log, null);
    this.updateNavigation();
    this.overlay.classList.remove('hidden');
    this.openState = true;
    this.onOpenCallback?.();
    this.closeButton.focus();
  }

  private showLog(log: TextLog, actionHint: string | null): void {
    this.title.textContent = log.title;
    this.body.textContent = log.body;
    if (actionHint) {
      this.actionHint.textContent = actionHint;
      this.actionHint.classList.remove('hidden');
    } else {
      this.actionHint.textContent = '';
      this.actionHint.classList.add('hidden');
    }
  }

  private step(delta: number): void {
    if (!this.gallery || this.gallery.length < 2) {
      return;
    }
    this.galleryIndex = (this.galleryIndex + delta + this.gallery.length) % this.gallery.length;
    this.showLog(this.gallery[this.galleryIndex]!, null);
    this.updateNavigation();
  }

  private updateNavigation(): void {
    if (!this.gallery || this.gallery.length < 2) {
      this.navRow.classList.add('hidden');
      return;
    }
    this.navRow.classList.remove('hidden');
    this.navIndicator.textContent = `${this.galleryIndex + 1} / ${this.gallery.length}`;
    this.prevButton.disabled = false;
    this.nextButton.disabled = false;
  }

  close(): void {
    if (!this.openState) {
      return;
    }
    this.overlay.classList.add('hidden');
    this.openState = false;
    this.gallery = null;
    this.navRow.classList.add('hidden');
    this.onCloseCallback?.();
  }
}
