import type { NarrationDirector } from '../audio/NarrationDirector';
import type { Locale } from '../i18n/locale';
import type { StoryBeatCopy } from '../narrative/storyContent';

export class StoryOverlay {
  private onCloseCallback: (() => void) | null = null;

  constructor(
    private readonly overlay: HTMLElement,
    private readonly eyebrowEl: HTMLElement,
    private readonly titleEl: HTMLElement,
    private readonly bodyEl: HTMLElement,
    private readonly continueButton: HTMLButtonElement,
    private readonly narration: NarrationDirector,
    private readonly getVolume: () => number,
  ) {
    continueButton.addEventListener('click', () => {
      this.close();
    });

    window.addEventListener('keydown', (event) => {
      if (this.overlay.classList.contains('hidden')) {
        return;
      }
      if (event.code === 'Escape' || event.code === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        event.stopPropagation();
        this.close();
      }
    });
  }

  isOpen(): boolean {
    return !this.overlay.classList.contains('hidden');
  }

  show(beat: StoryBeatCopy, locale: Locale, onClose: () => void): void {
    this.onCloseCallback = onClose;
    this.eyebrowEl.textContent = beat.eyebrow;
    this.titleEl.textContent = beat.title;
    this.bodyEl.textContent = beat.body;
    this.continueButton.textContent = locale === 'zh' ? '继续' : 'Continue';
    this.overlay.classList.remove('hidden');
    if (this.narration.isEnabled()) {
      this.narration.speak(`${beat.title}. ${beat.body}`, locale, this.getVolume());
    }
  }

  close(): void {
    if (this.overlay.classList.contains('hidden')) {
      return;
    }
    this.narration.cancel();
    this.overlay.classList.add('hidden');
    const callback = this.onCloseCallback;
    this.onCloseCallback = null;
    callback?.();
  }
}
