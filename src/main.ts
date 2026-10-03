import { Game } from './core/Game';
import { EpilogueOverlay } from './ui/EpilogueOverlay';
import { ForecastStrip } from './ui/ForecastStrip';
import { LogReader } from './ui/LogReader';
import { StableEraBanner } from './ui/StableEraBanner';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const overlay = document.querySelector<HTMLDivElement>('#overlay');
const hud = document.querySelector<HTMLDivElement>('#hud');
const deathOverlay = document.querySelector<HTMLDivElement>('#death-overlay');
const epilogueOverlay = document.querySelector<HTMLDivElement>('#epilogue-overlay');
const stableBanner = document.querySelector<HTMLDivElement>('#stable-banner');
const stableBannerSubtitle = document.querySelector<HTMLParagraphElement>('#stable-banner-subtitle');
const logReaderOverlay = document.querySelector<HTMLDivElement>('#log-reader');
const forecastStripEl = document.querySelector<HTMLDivElement>('#forecast-strip');
const startButton = document.querySelector<HTMLButtonElement>('#start-btn');
const restartButton = document.querySelector<HTMLButtonElement>('#restart-btn');
const epilogueRestartButton = document.querySelector<HTMLButtonElement>('#epilogue-restart');
const logCloseButton = document.querySelector<HTMLButtonElement>('#log-close');
const masterVolumeSlider = document.querySelector<HTMLInputElement>('#master-volume');
const hudEra = document.querySelector<HTMLSpanElement>('#hud-era');
const hudPhase = document.querySelector<HTMLSpanElement>('#hud-phase');
const hudTemperature = document.querySelector<HTMLSpanElement>('#hud-temperature');
const hudForecast = document.querySelector<HTMLSpanElement>('#hud-forecast');
const hudPosition = document.querySelector<HTMLSpanElement>('#hud-position');
const hudLandmark = document.querySelector<HTMLSpanElement>('#hud-landmark');
const hudHealth = document.querySelector<HTMLSpanElement>('#hud-health');
const hudHealthBar = document.querySelector<HTMLDivElement>('#hud-health-bar');
const hudHydration = document.querySelector<HTMLSpanElement>('#hud-hydration');
const hudHydrationBar = document.querySelector<HTMLDivElement>('#hud-hydration-bar');
const hudStatus = document.querySelector<HTMLSpanElement>('#hud-status');
const hudLogs = document.querySelector<HTMLSpanElement>('#hud-logs');
const deathMessage = document.querySelector<HTMLParagraphElement>('#death-message');
const deathLogs = document.querySelector<HTMLParagraphElement>('#death-logs');
const logTitle = document.querySelector<HTMLHeadingElement>('#log-title');
const logBody = document.querySelector<HTMLParagraphElement>('#log-body');

if (
  !canvas
  || !overlay
  || !hud
  || !deathOverlay
  || !epilogueOverlay
  || !stableBanner
  || !stableBannerSubtitle
  || !logReaderOverlay
  || !forecastStripEl
  || !startButton
  || !restartButton
  || !epilogueRestartButton
  || !logCloseButton
  || !masterVolumeSlider
  || !hudEra
  || !hudPhase
  || !hudTemperature
  || !hudForecast
  || !hudPosition
  || !hudLandmark
  || !hudHealth
  || !hudHealthBar
  || !hudHydration
  || !hudHydrationBar
  || !hudStatus
  || !hudLogs
  || !deathMessage
  || !deathLogs
  || !logTitle
  || !logBody
) {
  throw new Error('Missing required DOM elements.');
}

const logReader = new LogReader(logReaderOverlay, logTitle, logBody, logCloseButton);
const stableEraBanner = new StableEraBanner(stableBanner, stableBannerSubtitle);
const forecastStrip = new ForecastStrip(forecastStripEl);

let game: Game;

const epilogue = new EpilogueOverlay(epilogueOverlay, epilogueRestartButton, () => {
  game.beginAgainFromEpilogue();
});

game = new Game(
  canvas,
  {
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
  },
  {
    death: deathOverlay,
    deathMessage,
    deathLogs,
    restartButton,
  },
  logReader,
  stableEraBanner,
  forecastStrip,
  epilogue,
  masterVolumeSlider,
);

startButton.addEventListener('click', () => {
  overlay.classList.add('hidden');
  hud.classList.remove('hidden');
  void game.start();
});

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== canvas && !deathOverlay.classList.contains('hidden')) {
    return;
  }

  if (document.pointerLockElement !== canvas && !epilogueOverlay.classList.contains('hidden')) {
    return;
  }

  if (document.pointerLockElement !== canvas && !logReader.isOpen()) {
    overlay.classList.remove('hidden');
    hud.classList.add('hidden');
    game.stop();
  }
});
