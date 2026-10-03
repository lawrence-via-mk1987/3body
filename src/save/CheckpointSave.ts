import type { EraKind, EraPhase } from '../orbital/types';
import type { SurvivalStatus } from '../survival/SurvivalSystem';

const STORAGE_KEY = '3body_checkpoint';
const SAVE_VERSION = 1;

export interface CheckpointData {
  version: typeof SAVE_VERSION;
  savedAt: number;
  label: string;
  player: { x: number; y: number; z: number };
  survival: {
    health: number;
    hydration: number;
    status: SurvivalStatus;
  };
  orbital: {
    era: EraKind;
    phase: EraPhase;
    elapsedInPhase: number;
    phaseDuration: number;
    dangerousCooldown: number;
  };
  meta: {
    chaoticTransitionsThisRun: number;
    enteredStableThisRun: boolean;
  };
  civilizationCycle?: number;
}

export class CheckpointSave {
  static hasCheckpoint(): boolean {
    return CheckpointSave.load() !== null;
  }

  static load(): CheckpointData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const data = JSON.parse(raw) as CheckpointData;
      if (data.version !== SAVE_VERSION) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  static save(data: CheckpointData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  static formatSavedAt(timestamp: number): string {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
