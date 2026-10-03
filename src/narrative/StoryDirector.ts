import type { Locale } from '../i18n/locale';
import type { LogDiscovery } from './LogDiscovery';
import type { StoryBeatId } from './storyContent';
import {
  getStoryBeat,
  resolveStoryObjective,
  witnessBeatForCycle,
  type StoryObjectiveContext,
} from './storyContent';
import { StoryBeatState } from './StoryBeatState';

export type StoryBeatListener = (id: StoryBeatId) => void;

export class StoryDirector {
  private enteredStableThisRun = false;
  private predictorCalibrated = false;
  private pendingBeat: StoryBeatId | null = null;
  private listeners: StoryBeatListener[] = [];

  constructor(
    private readonly state: StoryBeatState,
    private getLocale: () => Locale,
    private getCivilizationCycle: () => number,
  ) {}

  onBeat(listener: StoryBeatListener): void {
    this.listeners.push(listener);
  }

  resetRun(): void {
    this.state.resetRun();
    this.enteredStableThisRun = false;
    this.predictorCalibrated = false;
    this.pendingBeat = null;
  }

  setPredictorCalibrated(value: boolean): void {
    this.predictorCalibrated = value;
  }

  syncFromDiscovery(discovery: LogDiscovery): void {
    if (discovery.isDiscovered('waystone') && !this.state.hasSeenThisRun('letter_waystone')) {
      this.queueBeat('letter_waystone');
    }
    if (discovery.getDiscoveredCount() >= 3 && !this.state.hasSeenThisRun('letter_threads')) {
      this.queueBeat('letter_threads');
    }
    if (
      this.enteredStableThisRun
      && discovery.getDiscoveredCount() >= 5
      && !discovery.isDiscovered('final_log')
      && !this.state.hasSeenThisRun('letter_grove_call')
    ) {
      this.queueBeat('letter_grove_call');
    }
    if (discovery.isDiscovered('final_log') && !this.state.hasSeenThisRun('letter_final')) {
      this.queueBeat('letter_final');
    }
  }

  onRunStart(): void {
    if (!this.state.hasUnlocked('letter_witness')) {
      this.queueBeat('letter_witness');
    }
  }

  onFirstDehydrate(): void {
    if (!this.state.hasSeenThisRun('letter_fold')) {
      this.queueBeat('letter_fold');
    }
  }

  onEnteredStableEra(): void {
    this.enteredStableThisRun = true;
    if (!this.state.hasSeenThisRun('letter_stable')) {
      this.queueBeat('letter_stable');
    }
  }

  onPredictorCalibrated(): void {
    this.predictorCalibrated = true;
    if (!this.state.hasSeenThisRun('letter_predictor')) {
      this.queueBeat('letter_predictor');
    }
  }

  onDeath(): void {
    if (!this.state.hasSeenThisRun('letter_death')) {
      this.queueBeat('letter_death');
    }
  }

  getObjectiveText(discovery: LogDiscovery): string {
    const ctx = this.buildContext(discovery);
    return resolveStoryObjective(this.getLocale(), ctx);
  }

  buildContext(discovery: LogDiscovery): StoryObjectiveContext {
    return {
      hasWaystone: discovery.isDiscovered('waystone'),
      predictorCalibrated: this.predictorCalibrated,
      enteredStableThisRun: this.enteredStableThisRun,
      hasFinalLog: discovery.isDiscovered('final_log'),
      logCount: discovery.getDiscoveredCount(),
    };
  }

  peekPendingBeat(): StoryBeatId | null {
    return this.pendingBeat;
  }

  confirmBeatShown(id: StoryBeatId): void {
    if (this.pendingBeat === id) {
      this.pendingBeat = null;
    }
    this.state.unlock(id);
    this.runJournalRecord?.(id);
    for (const listener of this.listeners) {
      listener(id);
    }
  }

  private runJournalRecord: ((id: StoryBeatId) => void) | null = null;

  setJournalRecorder(recorder: (id: StoryBeatId) => void): void {
    this.runJournalRecord = recorder;
  }

  getBeatCopy(id: StoryBeatId) {
    if (id === 'letter_witness') {
      return witnessBeatForCycle(this.getLocale(), this.getCivilizationCycle());
    }
    return getStoryBeat(this.getLocale(), id);
  }

  getUnlockedForJournal() {
    return this.state.getUnlockedIds();
  }

  private queueBeat(id: StoryBeatId): void {
    if (this.state.hasUnlocked(id)) {
      return;
    }
    if (this.state.hasSeenThisRun(id)) {
      return;
    }
    this.state.markSeenThisRun(id);
    if (this.pendingBeat === null) {
      this.pendingBeat = id;
    }
  }
}
