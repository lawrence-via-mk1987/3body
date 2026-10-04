import { NarrationDirector } from './audio/NarrationDirector';
import { Game } from './core/Game';
import { getCinematicReplayUi, type MenuCutsceneReplayId } from './i18n/cinematicReplay';
import { cinematicSeen, loadLocale, loadMusicEnabled, saveMusicEnabled } from './i18n/locale';
import { PredictorRingRitual } from './ui/PredictorRingRitual';
import { getMenuTagline, getMobileChromeCopy } from './i18n/uiStrings';
import { EpilogueOverlay } from './ui/EpilogueOverlay';
import { IntroCinematic } from './ui/IntroCinematic';
import { LocaleMenu } from './ui/LocaleMenu';
import { ForecastStrip } from './ui/ForecastStrip';
import { DialoguePanel } from './ui/DialoguePanel';
import { HudCompass } from './ui/HudCompass';
import { Journal } from './ui/Journal';
import { LogReader } from './ui/LogReader';
import { PauseMenu } from './ui/PauseMenu';
import { StableEraBanner } from './ui/StableEraBanner';
import { StoryOverlay } from './ui/StoryOverlay';
import { Toast } from './ui/Toast';
import { CheckpointSave } from './save/CheckpointSave';
import { MetaProgress } from './narrative/MetaProgress';
import { applyDeviceProfileToDocument, detectDeviceProfile } from './platform/deviceProfile';
import type { MobileChromeElements } from './ui/mobileChrome';
import type { MobileHudBundle } from './ui/mobileHudBundle';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const overlay = document.querySelector<HTMLDivElement>('#overlay');
const hud = document.querySelector<HTMLDivElement>('#hud');
const hudInteraction = document.querySelector<HTMLDivElement>('#hud-interaction');
const hudCompactHint = document.querySelector<HTMLParagraphElement>('#hud-compact-hint');
const deathOverlay = document.querySelector<HTMLDivElement>('#death-overlay');
const epilogueOverlay = document.querySelector<HTMLDivElement>('#epilogue-overlay');
const pauseOverlay = document.querySelector<HTMLDivElement>('#pause-overlay');
const stableBanner = document.querySelector<HTMLDivElement>('#stable-banner');
const stableBannerSubtitle = document.querySelector<HTMLParagraphElement>('#stable-banner-subtitle');
const logReaderOverlay = document.querySelector<HTMLDivElement>('#log-reader');
const journalOverlay = document.querySelector<HTMLDivElement>('#journal');
const dialogueOverlay = document.querySelector<HTMLDivElement>('#dialogue-overlay');
const dialogueSpeaker = document.querySelector<HTMLHeadingElement>('#dialogue-speaker');
const dialogueBody = document.querySelector<HTMLParagraphElement>('#dialogue-body');
const dialogueChoices = document.querySelector<HTMLDivElement>('#dialogue-choices');
const dialogueCloseButton = document.querySelector<HTMLButtonElement>('#dialogue-close');
const hudWayfinder = document.querySelector<HTMLDivElement>('#hud-wayfinder');
const hudWayfinderLabel = document.querySelector<HTMLSpanElement>('#hud-wayfinder-label');
const hudWayfinderArrow = document.querySelector<HTMLSpanElement>('#hud-wayfinder-arrow');
const forecastStripEl = document.querySelector<HTMLDivElement>('#forecast-strip');
const startButton = document.querySelector<HTMLButtonElement>('#start-btn');
const continueButton = document.querySelector<HTMLButtonElement>('#continue-btn');
const checkpointInfo = document.querySelector<HTMLParagraphElement>('#checkpoint-info');
const freshStartConfirm = document.querySelector<HTMLDivElement>('#fresh-start-confirm');
const freshStartConfirmButton = document.querySelector<HTMLButtonElement>('#fresh-start-confirm-btn');
const freshStartCancelButton = document.querySelector<HTMLButtonElement>('#fresh-start-cancel-btn');
const restartButton = document.querySelector<HTMLButtonElement>('#restart-btn');
const epilogueRestartButton = document.querySelector<HTMLButtonElement>('#epilogue-restart');
const pauseResumeButton = document.querySelector<HTMLButtonElement>('#pause-resume');
const pauseSaveButton = document.querySelector<HTMLButtonElement>('#pause-save');
const pauseDeleteCheckpointButton = document.querySelector<HTMLButtonElement>('#pause-delete-checkpoint');
const pauseQuitButton = document.querySelector<HTMLButtonElement>('#pause-quit');
const pauseCheckpointLine = document.querySelector<HTMLParagraphElement>('#pause-checkpoint-line');
const pauseVolumeSlider = document.querySelector<HTMLInputElement>('#pause-volume');
const pauseToastEl = document.querySelector<HTMLParagraphElement>('#pause-toast');
const logCloseButton = document.querySelector<HTMLButtonElement>('#log-close');
const logNavRow = document.querySelector<HTMLDivElement>('#log-nav');
const logPrevButton = document.querySelector<HTMLButtonElement>('#log-prev');
const logNextButton = document.querySelector<HTMLButtonElement>('#log-next');
const logNavIndicator = document.querySelector<HTMLSpanElement>('#log-nav-indicator');
const logActionHint = document.querySelector<HTMLParagraphElement>('#log-action-hint');
const journalEraList = document.querySelector<HTMLUListElement>('#journal-era-list');
const journalLogList = document.querySelector<HTMLUListElement>('#journal-log-list');
const journalLetterList = document.querySelector<HTMLUListElement>('#journal-letter-list');
const journalLettersHeading = document.querySelector<HTMLHeadingElement>('#journal-letters-heading');
const journalQuestList = document.querySelector<HTMLUListElement>('#journal-quest-list');
const journalQuestHeading = document.querySelector<HTMLHeadingElement>('#journal-quest-heading');
const journalLogCount = document.querySelector<HTMLSpanElement>('#journal-log-count');
const journalCloseButton = document.querySelector<HTMLButtonElement>('#journal-close');
const storyBeatOverlay = document.querySelector<HTMLDivElement>('#story-beat-overlay');
const storyBeatEyebrow = document.querySelector<HTMLParagraphElement>('#story-beat-eyebrow');
const storyBeatTitle = document.querySelector<HTMLHeadingElement>('#story-beat-title');
const storyBeatBody = document.querySelector<HTMLParagraphElement>('#story-beat-body');
const storyBeatContinue = document.querySelector<HTMLButtonElement>('#story-beat-continue');
const hudChapter = document.querySelector<HTMLDivElement>('#hud-chapter');
const masterVolumeSlider = document.querySelector<HTMLInputElement>('#master-volume');
const gameToastEl = document.querySelector<HTMLDivElement>('#game-toast');
const hudEra = document.querySelector<HTMLSpanElement>('#hud-era');
const hudPhase = document.querySelector<HTMLSpanElement>('#hud-phase');
const hudTemperature = document.querySelector<HTMLSpanElement>('#hud-temperature');
const hudForecast = document.querySelector<HTMLSpanElement>('#hud-forecast');
const hudPosition = document.querySelector<HTMLSpanElement>('#hud-position');
const hudLandmark = document.querySelector<HTMLSpanElement>('#hud-landmark');
const hudLookHint = document.querySelector<HTMLDivElement>('#hud-look-hint');
const hudHealth = document.querySelector<HTMLSpanElement>('#hud-health');
const hudHealthBar = document.querySelector<HTMLDivElement>('#hud-health-bar');
const hudHydration = document.querySelector<HTMLSpanElement>('#hud-hydration');
const hudHydrationBar = document.querySelector<HTMLDivElement>('#hud-hydration-bar');
const hudStatus = document.querySelector<HTMLSpanElement>('#hud-status');
const hudLogs = document.querySelector<HTMLSpanElement>('#hud-logs');
const deathMessage = document.querySelector<HTMLParagraphElement>('#death-message');
const deathLogs = document.querySelector<HTMLParagraphElement>('#death-logs');
const deathObjective = document.querySelector<HTMLParagraphElement>('#death-objective');
const deathCycle = document.querySelector<HTMLParagraphElement>('#death-cycle');
const epilogueBody = document.querySelector<HTMLParagraphElement>('#epilogue-body');
const hudOmen = document.querySelector<HTMLDivElement>('#hud-omen');
const menuControlsHint = document.querySelector<HTMLParagraphElement>('#menu-controls-hint');
const mobileControlsRoot = document.querySelector<HTMLDivElement>('#mobile-controls');
const mobileLookZone = document.querySelector<HTMLDivElement>('#mobile-look-zone');
const mobileStickBase = document.querySelector<HTMLDivElement>('#mobile-stick-base');
const mobileStickKnob = document.querySelector<HTMLDivElement>('#mobile-stick-knob');
const mobileLookHint = document.querySelector<HTMLParagraphElement>('#mobile-look-hint');
const mobileBtnSprint = document.querySelector<HTMLButtonElement>('#mobile-btn-sprint');
const mobileBtnUse = document.querySelector<HTMLButtonElement>('#mobile-btn-use');
const mobileBtnInteract = document.querySelector<HTMLButtonElement>('#mobile-btn-interact');
const mobileBtnJournal = document.querySelector<HTMLButtonElement>('#mobile-btn-journal');
const mobileBtnPause = document.querySelector<HTMLButtonElement>('#mobile-btn-pause');
const mobileBtnStats = document.querySelector<HTMLButtonElement>('#mobile-btn-stats');
const soundUnlockBannerEl = document.querySelector<HTMLDivElement>('#sound-unlock-banner');
const soundUnlockBtn = document.querySelector<HTMLButtonElement>('#sound-unlock-btn');
const hudMobileStrip = document.querySelector<HTMLDivElement>('#hud-mobile-strip');
const mobileHudLine1 = document.querySelector<HTMLSpanElement>('#mobile-hud-line1');
const mobileHudObjective = document.querySelector<HTMLParagraphElement>('#mobile-hud-objective');
const mobileHudHealthBar = document.querySelector<HTMLDivElement>('#mobile-hud-health-bar');
const mobileHudHydrationBar = document.querySelector<HTMLDivElement>('#mobile-hud-hydration-bar');
const mobileHudHealth = document.querySelector<HTMLSpanElement>('#mobile-hud-health');
const mobileHudHydration = document.querySelector<HTMLSpanElement>('#mobile-hud-hydration');
const hudMobileBackdrop = document.querySelector<HTMLDivElement>('#hud-mobile-backdrop');
const hudMobileSheet = document.querySelector<HTMLDivElement>('#hud-mobile-sheet');
const hudMobileSheetClose = document.querySelector<HTMLButtonElement>('#hud-mobile-sheet-close');
const hudMobileSheetCloseTop = document.querySelector<HTMLButtonElement>('#hud-mobile-sheet-close-top');
const mobileHudSkyBtn = document.querySelector<HTMLButtonElement>('#mobile-hud-sky-btn');
const sheetPhase = document.querySelector<HTMLSpanElement>('#sheet-phase');
const sheetTemperature = document.querySelector<HTMLSpanElement>('#sheet-temperature');
const sheetForecast = document.querySelector<HTMLSpanElement>('#sheet-forecast');
const sheetLandmark = document.querySelector<HTMLSpanElement>('#sheet-landmark');
const sheetLogs = document.querySelector<HTMLSpanElement>('#sheet-logs');
const sheetPosition = document.querySelector<HTMLSpanElement>('#sheet-position');
const sheetStatus = document.querySelector<HTMLParagraphElement>('#sheet-status');

