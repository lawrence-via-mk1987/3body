import { Game } from './core/Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const overlay = document.querySelector<HTMLDivElement>('#overlay');
const hud = document.querySelector<HTMLDivElement>('#hud');
const startButton = document.querySelector<HTMLButtonElement>('#start-btn');
const hudEra = document.querySelector<HTMLSpanElement>('#hud-era');
const hudPosition = document.querySelector<HTMLSpanElement>('#hud-position');

if (!canvas || !overlay || !hud || !startButton || !hudEra || !hudPosition) {
  throw new Error('Missing required DOM elements.');
}

const game = new Game(canvas, hudEra, hudPosition);

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
