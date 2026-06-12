import { Game } from './core/Game';
import { LogReader } from './ui/LogReader';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const overlay = document.querySelector<HTMLDivElement>('#overlay');
const hud = document.querySelector<HTMLDivElement>('#hud');
const deathOverlay = document.querySelector<HTMLDivElement>('#death-overlay');
const logReaderOverlay = document.querySelector<HTMLDivElement>('#log-reader');
const startButton = document.querySelector<HTMLButtonElement>('#start-btn');
const restartButton = document.querySelector<HTMLButtonElement>('#restart-btn');
const logCloseButton = document.querySelector<HTMLButtonElement>('#log-close');
const hudEra = document.querySelector<HTMLSpanElement>('#hud-era');
const hudPhase = document.querySelector<HTMLSpanElement>('#hud-phase');
const hudTemperature = document.querySelector<HTMLSpanElement>('#hud-temperature');
const hudForecast = document.querySelector<HTMLSpanElement>('#hud-forecast');
const hudPosition = document.querySelector<HTMLSpanElement>('#hud-position');
const hudHealth = document.querySelector<HTMLSpanElement>('#hud-health');
const hudHealthBar = document.querySelector<HTMLDivElement>('#hud-health-bar');
const hudHydration = document.querySelector<HTMLSpanElement>('#hud-hydration');
const hudHydrationBar = document.querySelector<HTMLDivElement>('#hud-hydration-bar');
const hudStatus = document.querySelector<HTMLSpanElement>('#hud-status');
const hudLogs = document.querySelector<HTMLSpanElement>('#hud-logs');
const deathMessage = document.querySelector<HTMLParagraphElement>('#death-message');
const logTitle = document.querySelector<HTMLHeadingElement>('#log-title');
const logBody = document.querySelector<HTMLParagraphElement>('#log-body');

if (
  !canvas
  || !overlay
  || !hud
  || !deathOverlay
  || !logReaderOverlay
  || !startButton
  || !restartButton
  || !logCloseButton
  || !hudEra
  || !hudPhase
  || !hudTemperature
  || !hudForecast
  || !hudPosition
  || !hudHealth
  || !hudHealthBar
  || !hudHydration
  || !hudHydrationBar
  || !hudStatus
  || !hudLogs
  || !deathMessage
  || !logTitle
  || !logBody
) {
  throw new Error('Missing required DOM elements.');
}

const logReader = new LogReader(logReaderOverlay, logTitle, logBody, logCloseButton);

const game = new Game(
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
  },
  {
    death: deathOverlay,
    deathMessage,
    restartButton,
  },
  logReader,
);

startButton.addEventListener('click', () => {
  overlay.classList.add('hidden');
  hud.classList.remove('hidden');
  game.start();
});

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== canvas && !deathOverlay.classList.contains('hidden')) {
    return;
  }

  if (document.pointerLockElement !== canvas && !logReader.isOpen()) {
    overlay.classList.remove('hidden');
    hud.classList.add('hidden');
    game.stop();
  }
});
