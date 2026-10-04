import { getDisclaimerHtml } from '../i18n/disclaimer';
import { getCinematicReplayUi, type MenuCutsceneReplayId } from '../i18n/cinematicReplay';
import { getIntroUi, getWorldIntro } from '../i18n/introContent';
import {
  loadLocale,
  loadMusicEnabled,
  loadNarrationEnabled,
  saveLocale,
  saveMusicEnabled,
  saveNarrationEnabled,
  type Locale,
} from '../i18n/locale';

const REPLAY_IDS: MenuCutsceneReplayId[] = [
  'opening',
  'radio',
  'distant_sky',
  'exodus',
  'death',
];

export class LocaleMenu {
  private locale: Locale = 'en';

  constructor(
    private readonly worldIntroBody: HTMLElement,
    private readonly worldIntroSummary: HTMLElement,
    private readonly controlsSummary: HTMLElement,
    private readonly localeEnButton: HTMLButtonElement,
    private readonly localeZhButton: HTMLButtonElement,
    private readonly localeJaButton: HTMLButtonElement,
    private readonly languageLabel: HTMLElement,
    private readonly replayCinematicButton: HTMLButtonElement,
    private readonly replayCutsceneLabel: HTMLElement,
    private readonly replayCutsceneSelect: HTMLSelectElement,
    private readonly replayCutsceneButton: HTMLButtonElement,
    private readonly disclaimerEl: HTMLElement,
    private readonly menuNarrationCheckbox: HTMLInputElement,
    private readonly menuNarrationLabel: HTMLElement,
    private readonly menuMusicCheckbox: HTMLInputElement,
    private readonly menuMusicLabel: HTMLElement,
    private readonly onLocaleChange: (locale: Locale) => void,
    private readonly onReplayCinematic: () => void,
    private readonly onReplayCutscene: (id: MenuCutsceneReplayId) => void,
    private readonly onNarrationChange: (enabled: boolean) => void,
    private readonly onMusicChange: (enabled: boolean) => void,
  ) {
    this.locale = loadLocale();
    this.apply(this.locale);
    this.menuNarrationCheckbox.checked = loadNarrationEnabled();
    this.menuMusicCheckbox.checked = loadMusicEnabled();

    localeEnButton.addEventListener('click', () => {
      this.setLocale('en');
    });
    localeZhButton.addEventListener('click', () => {
      this.setLocale('zh');
    });
    localeJaButton.addEventListener('click', () => {
      this.setLocale('ja');
    });

    replayCinematicButton.addEventListener('click', () => {
      this.onReplayCinematic();
    });

    replayCutsceneButton.addEventListener('click', () => {
      const id = replayCutsceneSelect.value as MenuCutsceneReplayId;
      if (REPLAY_IDS.includes(id)) {
        this.onReplayCutscene(id);
      }
    });

    this.menuNarrationCheckbox.addEventListener('change', () => {
      saveNarrationEnabled(this.menuNarrationCheckbox.checked);
      this.onNarrationChange(this.menuNarrationCheckbox.checked);
    });

    this.menuMusicCheckbox.addEventListener('change', () => {
      saveMusicEnabled(this.menuMusicCheckbox.checked);
      this.onMusicChange(this.menuMusicCheckbox.checked);
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
    const replayUi = getCinematicReplayUi(locale);
    const world = getWorldIntro(locale);

    this.languageLabel.textContent = ui.languageLabel;
    this.worldIntroSummary.textContent = ui.worldIntroSummary;
    this.controlsSummary.textContent = ui.controlsSummary;
    this.replayCinematicButton.textContent = ui.replayCinematic;
    this.replayCutsceneLabel.textContent = replayUi.replayCutsceneLabel;
    this.replayCutsceneButton.textContent = replayUi.replayCutscenePlay;
    this.menuNarrationLabel.textContent = ui.narrationLabel;
    this.menuMusicLabel.textContent = ui.musicLabel;
    this.localeEnButton.textContent = ui.localeEn;
    this.localeZhButton.textContent = ui.localeZh;
    this.localeJaButton.textContent = ui.localeJa;
    this.disclaimerEl.innerHTML = getDisclaimerHtml(locale);
    this.localeEnButton.classList.toggle('active', locale === 'en');
    this.localeZhButton.classList.toggle('active', locale === 'zh');
    this.localeJaButton.classList.toggle('active', locale === 'ja');
    this.localeEnButton.setAttribute('aria-pressed', locale === 'en' ? 'true' : 'false');
    this.localeZhButton.setAttribute('aria-pressed', locale === 'zh' ? 'true' : 'false');
    this.localeJaButton.setAttribute('aria-pressed', locale === 'ja' ? 'true' : 'false');

    for (const id of REPLAY_IDS) {
      const option = this.replayCutsceneSelect.querySelector(`option[value="${id}"]`);
      if (option) {
        option.textContent = replayUi.options[id];
      }
    }

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
