import { CheckpointSave } from '../save/CheckpointSave';

export class PauseMenu {
  private openState = false;

  constructor(
    private readonly overlay: HTMLElement,
    private readonly checkpointLine: HTMLElement,
    private readonly deleteCheckpointButton: HTMLButtonElement,
    resumeButton: HTMLButtonElement,
    saveButton: HTMLButtonElement,
    quitButton: HTMLButtonElement,
    private readonly pauseVolumeSlider: HTMLInputElement,
    private readonly onResume: () => void,
    private readonly onSave: () => void,
    private readonly onDeleteCheckpoint: () => void,
    private readonly onQuit: () => void,
    private readonly onVolumeChange: (volume: number) => void,
  ) {
    resumeButton.addEventListener('click', () => {
      this.onResume();
    });
    saveButton.addEventListener('click', () => {
      this.onSave();
    });
    deleteCheckpointButton.addEventListener('click', () => {
      this.onDeleteCheckpoint();
    });
    quitButton.addEventListener('click', () => {
      this.onQuit();
    });

    pauseVolumeSlider.addEventListener('input', () => {
      const volume = Number(pauseVolumeSlider.value) / 100;
      this.onVolumeChange(volume);
    });
  }

  isOpen(): boolean {
    return this.openState;
  }

  show(): void {
    this.refreshCheckpointLine();
    this.overlay.classList.remove('hidden');
    this.openState = true;
  }

  hide(): void {
    this.overlay.classList.add('hidden');
    this.openState = false;
  }

  setVolumeSliderValue(percent: number): void {
    this.pauseVolumeSlider.value = String(Math.round(percent));
  }

  refreshCheckpointLine(): void {
    const checkpoint = CheckpointSave.load();
    if (!checkpoint) {
      this.checkpointLine.textContent = 'No checkpoint in this browser.';
      this.deleteCheckpointButton.classList.add('hidden');
      return;
    }

    this.checkpointLine.textContent = `Last saved: ${checkpoint.label} — ${CheckpointSave.formatSavedAt(checkpoint.savedAt)}`;
    this.deleteCheckpointButton.classList.remove('hidden');
  }
}