const deviceProfile = detectDeviceProfile();
applyDeviceProfileToDocument(deviceProfile);

const menuTaglineEl = document.querySelector<HTMLParagraphElement>('#menu-tagline');

function applyMenuBranding(locale: import('./i18n/locale').Locale): void {
  if (menuTaglineEl) {
    menuTaglineEl.textContent = getMenuTagline(locale);
  }
}

function applyMenuControlsHint(locale: import('./i18n/locale').Locale): void {
  applyMenuBranding(locale);
  if (deviceProfile.prefersTouchControls) {
    const mobile = getMobileChromeCopy(locale);
    if (menuControlsHint) {
      menuControlsHint.textContent = mobile.controlsHint;
    }
    if (mobileLookHint) {
      mobileLookHint.textContent = mobile.lookHint;
    }
    if (mobileBtnSprint) {
      mobileBtnSprint.textContent = mobile.run;
    }
    if (mobileBtnJournal) {
      mobileBtnJournal.textContent = mobile.journal;
    }
    if (mobileBtnPause) {
      mobileBtnPause.textContent = mobile.pause;
    }
    if (mobileBtnStats) {
      mobileBtnStats.textContent = mobile.sky;
    }
    if (mobileHudSkyBtn) {
      mobileHudSkyBtn.textContent = mobile.sky;
    }
  }
  if (menuControlsHint && !deviceProfile.prefersTouchControls) {
    return;
  }
  if (menuControlsHint && deviceProfile.prefersTouchControls) {
    const silentNote = locale === 'zh'
      ? ' iPhone：请关闭静音开关以听到环境音。'
      : locale === 'ja'
        ? ' iPhone：環境音のため消音を解除してください。'
        : ' On iPhone, turn off silent mode for ambience.';
    if (!menuControlsHint.textContent?.includes('silent') && !menuControlsHint.textContent?.includes('静音')) {
      menuControlsHint.textContent += silentNote;
    }
  }
}
applyMenuControlsHint(loadLocale());
const logTitle = document.querySelector<HTMLHeadingElement>('#log-title');
const logBody = document.querySelector<HTMLParagraphElement>('#log-body');
const worldIntroBody = document.querySelector<HTMLDivElement>('#world-intro-body');
const worldIntroSummary = document.querySelector<HTMLElement>('#world-intro-summary');
const controlsDisclaimerSummary = document.querySelector<HTMLElement>('#controls-disclaimer-summary');
const menuDisclaimer = document.querySelector<HTMLParagraphElement>('#menu-disclaimer');
const localeEnButton = document.querySelector<HTMLButtonElement>('#locale-en');
const localeZhButton = document.querySelector<HTMLButtonElement>('#locale-zh');
const localeJaButton = document.querySelector<HTMLButtonElement>('#locale-ja');
const languageLabel = document.querySelector<HTMLParagraphElement>('#language-label');
const replayCinematicButton = document.querySelector<HTMLButtonElement>('#replay-cinematic-btn');
const replayCutsceneLabel = document.querySelector<HTMLLabelElement>('#replay-cutscene-label');
const replayCutsceneSelect = document.querySelector<HTMLSelectElement>('#replay-cutscene-select');
const replayCutsceneButton = document.querySelector<HTMLButtonElement>('#replay-cutscene-btn');
const journalCounselList = document.querySelector<HTMLUListElement>('#journal-counsel-list');
const journalCounselHeading = document.querySelector<HTMLHeadingElement>('#journal-counsel-heading');
const predictorRitualOverlay = document.querySelector<HTMLDivElement>('#predictor-ritual-overlay');
const predictorRitualHint = document.querySelector<HTMLParagraphElement>('#predictor-ritual-hint');
const predictorRing1 = document.querySelector<HTMLDivElement>('#predictor-ring-1');
const predictorRing2 = document.querySelector<HTMLDivElement>('#predictor-ring-2');
const predictorRing3 = document.querySelector<HTMLDivElement>('#predictor-ring-3');
const predictorRingRotate1 = document.querySelector<HTMLButtonElement>('#predictor-ring-rotate-1');
const predictorRingRotate2 = document.querySelector<HTMLButtonElement>('#predictor-ring-rotate-2');
const predictorRingRotate3 = document.querySelector<HTMLButtonElement>('#predictor-ring-rotate-3');
const predictorRitualLock = document.querySelector<HTMLButtonElement>('#predictor-ritual-lock');
const predictorRitualCancel = document.querySelector<HTMLButtonElement>('#predictor-ritual-cancel');
const menuNarrationCheckbox = document.querySelector<HTMLInputElement>('#menu-narration-enabled');
const menuNarrationLabel = document.querySelector<HTMLSpanElement>('#menu-narration-label');
const menuMusicCheckbox = document.querySelector<HTMLInputElement>('#menu-music-enabled');
const menuMusicLabel = document.querySelector<HTMLSpanElement>('#menu-music-label');
const introCinematicOverlay = document.querySelector<HTMLDivElement>('#intro-cinematic');
const introCinematicEyebrow = document.querySelector<HTMLParagraphElement>('#intro-cinematic-eyebrow');
const introCinematicTitle = document.querySelector<HTMLHeadingElement>('#intro-cinematic-title');
const introCinematicBody = document.querySelector<HTMLParagraphElement>('#intro-cinematic-body');
const introCinematicSkip = document.querySelector<HTMLButtonElement>('#intro-cinematic-skip');
const introCinematicNext = document.querySelector<HTMLButtonElement>('#intro-cinematic-next');
const introNarrationCheckbox = document.querySelector<HTMLInputElement>('#intro-narration-enabled');
const introNarrationLabel = document.querySelector<HTMLSpanElement>('#intro-narration-label');

