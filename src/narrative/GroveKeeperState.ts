const STORAGE_KEY = '3body_grove_keeper';

export class GroveKeeperState {
  private spokeOnce = false;
  private receivedHopeHint = false;

  constructor() {
    this.load();
  }

  hasSpokeOnce(): boolean {
    return this.spokeOnce;
  }

  hasHopeHint(): boolean {
    return this.receivedHopeHint;
  }

  markSpoke(): void {
    this.spokeOnce = true;
    this.save();
  }

  markHopeHint(): void {
    this.receivedHopeHint = true;
    this.spokeOnce = true;
    this.save();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as { spokeOnce?: boolean; receivedHopeHint?: boolean };
      this.spokeOnce = Boolean(parsed.spokeOnce);
      this.receivedHopeHint = Boolean(parsed.receivedHopeHint);
    } catch {
      // ignore
    }
  }

  private save(): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        spokeOnce: this.spokeOnce,
        receivedHopeHint: this.receivedHopeHint,
      }),
    );
  }
}
