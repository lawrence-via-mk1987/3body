import type { FirstPersonController } from '../player/FirstPersonController';

export interface MobileControlHooks {
  isGameplayActive: () => boolean;
  onInteract: () => void;
  onUse: () => void;
  onJournal: () => void;
  onPause: () => void;
  getInteractLabel: () => string;
  getUseLabel: () => string;
}

const LOOK_SENSITIVITY = 0.0045;
const STICK_RADIUS = 52;

export class MobileControls {
  private stickActive = false;
  private stickTouchId: number | null = null;
  private stickCenter = { x: 0, y: 0 };
  private lookTouchId: number | null = null;
  private lastLook = { x: 0, y: 0 };
  private sprintHeld = false;
  private labelTimer = 0;

  constructor(
    private readonly root: HTMLElement,
    private readonly lookZone: HTMLElement,
    private readonly stickBase: HTMLElement,
    private readonly stickKnob: HTMLElement,
    private readonly interactButton: HTMLButtonElement,
    private readonly useButton: HTMLButtonElement,
    private readonly journalButton: HTMLButtonElement,
    private readonly pauseButton: HTMLButtonElement,
    private readonly sprintButton: HTMLButtonElement,
    private readonly lookHint: HTMLElement,
    private readonly player: FirstPersonController,
    private readonly hooks: MobileControlHooks,
  ) {
    this.bindStick();
    this.bindLook();
    this.bindButtons();
  }

  show(): void {
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
  }

  hide(): void {
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.resetStick();
    this.endSprint();
  }

  /** Hide touch chrome while the Sky sheet is open so it cannot steal taps. */
  setSkySheetOpen(open: boolean): void {
    this.root.classList.toggle('mobile-controls-sky-sheet-open', open);
  }

  update(delta: number): void {
    if (this.root.classList.contains('hidden')) {
      return;
    }
    this.labelTimer -= delta;
    if (this.labelTimer <= 0) {
      this.labelTimer = 0.35;
      this.interactButton.textContent = this.hooks.getInteractLabel();
      this.useButton.textContent = this.hooks.getUseLabel();
    }
    const active = this.hooks.isGameplayActive();
    this.root.classList.toggle('mobile-controls-inactive', !active);
  }