if (
  !canvas
  || !overlay
  || !hud
  || !hudInteraction
  || !hudCompactHint
  || !deathOverlay
  || !epilogueOverlay
  || !pauseOverlay
  || !stableBanner
  || !stableBannerSubtitle
  || !logReaderOverlay
  || !journalOverlay
  || !dialogueOverlay
  || !dialogueSpeaker
  || !dialogueBody
  || !dialogueChoices
  || !dialogueCloseButton
  || !hudWayfinder
  || !hudWayfinderLabel
  || !hudWayfinderArrow
  || !forecastStripEl
  || !startButton
  || !continueButton
  || !checkpointInfo
  || !freshStartConfirm
  || !freshStartConfirmButton
  || !freshStartCancelButton
  || !restartButton
  || !epilogueRestartButton
  || !pauseResumeButton
  || !pauseSaveButton
  || !pauseDeleteCheckpointButton
  || !pauseQuitButton
  || !pauseCheckpointLine
  || !pauseVolumeSlider
  || !pauseToastEl
  || !logCloseButton
  || !logNavRow
  || !logPrevButton
  || !logNextButton
  || !logNavIndicator
  || !journalEraList
  || !journalLogList
  || !journalLogCount
  || !journalCloseButton
  || !masterVolumeSlider
  || !gameToastEl
  || !hudEra
  || !hudPhase
  || !hudTemperature
  || !hudForecast
  || !hudPosition
  || !hudLandmark
  || !hudLookHint
  || !hudHealth
  || !hudHealthBar
  || !hudHydration
  || !hudHydrationBar
  || !hudStatus
  || !hudLogs
  || !deathMessage
  || !deathLogs
  || !deathObjective
  || !logTitle
  || !logBody
  || !worldIntroBody
  || !worldIntroSummary
  || !controlsDisclaimerSummary
  || !menuDisclaimer
  || !localeEnButton
  || !localeZhButton
  || !localeJaButton
  || !languageLabel
  || !replayCinematicButton
  || !replayCutsceneLabel
  || !replayCutsceneSelect
  || !replayCutsceneButton
  || !journalCounselList
  || !journalCounselHeading
  || !predictorRitualOverlay
  || !predictorRitualHint
  || !predictorRing1
  || !predictorRing2
  || !predictorRing3
  || !predictorRingRotate1
  || !predictorRingRotate2
  || !predictorRingRotate3
  || !predictorRitualLock
  || !predictorRitualCancel
  || !menuNarrationCheckbox
  || !menuNarrationLabel
  || !menuMusicCheckbox
  || !menuMusicLabel
  || !introCinematicOverlay
  || !introCinematicEyebrow
  || !introCinematicTitle
  || !introCinematicBody
  || !introCinematicSkip
  || !introCinematicNext
  || !introNarrationCheckbox
  || !introNarrationLabel
) {
  throw new Error('Missing required DOM elements.');
}

