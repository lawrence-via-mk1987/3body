import type { Locale } from '../i18n/locale';
import {
  journalEmptyEra,
  journalEmptyLetters,
  journalEmptyLogs,
  journalLettersHeading,
  journalQuestHeading,
} from '../i18n/uiStrings';
import type { LogDiscovery } from '../narrative/LogDiscovery';
import type { RunJournal } from '../narrative/RunJournal';
import { getLogCopy, type TextLog } from '../narrative/logs';
import type { StoryBeatId } from '../narrative/storyContent';
import {
  getQuestSteps,
  isQuestStepComplete,
  type QuestProgressInput,
} from '../narrative/questContent';
import { getStoryBeat } from '../narrative/storyContent';
import type { CounselSnapshot } from '../narrative/CounselChoices';
import {
  formatCounselHudLine,
  formatCounselJournalHeading,
} from '../narrative/counselLabels';

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
    private readonly questList: HTMLUListElement,
    private readonly questHeading: HTMLElement,
    private readonly counselList: HTMLUListElement,
    private readonly counselHeading: HTMLElement,
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
    questProgress: QuestProgressInput,
    counsel: CounselSnapshot,
  ): void {
    if (this.openState) {
      this.close();
      return;
    }
    this.render(runJournal, discovery, letterIds, locale, questProgress, counsel);
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
    questProgress: QuestProgressInput,
    counsel: CounselSnapshot,
  ): void {
    this.counselHeading.textContent = formatCounselJournalHeading(locale);
    this.counselList.replaceChildren();
    const counselLine = formatCounselHudLine(locale, counsel);
    if (!counselLine) {
      const empty = document.createElement('li');
      empty.className = 'journal-empty';
      empty.textContent =
        locale === 'zh'
          ? '尚未向登记官、预测者或守林人做出咨询选择。'
          : locale === 'ja'
            ? 'まだ助言を選んでいない。'
            : 'No counsel choices yet — talk at the pit, observatory, or grove.';
      this.counselList.append(empty);
    } else {
      const item = document.createElement('li');
      item.className = 'journal-counsel-summary';
      item.textContent = counselLine;
      this.counselList.append(item);
    }

    this.questHeading.textContent = journalQuestHeading(locale);
    this.questList.replaceChildren();
    for (const step of getQuestSteps(locale)) {
      const done = isQuestStepComplete(step.id, questProgress);
      const item = document.createElement('li');
      item.className = done ? 'journal-quest-done' : 'journal-quest-active';
      const mark = document.createElement('span');
      mark.className = 'journal-quest-mark';
      mark.textContent = done ? '✓' : '○';
      const text = document.createElement('span');
      text.className = 'journal-quest-text';
      text.textContent = `${step.title} — ${step.detail}`;
      item.append(mark, text);
      this.questList.append(item);
    }

    this.lettersHeading.textContent = journalLettersHeading(locale);

    const total = discovery.getAllLogs().length;
    const found = discovery.getDiscoveredCount();
    this.logCount.textContent = `${found} / ${total}`;

    this.letterList.replaceChildren();
    if (letterIds.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'journal-empty';
      empty.textContent = journalEmptyLetters(locale);
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
      empty.textContent = journalEmptyEra(locale);
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
      empty.textContent = journalEmptyLogs(locale);
      this.logList.append(empty);
    } else {
      for (const log of discovered) {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'journal-log-btn';
        button.textContent = getLogCopy(log, locale).title;
        button.addEventListener('click', () => {
          this.onReadLogCallback?.(log, discovered);
        });
        item.append(button);
        this.logList.append(item);
      }
    }
  }
}