  private bindButtons(): void {
    this.interactButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.hooks.isGameplayActive()) {
        this.hooks.onInteract();
      }
    });
    this.useButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.hooks.isGameplayActive()) {
        this.hooks.onUse();
      }
    });
    this.journalButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.hooks.onJournal();
    });
    this.pauseButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.hooks.onPause();
    });

    const startSprint = (event: Event): void => {
      event.preventDefault();
      this.sprintHeld = true;
      this.player.setVirtualKey('ShiftLeft', true);
      this.sprintButton.classList.add('active');
    };
    const endSprint = (): void => {
      this.endSprint();
    };
    this.sprintButton.addEventListener('touchstart', startSprint, { passive: false });
    this.sprintButton.addEventListener('touchend', endSprint);
    this.sprintButton.addEventListener('touchcancel', endSprint);
    this.sprintButton.addEventListener('mousedown', startSprint);
    this.sprintButton.addEventListener('mouseup', endSprint);
    this.sprintButton.addEventListener('mouseleave', endSprint);
  }

  private endSprint(): void {
    if (!this.sprintHeld) {
      return;
    }
    this.sprintHeld = false;
    this.player.setVirtualKey('ShiftLeft', false);
    this.sprintButton.classList.remove('active');
  }

  private bindStick(): void {
    const onStart = (event: TouchEvent): void => {
      if (!this.hooks.isGameplayActive()) {
        return;
      }
      event.preventDefault();
      const touch = event.changedTouches[0];
      if (!touch) {
        return;
      }
      this.stickActive = true;
      this.stickTouchId = touch.identifier;
      const rect = this.stickBase.getBoundingClientRect();
      this.stickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      this.moveStick(touch.clientX, touch.clientY);
    };

    const onMove = (event: TouchEvent): void => {
      if (!this.stickActive || this.stickTouchId === null) {
        return;
      }
      const touch = [...event.changedTouches].find((t) => t.identifier === this.stickTouchId)
        ?? [...event.touches].find((t) => t.identifier === this.stickTouchId);
      if (!touch) {
        return;
      }
      event.preventDefault();
      this.moveStick(touch.clientX, touch.clientY);
    };

    const onEnd = (event: TouchEvent): void => {
      if (this.stickTouchId === null) {
        return;
      }
      const ended = [...event.changedTouches].some((t) => t.identifier === this.stickTouchId);
      if (!ended) {
        return;
      }
      event.preventDefault();
      this.resetStick();
    };

    this.stickBase.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd, { passive: false });
    window.addEventListener('touchcancel', onEnd, { passive: false });
  }

  private bindLook(): void {
    const onStart = (event: TouchEvent): void => {
      if (!this.hooks.isGameplayActive()) {
        return;
      }
      const touch = event.changedTouches[0];
      if (!touch) {
        return;
      }
      this.lookTouchId = touch.identifier;
      this.lastLook = { x: touch.clientX, y: touch.clientY };
      this.lookHint.classList.add('hidden');
    };

    const onMove = (event: TouchEvent): void => {
      if (this.lookTouchId === null) {
        return;
      }
      const touch = [...event.touches].find((t) => t.identifier === this.lookTouchId);
      if (!touch) {
        return;
      }
      event.preventDefault();
      const dx = touch.clientX - this.lastLook.x;
      const dy = touch.clientY - this.lastLook.y;
      this.lastLook = { x: touch.clientX, y: touch.clientY };
      this.player.applyLookDelta(dx * LOOK_SENSITIVITY, dy * LOOK_SENSITIVITY);
    };

    const onEnd = (event: TouchEvent): void => {
      if (this.lookTouchId === null) {
        return;
      }
      const ended = [...event.changedTouches].some((t) => t.identifier === this.lookTouchId);
      if (ended) {
        this.lookTouchId = null;
      }
    };

    this.lookZone.addEventListener('touchstart', onStart, { passive: false });
    this.lookZone.addEventListener('touchmove', onMove, { passive: false });
    this.lookZone.addEventListener('touchend', onEnd, { passive: false });
    this.lookZone.addEventListener('touchcancel', onEnd, { passive: false });
  }

  private moveStick(clientX: number, clientY: number): void {
    const dx = clientX - this.stickCenter.x;
    const dy = clientY - this.stickCenter.y;
    const distance = Math.hypot(dx, dy);
    const clamped = Math.min(distance, STICK_RADIUS);
    const angle = Math.atan2(dy, dx);
    const knobX = Math.cos(angle) * clamped;
    const knobY = Math.sin(angle) * clamped;
    this.stickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

    const nx = clamped > 8 ? knobX / STICK_RADIUS : 0;
    const ny = clamped > 8 ? knobY / STICK_RADIUS : 0;
    this.applyStickToKeys(nx, ny);
  }

  private applyStickToKeys(nx: number, ny: number): void {
    const forward = ny < -0.22;
    const back = ny > 0.22;
    const left = nx < -0.22;
    const right = nx > 0.22;
    this.player.setVirtualKey('KeyW', forward);
    this.player.setVirtualKey('KeyS', back);
    this.player.setVirtualKey('KeyA', left);
    this.player.setVirtualKey('KeyD', right);
  }

  private resetStick(): void {
    this.stickActive = false;
    this.stickTouchId = null;
    this.stickKnob.style.transform = 'translate(0px, 0px)';
    this.player.setVirtualKey('KeyW', false);
    this.player.setVirtualKey('KeyS', false);
    this.player.setVirtualKey('KeyA', false);
    this.player.setVirtualKey('KeyD', false);
  }
}
