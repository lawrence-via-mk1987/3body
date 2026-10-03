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

  show(locale: 'en' | 'zh'): void {
    this.button.textContent = locale === 'zh' ? '启用声音' : 'Enable sound';
    const label = this.banner.querySelector('.sound-unlock-text');
    if (label) {
      label.textContent = locale === 'zh'
        ? '轻触以启用环境音（请关闭静音模式）'
        : 'Tap to enable ambience (turn off silent mode on iPhone)';
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