const narration = new NarrationDirector();
narration.warmUp();

function syncNarrationEnabled(enabled: boolean): void {
  narration.setEnabled(enabled);
  menuNarrationCheckbox!.checked = enabled;
  introNarrationCheckbox!.checked = enabled;
}

function syncMusicEnabled(enabled: boolean): void {
  saveMusicEnabled(enabled);
  menuMusicCheckbox!.checked = enabled;
  game.setMusicEnabled(enabled);
}

function syncVolumeSliders(volume: number): void {
  const percent = String(Math.round(volume * 100));
  masterVolumeSlider!.value = percent;
  pauseVolumeSlider!.value = percent;
}

function refreshCheckpointMenu(): void {
  const checkpoint = CheckpointSave.load();
  const continueBtn = continueButton!;
  const startBtn = startButton!;
  const info = checkpointInfo!;
  freshStartConfirm!.classList.add('hidden');

  if (!checkpoint) {
    continueBtn.classList.add('hidden');
    info.classList.add('hidden');
    startBtn.classList.remove('menu-secondary');
    startBtn.classList.add('primary-btn');
    return;
  }

  continueBtn.classList.remove('hidden');
  info.classList.remove('hidden');
  info.textContent = `Checkpoint: ${checkpoint.label} — ${CheckpointSave.formatSavedAt(checkpoint.savedAt)}. Discovered logs persist across cycles.`;
  startBtn.classList.add('menu-secondary');
  startBtn.classList.remove('primary-btn');
}

