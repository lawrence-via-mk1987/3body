import { getDisclaimerHtml } from '../i18n/disclaimer';
import { getIntroUi, getWorldIntro } from '../i18n/introContent';
import {
  loadLocale,
  loadNarrationEnabled,
  saveLocale,
  saveNarrationEnabled,
  type Locale,
} from '../i18n/locale';

export class LocaleMenu {
  private locale: Locale = 'en';

  constructor(
    private readonly worldIntroBody: HTMLElement,
    private readonly worldIntroSummary: HTMLElement,
    private readonly controlsSummary: HTMLElement,
    private readonly localeEnButton: HTMLButtonElement,
    private readonly localeZhButton: HTMLButtonElement,
    private readonly languageLabel: HTMLElement,
    private readonly replayCinematicButton: HTMLButtonElement,
    private readonly disclaimerEl: HTMLElement,
    private readonly menuNarrationCheckbox: HTMLInputElement,
    private readonly menuNarrationLabel: HTMLElement,
    private readonly onLocaleChange: (locale: Locale) => void,
    private readonly onReplayCinematic: () => void,
    private readonly onNarrationChange: (enabled: boolean) => void,
  ) {
    this.locale = loadLocale();
    this.apply(this.locale);
    menuNarrationCheckbox.checked = loadNarrationEnabled();

    localeEnButton.addEventListener('click', () => {
      this.setLocale('en');
    });
    localeZhButton.addEventListener('click', () => {
      this.setLocale('zh');
    });

    replayCinematicButton.addEventListener('click', () => {
      this.onReplayCinematic();
    });

    menuNarrationCheckbox.addEventListener('change', () => {
      saveNarrationEnabled(menuNarrationCheckbox.checked);
      this.onNarrationChange(menuNarrationCheckbox.checked);
    });
  }

  getLocale(): Locale {
    return this.locale;
  }

  setLocale(locale: Locale): void {
    this.locale = locale;
    saveLocale(locale);
    this.apply(locale);
    this.onLocaleChange(locale);
  }

  private apply(locale: Locale): void {
    const ui = getIntroUi(locale);
    const world = getWorldIntro(locale);

    this.languageLabel.textContent = ui.languageLabel;
    this.worldIntroSummary.textContent = ui.worldIntroSummary;
    this.controlsSummary.textContent = ui.controlsSummary;
    this.replayCinematicButton.textContent = ui.replayCinematic;
    this.menuNarrationLabel.textContent = ui.narrationLabel;
    this.disclaimerEl.innerHTML = getDisclaimerHtml(locale);
    this.localeEnButton.classList.toggle('active', locale === 'en');
    this.localeZhButton.classList.toggle('active', locale === 'zh');
    this.localeEnButton.setAttribute('aria-pressed', locale === 'en' ? 'true' : 'false');
    this.localeZhButton.setAttribute('aria-pressed', locale === 'zh' ? 'true' : 'false');

    this.worldIntroBody.replaceChildren();
    for (const html of world.paragraphs) {
      const p = document.createElement('p');
      p.innerHTML = html;
      this.worldIntroBody.append(p);
    }
    const you = document.createElement('p');
    you.className = 'world-intro-you';
    you.innerHTML = world.youLine;
    this.worldIntroBody.append(you);
  }
}
