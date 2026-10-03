export interface MobileHudBundle {
  strip: HTMLElement;
  line1: HTMLElement;
  objective: HTMLElement;
  healthBar: HTMLElement;
  hydrationBar: HTMLElement;
  healthText: HTMLElement;
  hydrationText: HTMLElement;
  sheet: HTMLElement;
  sheetBackdrop: HTMLElement;
  sheetClose: HTMLButtonElement;
  sheetPhase: HTMLElement;
  sheetTemperature: HTMLElement;
  sheetForecast: HTMLElement;
  sheetLandmark: HTMLElement;
  sheetLogs: HTMLElement;
  sheetPosition: HTMLElement;
  sheetStatus: HTMLElement;
  skyButton: HTMLButtonElement;
  statsButton: HTMLButtonElement | null;
}