const logReader = new LogReader(
  logReaderOverlay,
  logTitle,
  logBody,
  logCloseButton,
  logNavRow,
  logPrevButton,
  logNextButton,
  logNavIndicator,
  logActionHint!,
  narration,
  () => localeMenu!.getLocale(),
  () => MetaProgress.loadMasterVolume(),
);
const journal = new Journal(
  journalOverlay,
  journalEraList,
  journalLogList,
  journalLogCount,
  journalLetterList!,
  journalLettersHeading!,
  journalQuestList!,
  journalQuestHeading!,
  journalCounselList,
  journalCounselHeading,
  journalCloseButton,
);

const predictorRitual = new PredictorRingRitual(
  predictorRitualOverlay,
  [predictorRing1, predictorRing2, predictorRing3],
  predictorRitualHint,
  predictorRitualLock,
  predictorRitualCancel,
  [predictorRingRotate1, predictorRingRotate2, predictorRingRotate3],
);

function applyPredictorRitualLocale(locale: ReturnType<typeof loadLocale>): void {
  predictorRitual.applyLabels(getCinematicReplayUi(locale));
}
applyPredictorRitualLocale(loadLocale());
const dialoguePanel = new DialoguePanel(
  dialogueOverlay,
  dialogueSpeaker,
  dialogueBody,
  dialogueChoices,
  dialogueCloseButton,
  narration,
  () => localeMenu!.getLocale(),
  () => MetaProgress.loadMasterVolume(),
);
const hudCompass = new HudCompass(hudWayfinder, hudWayfinderLabel, hudWayfinderArrow);
const stableEraBanner = new StableEraBanner(stableBanner, stableBannerSubtitle);
const forecastStrip = new ForecastStrip(forecastStripEl);
const gameToast = new Toast(gameToastEl);
const pauseToast = new Toast(pauseToastEl);
const storyOverlay = new StoryOverlay(
  storyBeatOverlay!,
  storyBeatEyebrow!,
  storyBeatTitle!,
  storyBeatBody!,
  storyBeatContinue!,
  narration,
  () => MetaProgress.loadMasterVolume(),
);

