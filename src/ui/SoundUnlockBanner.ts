export class SoundUnlockBanner {
  constructor(
    private readonly banner: HTMLElement,
    private readonly button: HTMLButtonElement,
    private readonly onUnlock: () => void,
  ) {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      this.onUnlock();
    });
  }

  show(locale: import('../i18n/locale').Locale): void {
    this.button.textContent =
      locale === 'zh' ? '启用声音' : locale === 'ja' ? '音を有効にする' : 'Enable sound';
    const label = this.banner.querySelector('.sound-unlock-text');
    if (label) {
      label.textContent =
        locale === 'zh'
          ? '轻触以启用环境音（请关闭静音模式）'
          : locale === 'ja'
            ? 'タップして環境音を有効に（iPhone は消音を解除）'
            : 'Tap to enable ambience and voice (turn off silent mode on iPhone)';
    }
    this.banner.classList.remove('hidden');
  }

  hide(): void {
    this.banner.classList.add('hidden');
  }

  isVisible(): boolean {
    return !this.banner.classList.contains('hidden');
  }
}
