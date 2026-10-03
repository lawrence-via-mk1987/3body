export class Toast {
  private hideTimer = 0;

  constructor(private readonly element: HTMLElement) {}

  show(message: string, seconds = 3.5): void {
    this.element.textContent = message;
    this.element.classList.remove('hidden');
    window.clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => {
      this.element.classList.add('hidden');
    }, seconds * 1000);
  }

  hide(): void {
    window.clearTimeout(this.hideTimer);
    this.element.classList.add('hidden');
  }
}
