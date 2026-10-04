import type { Locale } from '../i18n/locale';
import { prosodyForRole, type VoiceRole } from './voiceProfiles';
import { pickPreferredVoice } from './voiceSelection';

export class NarrationDirector {
  private enabled = true;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private voiceByLocale = new Map<Locale, SpeechSynthesisVoice | null>();
  private queue: string[] = [];
  private queueLocale: Locale = 'en';
  private queueVolume = 0.55;
  private queueRole: VoiceRole = 'narrator';
  private gapTimer = 0;
  private utteranceDoneCallback: (() => void) | null = null;
  private voicesWaitTimer = 0;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.refreshVoices();
      };
    }
  }

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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    window.clearTimeout(this.gapTimer);
    window.clearTimeout(this.voicesWaitTimer);
    this.queue = [];
    this.utteranceDoneCallback = null;
  }

  speak(
    text: string,
    locale: Locale,
    volume = 0.55,
    role: VoiceRole = 'narrator',
    onComplete?: () => void,
  ): void {
    this.speakParts([text], locale, volume, role, onComplete);
  }

  /** Speaks each part in order with a short pause (e.g. title, then body). */
  speakParts(
    parts: string[],
    locale: Locale,
    volume = 0.55,
    role: VoiceRole = 'narrator',
    onComplete?: () => void,
  ): void {
    if (!this.enabled || typeof window === 'undefined' || !window.speechSynthesis) {
      onComplete?.();
      return;
    }

    this.cancel();
    this.utteranceDoneCallback = onComplete ?? null;
    this.queue = parts.map((part) => part.trim()).filter(Boolean);
    this.queueLocale = locale;
    this.queueVolume = volume;
    this.queueRole = role;
    this.refreshVoices();
    this.speakNextQueued();
  }

  /** Warm up voice list (Chrome loads voices asynchronously). */
  warmUp(): void {
    this.refreshVoices();
  }

  private refreshVoices(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    this.cachedVoices = window.speechSynthesis.getVoices();
    this.voiceByLocale.clear();
  }

  private resolveVoice(locale: Locale): SpeechSynthesisVoice | null {
    if (!this.voiceByLocale.has(locale)) {
      this.voiceByLocale.set(
        locale,
        pickPreferredVoice(this.cachedVoices, locale),
      );
    }
    return this.voiceByLocale.get(locale) ?? null;
  }

  private finishUtteranceQueue(): void {
    if (this.queue.length === 0 && this.utteranceDoneCallback) {
      const done = this.utteranceDoneCallback;
      this.utteranceDoneCallback = null;
      done();
    }
  }

  private speakNextQueued(): void {
    if (!this.enabled || this.queue.length === 0) {
      this.finishUtteranceQueue();
      return;
    }

    const text = this.queue.shift()!;
    const synth = window.speechSynthesis;
    if (this.cachedVoices.length === 0) {
      this.refreshVoices();
      if (this.cachedVoices.length === 0) {
        window.clearTimeout(this.voicesWaitTimer);
        this.voicesWaitTimer = window.setTimeout(() => {
          this.refreshVoices();
          this.queue.unshift(text);
          this.speakNextQueued();
        }, 120);
        return;
      }
    }
    const prosody = prosodyForRole(this.queueLocale, this.queueRole);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = prosody.lang;
    utterance.rate = prosody.rate;
    utterance.pitch = prosody.pitch;
    utterance.volume = Math.min(1, Math.max(0.15, this.queueVolume * 0.95));

    const voice = this.resolveVoice(this.queueLocale);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      if (this.queue.length > 0) {
        this.gapTimer = window.setTimeout(() => {
          this.speakNextQueued();
        }, this.queueLocale === 'zh' ? 520 : 450);
      } else {
        this.finishUtteranceQueue();
      }
    };

    utterance.onerror = () => {
      if (this.queue.length > 0) {
        this.speakNextQueued();
      } else {
        this.finishUtteranceQueue();
      }
    };

    synth.speak(utterance);
  }
}