let game: Game;
let localeMenu: LocaleMenu;
let introCinematic: IntroCinematic;

const mobileChrome: MobileChromeElements | null = deviceProfile.prefersTouchControls
  && mobileControlsRoot
  && mobileLookZone
  && mobileStickBase
  && mobileStickKnob
  && mobileLookHint
  && mobileBtnSprint
  && mobileBtnUse
  && mobileBtnInteract
  && mobileBtnJournal
  && mobileBtnPause
  ? {
    root: mobileControlsRoot,
    lookZone: mobileLookZone,
    stickBase: mobileStickBase,
    stickKnob: mobileStickKnob,
    lookHint: mobileLookHint,
    sprintButton: mobileBtnSprint,
    useButton: mobileBtnUse,
    interactButton: mobileBtnInteract,
    journalButton: mobileBtnJournal,
    pauseButton: mobileBtnPause,
  }
  : null;

const mobileHudBundle: MobileHudBundle | null = deviceProfile.prefersTouchControls
  && hudMobileStrip
  && mobileHudLine1
  && mobileHudObjective
  && mobileHudHealthBar
  && mobileHudHydrationBar
  && mobileHudHealth
  && mobileHudHydration
  && hudMobileBackdrop
  && hudMobileSheet
  && hudMobileSheetClose
  && hudMobileSheetCloseTop
  && mobileHudSkyBtn
  && sheetPhase
  && sheetTemperature
  && sheetForecast
  && sheetLandmark
  && sheetLogs
  && sheetPosition
  && sheetStatus
  ? {
    strip: hudMobileStrip,
    line1: mobileHudLine1,
    objective: mobileHudObjective,
    healthBar: mobileHudHealthBar,
    hydrationBar: mobileHudHydrationBar,
    healthText: mobileHudHealth,
    hydrationText: mobileHudHydration,
    sheet: hudMobileSheet,
    sheetBackdrop: hudMobileBackdrop,
    sheetClose: hudMobileSheetClose,
    sheetCloseTop: hudMobileSheetCloseTop,
    sheetPhase,
    sheetTemperature,
    sheetForecast,
    sheetLandmark,
    sheetLogs,
    sheetPosition,
    sheetStatus,
    skyButton: mobileHudSkyBtn,
    statsButton: mobileBtnStats,
  }
  : null;

