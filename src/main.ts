import { Game } from './core/Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const overlay = document.querySelector<HTMLDivElement>('#overlay');
const hud = document.querySelector<HTMLDivElement>('#hud');
const startButton = document.querySelector<HTMLButtonElement>('#start-btn');
const hudEra = document.querySelector<HTMLSpanElement>('#hud-era');
const hudPhase = document.querySelector<HTMLSpanElement>('#hud-phase');
const hudTemperature = document.querySelector<HTMLSpanElement>('#hud-temperature');
const hudForecast = document.querySelector<HTMLSpanElement>('#hud-forecast');
const hudPosition = document.querySelector<HTMLSpanElement>('#hud-position');

if (
  !canvas
  || !overlay
  || !hud
  || !startButton
  || !hudEra
  || !hudPhase
  || !hudTemperature
  || !hudForecast
  || !hudPosition
) {
  throw new Error('Missing required DOM elements.');
}

const game = new Game(canvas, {
  era: hudEra,
  phase: hudPhase,
  temperature: hudTemperature,
  forecast: hudForecast,
  position: hudPosition,
});

startButton.addEventListener('click', () => {
  overlay.classList.add('hidden');
  hud.classList.remove('hidden');
  game.start();
});

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== canvas) {
    overlay.classList.remove('hidden');
    hud.classList.add('hidden');
    game.stop();
  }
});
