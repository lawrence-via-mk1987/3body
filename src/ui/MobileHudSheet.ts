export class MobileHudSheet {
  private open = false;

  constructor(
    private readonly sheet: HTMLElement,
    private readonly backdrop: HTMLElement,
    closeButton: HTMLButtonElement,
    openButton: HTMLButtonElement | null,
  ) {
    const dismiss = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    };

    closeButton.addEventListener('click', dismiss);
    closeButton.addEventListener('touchend', dismiss, { passive: false });
    backdrop.addEventListener('click', () => this.close());
    backdrop.addEventListener('touchend', (event) => {
      event.preventDefault();
      this.close();
    }, { passive: false });

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
    this.sheet.setAttribute('aria-hidden', 'true');
    this.backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('mobile-hud-sheet-open');
    this.open = false;
  }

  private openSheet(): void {
    this.sheet.classList.remove('hidden');
    this.backdrop.classList.remove('hidden');
    this.sheet.setAttribute('aria-hidden', 'false');
    this.backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('mobile-hud-sheet-open');
    this.open = true;
  }
}
