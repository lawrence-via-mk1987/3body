import { TEXT_LOGS, type TextLog } from './logs';

const STORAGE_KEY = '3body_discovered_logs';

export class LogDiscovery {
  private readonly discovered = new Set<string>();

  constructor() {
    this.load();
  }

  getAllLogs(): TextLog[] {
    return TEXT_LOGS;
  }

  isDiscovered(id: string): boolean {
    return this.discovered.has(id);
  }

  getDiscoveredCount(): number {
    return this.discovered.size;
  }

  discover(id: string): boolean {
    if (this.discovered.has(id)) {
      return false;
    }
    this.discovered.add(id);
    this.save();
    return true;
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as string[];
      for (const id of parsed) {
        this.discovered.add(id);
      }
    } catch {
      // Ignore malformed storage.
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.discovered]));
  }
}
