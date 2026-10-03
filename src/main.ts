import { NarrationDirector } from './audio/NarrationDirector';
import { Game } from './core/Game';
import { cinematicSeen } from './i18n/locale';
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
import { Toast } from './ui/Toast';
import { CheckpointSave } from './save/CheckpointSave';
import { MetaProgress } from './narrative/MetaProgress';

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
const journalEraList = document.querySelector<HTMLUListElement>('#journal-era-list');
const journalLogList = document.querySelector<HTMLUListElement>('#journal-log-list');
const journalLogCount = document.querySelector<HTMLSpanElement>('#journal-log-count');
const journalCloseButton = document.querySelector<HTMLButtonElement>('#journal-close');
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
const logTitle = document.querySelector<HTMLHeadingElement>('#log-title');
const logBody = document.querySelector<HTMLParagraphElement>('#log-body');
const worldIntroBody = document.querySelector<HTMLDivElement>('#world-intro-body');
const worldIntroSummary = document.querySelector<HTMLElement>('#world-intro-summary');
const controlsDisclaimerSummary = document.querySelector<HTMLElement>('#controls-disclaimer-summary');
const menuDisclaimer = document.querySelector<HTMLParagraphElement>('#menu-disclaimer');
const localeEnButton = document.querySelector<HTMLButtonElement>('#locale-en');
const localeZhButton = document.querySelector<HTMLButtonElement>('#locale-zh');
const languageLabel = document.querySelector<HTMLParagraphElement>('#language-label');
const replayCinematicButton = document.querySelector<HTMLButtonElement>('#replay-cinematic-btn');
const menuNarrationCheckbox = document.querySelector<HTMLInputElement>('#menu-narration-enabled');
const menuNarrationLabel = document.querySelector<HTMLSpanElement>('#menu-narration-label');
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
  || !languageLabel
  || !replayCinematicButton
  || !menuNarrationCheckbox
  || !menuNarrationLabel
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
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    narration.warmUp();
  };
}

function syncNarrationEnabled(enabled: boolean): void {
  narration.setEnabled(enabled);
  menuNarrationCheckbox!.checked = enabled;
  introNarrationCheckbox!.checked = enabled;
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
);
const journal = new Journal(
  journalOverlay,
  journalEraList,
  journalLogList,
  journalLogCount,
  journalCloseButton,
);
const dialoguePanel = new DialoguePanel(
  dialogueOverlay,
  dialogueSpeaker,
  dialogueBody,
  dialogueChoices,
  dialogueCloseButton,
);
const hudCompass = new HudCompass(hudWayfinder, hudWayfinderLabel, hudWayfinderArrow);
const stableEraBanner = new StableEraBanner(stableBanner, stableBannerSubtitle);
const forecastStrip = new ForecastStrip(forecastStripEl);
const gameToast = new Toast(gameToastEl);
const pauseToast = new Toast(pauseToastEl);

let game: Game;
let localeMenu: LocaleMenu;
let introCinematic: IntroCinematic;

const showMainMenu = (): void => {
  overlay.classList.remove('hidden');
  hud.classList.add('hidden');
  freshStartConfirm!.classList.add('hidden');
  refreshCheckpointMenu();
};

const epilogue = new EpilogueOverlay(epilogueOverlay, epilogueRestartButton, () => {
  game.beginAgainFromEpilogue();
});

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
  },
  {
    death: deathOverlay,
    deathMessage,
    deathLogs,
    deathObjective,
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

localeMenu = new LocaleMenu(
  worldIntroBody,
  worldIntroSummary,
  controlsDisclaimerSummary,
  localeEnButton,
  localeZhButton,
  languageLabel,
  replayCinematicButton,
  menuDisclaimer,
  menuNarrationCheckbox,
  menuNarrationLabel,
  (locale) => {
    introCinematic.setLocale(locale);
  },
  () => {
    void game.ensureAudio().then(() => {
      introCinematic.setNarrationVolume(MetaProgress.loadMasterVolume());
      introCinematic.play(localeMenu.getLocale(), () => {
        game.setCinematicBed(false);
      });
    });
  },
  (enabled) => {
    syncNarrationEnabled(enabled);
  },
);

syncNarrationEnabled(menuNarrationCheckbox.checked);

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
  await game.ensureAudio();
  introCinematic.setNarrationVolume(MetaProgress.loadMasterVolume());

  if (showCinematic) {
    introCinematic.play(localeMenu.getLocale(), () => {
      void startSession();
    });
    return;
  }

  await startSession();
}

startButton.addEventListener('click', () => {
  if (CheckpointSave.load()) {
    freshStartConfirm!.classList.remove('hidden');
    return;
  }
  void launchGame('new');
});

freshStartConfirmButton.addEventListener('click', () => {
  freshStartConfirm!.classList.add('hidden');
  void launchGame('new');
});

freshStartCancelButton.addEventListener('click', () => {
  freshStartConfirm!.classList.add('hidden');
});

continueButton.addEventListener('click', () => {
  void launchGame('continue');
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