const showMainMenu = (): void => {
  overlay.classList.remove('hidden');
  hud.classList.add('hidden');
  freshStartConfirm!.classList.add('hidden');
  refreshCheckpointMenu();
  void game.prepareMenuAudio();
};

const epilogue = new EpilogueOverlay(
  epilogueOverlay,
  epilogueBody!,
  epilogueRestartButton,
  () => {
    game.beginAgainFromEpilogue();
  },
);

const pauseMenu = new PauseMenu(
  pauseOverlay,
  pauseCheckpointLine,
  pauseDeleteCheckpointButton,
  pauseResumeButton,
  pauseSaveButton,
  pauseQuitButton,
  pauseVolumeSlider,
  () => game.resume(),
  () => {
    game.saveCheckpoint('Manual save');
  },
  () => {
    game.deleteCheckpoint();
    refreshCheckpointMenu();
  },
  () => game.quitToMenu(),
  (volume) => {
    MetaProgress.saveMasterVolume(volume);
    syncVolumeSliders(volume);
    game.setMasterVolume(volume);
  },
);

game = new Game(
  canvas,
  {
    root: hud,
    era: hudEra,
    phase: hudPhase,
    temperature: hudTemperature,
    forecast: hudForecast,
    position: hudPosition,
    health: hudHealth,
    healthBar: hudHealthBar,
    hydration: hudHydration,
    hydrationBar: hudHydrationBar,
    status: hudStatus,
    logs: hudLogs,
    landmark: hudLandmark,
    lookHint: hudLookHint,
    interaction: hudInteraction,
    compactHint: hudCompactHint,
    chapter: hudChapter!,
    omen: hudOmen!,
  },
  {
    death: deathOverlay,
    deathMessage,
    deathLogs,
    deathObjective,
    deathCycle: deathCycle!,
    restartButton,
  },
  logReader,
  stableEraBanner,
  forecastStrip,
  epilogue,
  pauseMenu,
  journal,
  dialoguePanel,
  hudCompass,
  gameToast,
  pauseToast,
  showMainMenu,
  refreshCheckpointMenu,
  syncVolumeSliders,
  masterVolumeSlider,
  () => localeMenu!.getLocale(),
  narration,
  storyOverlay,
  deviceProfile,
  mobileChrome,
  mobileHudBundle,
  soundUnlockBannerEl,
  soundUnlockBtn,
  predictorRitual,
);

introCinematic = new IntroCinematic(
  introCinematicOverlay,
  introCinematicEyebrow,
  introCinematicTitle,
  introCinematicBody,
  introCinematicSkip,
  introCinematicNext,
  introNarrationCheckbox,
  introNarrationLabel,
  narration,
  (enabled) => {
    syncNarrationEnabled(enabled);
  },
  (active) => {
    game.setCinematicBed(active);
  },
);
introCinematic.setOnUserGesture(() => {
  narration.unlockFromUserGesture();
  void game.unlockAudioFromGesture();
});

function unlockSpeechAndAudioFromGesture(): void {
  narration.unlockFromUserGesture();
  void game.unlockAudioFromGesture();
}

