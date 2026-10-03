export interface MobileHudSheetHooks {
  onOpen?: () => void;
  onClose?: () => void;
  getLocale?: () => 'en' | 'zh';
}

export class MobileHudSheet {
  private open = false;

  constructor(
    private readonly sheet: HTMLElement,
    private readonly backdrop: HTMLElement,
    closeButtons: HTMLButtonElement | HTMLButtonElement[],
    private readonly toggleButtons: HTMLButtonElement[],
    private readonly hooks: MobileHudSheetHooks = {},
  ) {
    const closes = Array.isArray(closeButtons) ? closeButtons : [closeButtons];
    for (const button of closes) {
      this.bindDismiss(button);
    }
    this.bindDismiss(backdrop);

    for (const button of toggleButtons) {
      this.bindToggle(button);
    }
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
    this.sheet.classList.add('hidden');
    this.backdrop.classList.add('hidden');
    this.sheet.setAttribute('aria-hidden', 'true');
    this.backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('mobile-hud-sheet-open');
    this.syncToggleLabels(false);
    if (this.open) {
      this.open = false;
      this.hooks.onClose?.();
    }
  }

  private openSheet(): void {
    this.sheet.classList.remove('hidden');
    this.backdrop.classList.remove('hidden');
    this.sheet.setAttribute('aria-hidden', 'false');
    this.backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('mobile-hud-sheet-open');
    this.syncToggleLabels(true);
    if (!this.open) {
      this.open = true;
      this.hooks.onOpen?.();
    }
  }

  private bindDismiss(target: HTMLElement): void {
    const dismiss = (event: Event) => {
      if (!this.open) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.close();
    };
    target.addEventListener('pointerup', dismiss);
    if (target instanceof HTMLButtonElement) {
      target.addEventListener('click', dismiss);
    }
  }

  private bindToggle(button: HTMLButtonElement): void {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.toggle();
    });
  }

  private syncToggleLabels(sheetOpen: boolean): void {
    const locale = this.hooks.getLocale?.() ?? 'en';
    const openLabel = locale === 'zh' ? '天空' : 'Sky';
    const closeLabel = locale === 'zh' ? '关闭' : 'Close';
    const label = sheetOpen ? closeLabel : openLabel;
    for (const button of this.toggleButtons) {
      button.textContent = label;
      button.setAttribute('aria-expanded', sheetOpen ? 'true' : 'false');
    }
  }
}
