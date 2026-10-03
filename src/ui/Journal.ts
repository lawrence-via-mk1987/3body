import type { Locale } from '../i18n/locale';
import type { LogDiscovery } from '../narrative/LogDiscovery';
import type { RunJournal } from '../narrative/RunJournal';
import type { TextLog } from '../narrative/logs';
import type { StoryBeatId } from '../narrative/storyContent';
import { getStoryBeat } from '../narrative/storyContent';

export class Journal {
  private openState = false;
  private onOpenCallback: (() => void) | null = null;
  private onCloseCallback: (() => void) | null = null;
  private onReadLogCallback: ((log: TextLog, gallery: TextLog[]) => void) | null = null;
  private onReadLetterCallback: ((id: StoryBeatId) => void) | null = null;

  constructor(
    private readonly overlay: HTMLElement,
    private readonly eraList: HTMLUListElement,
    private readonly logList: HTMLUListElement,
    private readonly logCount: HTMLElement,
    private readonly letterList: HTMLUListElement,
    private readonly lettersHeading: HTMLElement,
    closeButton: HTMLButtonElement,
  ) {
    closeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.close();
    });

    this.overlay.addEventListener('click', (event) => {
      if (event.target === this.overlay) {
        this.close();
      }
    });

    window.addEventListener('keydown', (event) => {
      if (!this.openState) {
        return;
      }
      if (event.code === 'Escape' || event.code === 'KeyJ') {
        event.preventDefault();
        event.stopPropagation();
        this.close();
      }
    });
  }

  onOpen(callback: () => void): void {
    this.onOpenCallback = callback;
  }

  onClose(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  onReadLog(callback: (log: TextLog, gallery: TextLog[]) => void): void {
    this.onReadLogCallback = callback;
  }

  onReadLetter(callback: (id: StoryBeatId) => void): void {
    this.onReadLetterCallback = callback;
  }

  isOpen(): boolean {
    return this.openState;
  }

  toggle(
    runJournal: RunJournal,
    discovery: LogDiscovery,
    letterIds: readonly StoryBeatId[],
    locale: Locale,
  ): void {
    if (this.openState) {
      this.close();
      return;
    }
    this.render(runJournal, discovery, letterIds, locale);
    this.overlay.classList.remove('hidden');
    this.openState = true;
    this.onOpenCallback?.();
  }

  close(): void {
    if (!this.openState) {
      return;
    }
    this.overlay.classList.add('hidden');
    this.openState = false;
    this.onCloseCallback?.();
  }

  private render(
    runJournal: RunJournal,
    discovery: LogDiscovery,
    letterIds: readonly StoryBeatId[],
    locale: Locale,
  ): void {
    this.lettersHeading.textContent = locale === 'zh'
      ? '上一循环智者的信'
      : 'Letters from the prior sage';

    const total = discovery.getAllLogs().length;
    const found = discovery.getDiscoveredCount();
    this.logCount.textContent = `${found} / ${total}`;

    this.letterList.replaceChildren();
    if (letterIds.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'journal-empty';
      empty.textContent = locale === 'zh'
        ? '旅程中会解锁信件。'
        : 'Letters unlock as you survive and discover the wasteland.';
      this.letterList.append(empty);
    } else {
      for (const id of letterIds) {
        const beat = getStoryBeat(locale, id);
        if (!beat) {
          continue;
        }
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'journal-log-btn journal-letter-btn';
        button.textContent = beat.journalTitle;
        button.addEventListener('click', () => {
          this.onReadLetterCallback?.(id);
        });
        item.append(button);
        this.letterList.append(item);
      }
    }

    this.eraList.replaceChildren();
    const eraEntries = runJournal.getEntries();
    if (eraEntries.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'journal-empty';
      empty.textContent = locale === 'zh'
        ? '本循环尚无天空记录。'
        : 'No sky events recorded yet this cycle.';
      this.eraList.append(empty);
    } else {
      for (const entry of eraEntries) {
        const item = document.createElement('li');
        item.dataset.kind = entry.kind;
        if (entry.kind === 'counsel') {
          item.classList.add('journal-counsel');
        }
        const time = document.createElement('span');
        time.className = 'journal-time';
        time.textContent = new Date(entry.at).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        });
        const text = document.createElement('span');
        text.className = 'journal-text';
        text.textContent = entry.text;
        item.append(time, text);
        this.eraList.append(item);
      }
    }

    this.logList.replaceChildren();
    const discovered = discovery.getDiscoveredLogsInOrder();
    if (discovered.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'journal-empty';
      empty.textContent = locale === 'zh'
        ? '尚未找回文字。在发光标记处按 F。'
        : 'No texts recovered yet. Press F at glowing markers.';
      this.logList.append(empty);
    } else {
      for (const log of discovered) {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'journal-log-btn';
        button.textContent = log.title;
        button.addEventListener('click', () => {
          this.onReadLogCallback?.(log, discovered);
        });
        item.append(button);
        this.logList.append(item);
      }
    }
  }
}
