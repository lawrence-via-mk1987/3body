export class StableEraBanner {
  private hideTimer = 0;
  private visible = false;

  constructor(
    private readonly banner: HTMLElement,
    private readonly subtitle: HTMLElement,
  ) {}

  show(): void {
    this.banner.classList.remove('hidden');
    this.subtitle.textContent = 'The suns settle. The grove remembers green. Breathe.';
    this.visible = true;
    this.hideTimer = 6;
  }

  hide(): void {
    this.banner.classList.add('hidden');
    this.visible = false;
    this.hideTimer = 0;
  }

  update(delta: number): void {
    if (!this.visible) {
      return;
    }

    this.hideTimer -= delta;
    if (this.hideTimer <= 0) {
      this.hide();
    }
  }
}
