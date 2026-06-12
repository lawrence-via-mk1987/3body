import { Game } from './core/Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const overlay = document.querySelector<HTMLDivElement>('#overlay');
const hud = document.querySelector<HTMLDivElement>('#hud');
const deathOverlay = document.querySelector<HTMLDivElement>('#death-overlay');
const startButton = document.querySelector<HTMLButtonElement>('#start-btn');
const restartButton = document.querySelector<HTMLButtonElement>('#restart-btn');
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
const deathMessage = document.querySelector<HTMLParagraphElement>('#death-message');

if (
  !canvas
  || !overlay
  || !hud
  || !deathOverlay
  || !startButton
  || !restartButton
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
  || !deathMessage
) {
  throw new Error('Missing required DOM elements.');
}

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
  },
  {
    death: deathOverlay,
    deathMessage,
    restartButton,
  },
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

  if (document.pointerLockElement !== canvas) {
    overlay.classList.remove('hidden');
    hud.classList.add('hidden');
    game.stop();
  }
});
