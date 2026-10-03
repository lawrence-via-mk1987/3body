import type { StoryBeatId } from './storyContent';

const STORAGE_KEY = '3body_story_beats';

export class StoryBeatState {
  private unlocked = new Set<StoryBeatId>();
  private runSeen = new Set<StoryBeatId>();

  constructor() {
    this.load();
  }

  resetRun(): void {
    this.runSeen.clear();
  }

  hasUnlocked(id: StoryBeatId): boolean {
    return this.unlocked.has(id);
  }

  hasSeenThisRun(id: StoryBeatId): boolean {
    return this.runSeen.has(id);
  }

  unlock(id: StoryBeatId): boolean {
    if (this.unlocked.has(id)) {
      return false;
    }
    this.unlocked.add(id);
    this.runSeen.add(id);
    this.save();
    return true;
  }

  markSeenThisRun(id: StoryBeatId): void {
    this.runSeen.add(id);
  }

  getUnlockedIds(): StoryBeatId[] {
    const order: StoryBeatId[] = [
      'letter_witness',
      'letter_waystone',
      'letter_fold',
      'letter_stable',
      'letter_predictor',
      'letter_threads',
      'letter_grove_call',
      'letter_final',
      'letter_death',
    ];
    return order.filter((id) => this.unlocked.has(id));
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return;
      }
      for (const id of parsed) {
        if (typeof id === 'string') {
          this.unlocked.add(id as StoryBeatId);
        }
      }
    } catch {
      // ignore corrupt storage
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.getUnlockedIds()));
  }
}
