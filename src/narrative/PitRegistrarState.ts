const STORAGE_KEY = '3body_pit_registrar';

export interface PitRegistrarFlags {
  spokeOnce: boolean;
  choseFoldLesson: boolean;
}

export class PitRegistrarState {
  private flags: PitRegistrarFlags = {
    spokeOnce: false,
    choseFoldLesson: false,
  };

  constructor() {
    this.load();
  }

  getFlags(): Readonly<PitRegistrarFlags> {
    return this.flags;
  }

  markSpoke(): void {
    this.flags.spokeOnce = true;
    this.save();
  }

  markFoldLesson(): void {
    this.flags.choseFoldLesson = true;
    this.save();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      this.flags = { ...this.flags, ...(JSON.parse(raw) as PitRegistrarFlags) };
    } catch {
      // ignore
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.flags));
  }
}
