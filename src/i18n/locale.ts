export type Locale = 'en' | 'zh';

const STORAGE_KEY = '3body_locale';
const NARRATION_KEY = '3body_narration_enabled';

export function loadLocale(): Locale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'zh') {
      return 'zh';
    }
  } catch {
    // ignore
  }
  return 'en';
}

export function saveLocale(locale: Locale): void {
  localStorage.setItem(STORAGE_KEY, locale);
}

export function loadNarrationEnabled(): boolean {
  try {
    const raw = localStorage.getItem(NARRATION_KEY);
    if (raw === '0') {
      return false;
    }
  } catch {
    // ignore
  }
  return true;
}

export function saveNarrationEnabled(enabled: boolean): void {
  localStorage.setItem(NARRATION_KEY, enabled ? '1' : '0');
}

export function cinematicSeen(): boolean {
  return localStorage.getItem('3body_cinematic_done') === '1';
}

export function markCinematicSeen(): void {
  localStorage.setItem('3body_cinematic_done', '1');
}

export function clearCinematicSeen(): void {
  localStorage.removeItem('3body_cinematic_done');
}
