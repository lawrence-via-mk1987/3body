import type { NarrationDirector } from '../audio/NarrationDirector';
import { getCinematicCards, getIntroUi, type CinematicCard } from '../i18n/introContent';
import type { Locale } from '../i18n/locale';
import { markCinematicSeen } from '../i18n/locale';

export class IntroCinematic {
  private cards: CinematicCard[] = [];
  private index = 0;
  private locale: Locale = 'en';
  private onCompleteCallback: (() => void) | null = null;
  private onUserGestureCallback: (() => void) | null = null;
  private narrationVolume = 0.55;

  constructor(
    private readonly overlay: HTMLElement,
    private readonly eyebrowEl: HTMLElement,
    private readonly titleEl: HTMLElement,
    private readonly bodyEl: HTMLElement,
    private readonly skipButton: HTMLButtonElement,
    private readonly nextButton: HTMLButtonElement,
    private readonly narrationCheckbox: HTMLInputElement,
    private readonly narrationLabel: HTMLElement,
    private readonly narration: NarrationDirector,
    private readonly onNarrationPrefChange: (enabled: boolean) => void,
    private readonly onCinematicBed: (active: boolean) => void,
  ) {
    skipButton.addEventListener('click', () => {
      this.notifyUserGesture();
      this.finish(true);
    });
    nextButton.addEventListener('click', () => {
      this.advance();
    });

    narrationCheckbox.addEventListener('change', () => {
      this.narration.setEnabled(narrationCheckbox.checked);
      this.onNarrationPrefChange(narrationCheckbox.checked);
      if (!narrationCheckbox.checked) {
        this.narration.cancel();
      } else {
        this.speakCurrent();
      }
    });

    window.addEventListener('keydown', (event) => {
      if (this.overlay.classList.contains('hidden')) {
        return;
      }
      if (event.code === 'Escape') {
        event.preventDefault();
        this.finish(true);
        return;
      }
      if (event.code === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        this.advance();
      }
    });
  }

  setLocale(locale: Locale): void {
    this.locale = locale;
    const ui = getIntroUi(locale);
    this.skipButton.textContent = ui.cinematicSkip;
    this.narrationLabel.textContent = ui.narrationLabel;
  }

  setNarrationVolume(volume: number): void {
    this.narrationVolume = volume;
  }

  setOnUserGesture(callback: () => void): void {
    this.onUserGestureCallback = callback;
  }

  private notifyUserGesture(): void {
    this.onUserGestureCallback?.();
  }

  isOpen(): boolean {
    return !this.overlay.classList.contains('hidden');
  }

  play(locale: Locale, onComplete: () => void): void {
    this.locale = locale;
    this.cards = getCinematicCards(locale);
    this.index = 0;
    this.onCompleteCallback = onComplete;
    this.setLocale(locale);
    this.narrationCheckbox.checked = this.narration.isEnabled();
    this.overlay.classList.remove('hidden');
    this.onCinematicBed(true);
    this.renderCard();
  }

  private renderCard(): void {
    const card = this.cards[this.index];
    if (!card) {
      this.finish(false);
      return;
    }

    const ui = getIntroUi(this.locale);
    this.eyebrowEl.textContent = card.eyebrow;
    this.titleEl.textContent = card.title;
    this.bodyEl.textContent = card.body;
    this.nextButton.textContent = this.index >= this.cards.length - 1
      ? ui.cinematicFinish
      : ui.cinematicNext;

    this.speakCurrent();
  }

  private speakCurrent(): void {
    const card = this.cards[this.index];
    if (!card) {
      return;
    }
    this.narration.speakParts([card.title, card.body], this.locale, this.narrationVolume);
  }

  private advance(): void {
    this.notifyUserGesture();
    this.narration.cancel();
    if (this.index >= this.cards.length - 1) {
      this.finish(false);
      return;
    }
    this.index += 1;
    this.renderCard();
  }

  private finish(skipped: boolean): void {
    this.narration.cancel();
    this.onCinematicBed(false);
    this.overlay.classList.add('hidden');
    markCinematicSeen();
    if (skipped) {
      // still marked seen
    }
    this.onCompleteCallback?.();
    this.onCompleteCallback = null;
  }
}
