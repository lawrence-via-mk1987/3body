import type { DialogueChoice, DialogueNode } from '../narrative/pitRegistrarDialogue';

export class DialoguePanel {
  private openState = false;
  private onOpenCallback: (() => void) | null = null;
  private onCloseCallback: (() => void) | null = null;
  private onChoiceCallback: ((choice: DialogueChoice) => void) | null = null;

  constructor(
    private readonly overlay: HTMLElement,
    private readonly speakerEl: HTMLElement,
    private readonly bodyEl: HTMLElement,
    private readonly choicesEl: HTMLElement,
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
      if (event.code === 'Escape' || event.code === 'Enter' || event.code === 'NumpadEnter') {
        if (this.choicesEl.childElementCount === 0) {
          event.preventDefault();
          this.close();
        }
      }
    });
  }

  onOpen(callback: () => void): void {
    this.onOpenCallback = callback;
  }

  onClose(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  onChoice(callback: (choice: DialogueChoice) => void): void {
    this.onChoiceCallback = callback;
  }

  isOpen(): boolean {
    return this.openState;
  }

  open(node: DialogueNode): void {
    this.renderNode(node);
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
    this.choicesEl.replaceChildren();
    this.onCloseCallback?.();
  }

  private renderNode(node: DialogueNode): void {
    this.speakerEl.textContent = node.speaker;
    this.bodyEl.textContent = node.body;
    this.choicesEl.replaceChildren();

    for (const choice of node.choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dialogue-choice';
      button.textContent = choice.label;
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.onChoiceCallback?.(choice);
      });
      this.choicesEl.append(button);
    }

    if (node.choices.length === 0) {
      const hint = document.createElement('p');
      hint.className = 'dialogue-end-hint';
      hint.textContent = 'Press Esc or Close to leave.';
      this.choicesEl.append(hint);
    }
  }
}
