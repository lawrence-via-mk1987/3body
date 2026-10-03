export class MobileHudSheet {
  private open = false;

  constructor(
    private readonly sheet: HTMLElement,
    private readonly backdrop: HTMLElement,
    closeButton: HTMLButtonElement,
    openButton: HTMLButtonElement | null,
  ) {
    closeButton.addEventListener('click', () => this.close());
    backdrop.addEventListener('click', () => this.close());
    openButton?.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggle();
    });
  }

  isOpen(): boolean {
    return this.open;
  }

  toggle(): void {
    if (this.open) {
      this.close();
    } else {
      this.openSheet();
    }
  }

  close(): void {
    if (!this.open) {
      return;
    }
    this.sheet.classList.add('hidden');
    this.backdrop.classList.add('hidden');
    this.open = false;
  }

  private openSheet(): void {
    this.sheet.classList.remove('hidden');
    this.backdrop.classList.remove('hidden');
    this.open = true;
  }
}
