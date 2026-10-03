export type RunJournalKind = 'cycle_start' | 'entered_stable' | 'left_stable' | 'checkpoint' | 'counsel';

export interface RunJournalEntry {
  id: string;
  at: number;
  kind: RunJournalKind;
  text: string;
}

let nextId = 0;

function makeId(): string {
  nextId += 1;
  return `journal-${nextId}`;
}

export class RunJournal {
  private readonly entries: RunJournalEntry[] = [];

  clear(): void {
    this.entries.length = 0;
  }

  getEntries(): readonly RunJournalEntry[] {
    return this.entries;
  }

  recordCycleStart(fromCheckpoint: boolean): void {
    this.entries.push({
      id: makeId(),
      at: Date.now(),
      kind: 'cycle_start',
      text: fromCheckpoint
        ? 'Resumed from checkpoint — the sky keeps its own time.'
        : 'A new cycle begins under chaotic skies.',
    });
  }

  recordEnteredStable(): void {
    this.entries.push({
      id: makeId(),
      at: Date.now(),
      kind: 'entered_stable',
      text: 'Entered Stable Era (恒纪元). The suns settle; green returns.',
    });
  }

  recordLeftStable(): void {
    this.entries.push({
      id: makeId(),
      at: Date.now(),
      kind: 'left_stable',
      text: 'Stable Era ended — Chaotic skies return.',
    });
  }

  recordCheckpoint(label: string): void {
    this.entries.push({
      id: makeId(),
      at: Date.now(),
      kind: 'checkpoint',
      text: `Checkpoint saved — ${label}.`,
    });
  }

  recordCounsel(text: string): void {
    this.entries.push({
      id: makeId(),
      at: Date.now(),
      kind: 'counsel',
      text,
    });
  }
}