localeMenu = new LocaleMenu(
  worldIntroBody,
  worldIntroSummary,
  controlsDisclaimerSummary,
  localeEnButton,
  localeZhButton,
  localeJaButton,
  languageLabel,
  replayCinematicButton,
  replayCutsceneLabel,
  replayCutsceneSelect,
  replayCutsceneButton,
  menuDisclaimer,
  menuNarrationCheckbox,
  menuNarrationLabel,
  menuMusicCheckbox,
  menuMusicLabel,
  (locale) => {
    introCinematic.setLocale(locale);
    applyMenuControlsHint(locale);
    applyPredictorRitualLocale(locale);
  },
  () => {
    unlockSpeechAndAudioFromGesture();
    void game.ensureAudio();
    overlay.classList.add('hidden');
    hud.classList.add('hidden');
    game.playOpeningCutscene(() => {
      showMainMenu();
    });
  },
  (id: MenuCutsceneReplayId) => {
    unlockSpeechAndAudioFromGesture();
    void game.ensureAudio();
    overlay.classList.add('hidden');
    hud.classList.add('hidden');
    game.playMenuCutsceneReplay(id, () => {
      showMainMenu();
    });
  },
  (enabled) => {
    syncNarrationEnabled(enabled);
  },
  (enabled) => {
    syncMusicEnabled(enabled);
  },
);

syncNarrationEnabled(menuNarrationCheckbox.checked);
syncMusicEnabled(loadMusicEnabled());
void game.prepareMenuAudio();

const beginGame = (): void => {
  overlay.classList.add('hidden');
  hud.classList.remove('hidden');
};

async function launchGame(
  mode: 'new' | 'continue',
  options?: { forceCinematic?: boolean },
): Promise<void> {
  const startSession = async (): Promise<void> => {
    beginGame();
    if (mode === 'new') {
      await game.startNewGame();
    } else {
      await game.continueFromCheckpoint();
    }
  };

  const showCinematic = mode === 'new' && (options?.forceCinematic || !cinematicSeen());
  introCinematic.setNarrationVolume(MetaProgress.loadMasterVolume());

  if (showCinematic) {
    void game.ensureAudio();
    beginGame();
    hud?.classList.add('hidden');
    game.playOpeningCutscene(() => {
      hud?.classList.remove('hidden');
      void startSession();
    });
    return;
  }

  await game.ensureAudio();
  await startSession();
}

const tapPlay = (mode: 'new' | 'continue'): void => {
  unlockSpeechAndAudioFromGesture();
  void launchGame(mode);
};

startButton.addEventListener('click', () => {
  if (CheckpointSave.load()) {
    freshStartConfirm!.classList.remove('hidden');
    return;
  }
  tapPlay('new');
});

freshStartConfirmButton.addEventListener('click', () => {
  freshStartConfirm!.classList.add('hidden');
  tapPlay('new');
});

freshStartCancelButton.addEventListener('click', () => {
  freshStartConfirm!.classList.add('hidden');
});

continueButton.addEventListener('click', () => {
  tapPlay('continue');
});

refreshCheckpointMenu();

const worldIntroDetails = document.querySelector<HTMLDetailsElement>('#world-intro-details');
const WORLD_INTRO_COLLAPSED_KEY = '3body_world_intro_collapsed';
if (worldIntroDetails) {
  if (localStorage.getItem(WORLD_INTRO_COLLAPSED_KEY) === '1') {
    worldIntroDetails.open = false;
  }
  worldIntroDetails.addEventListener('toggle', () => {
    if (!worldIntroDetails.open) {
      localStorage.setItem(WORLD_INTRO_COLLAPSED_KEY, '1');
    }
  });
}

document.addEventListener('pointerlockchange', () => {
  if (document.body.classList.contains('touch-ui')) {
    return;
  }

  if (document.pointerLockElement === canvas) {
    return;
  }

  if (!deathOverlay.classList.contains('hidden')) {
    return;
  }

  if (!epilogueOverlay.classList.contains('hidden')) {
    return;
  }

  if (logReader.isOpen()) {
    return;
  }

  if (journal.isOpen()) {
    return;
  }

  if (dialoguePanel.isOpen()) {
    return;
  }

  if (pauseMenu.isOpen()) {
    return;
  }

  if (introCinematic.isOpen()) {
    return;
  }

  if (game.isRunning()) {
    game.onPointerLockLost();
  }
});
