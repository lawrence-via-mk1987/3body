import type { Locale } from '../i18n/locale';

export class NarrationDirector {
  private enabled = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.cancel();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  cancel(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.cancel();
  }

  speak(text: string, locale: Locale, volume = 0.55): void {
    if (!this.enabled || typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === 'zh' ? 'zh-CN' : 'en-US';
    utterance.rate = locale === 'zh' ? 0.92 : 0.88;
    utterance.pitch = 0.85;
    utterance.volume = Math.min(1, Math.max(0, volume));

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) => {
      if (locale === 'zh') {
        return voice.lang.startsWith('zh');
      }
      return voice.lang.startsWith('en');
    });
    if (preferred) {
      utterance.voice = preferred;
    }

    window.speechSynthesis.speak(utterance);
  }

  /** Warm up voice list (Chrome loads voices asynchronously). */
  warmUp(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.getVoices();
  }
}
