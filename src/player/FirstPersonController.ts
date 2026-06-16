import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import type { ShelterZones } from '../survival/ShelterZones';
import type { Terrain } from '../world/Terrain';

const MOVE_SPEED = 14;
const SPRINT_MULTIPLIER = 1.65;
const GRAVITY = 28;
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.35;

export class FirstPersonController {
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: PointerLockControls;

  private readonly keys = new Set<string>();
  private readonly pressedKeys = new Set<string>();
  private readonly velocity = new THREE.Vector3();
  private readonly moveDirection = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private isGrounded = false;
  private movementEnabled = true;

  constructor(
    domElement: HTMLElement,
    private readonly terrain: Terrain,
    private readonly shelterZones: ShelterZones | null,
    aspect: number,
  ) {
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 800);
    this.camera.position.set(0, 12, 24);

    this.controls = new PointerLockControls(this.camera, domElement);
    this.bindInput();
  }

  private bindInput(): void {
    window.addEventListener('keydown', (event) => {
      if (!this.keys.has(event.code)) {
        this.pressedKeys.add(event.code);
      }
      this.keys.add(event.code);
    });

    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
  }

  lock(): void {
    this.controls.lock();
  }

  unlock(): void {
    this.controls.unlock();
  }

  isLocked(): boolean {
    return this.controls.isLocked;
  }

  setMovementEnabled(enabled: boolean): void {
    this.movementEnabled = enabled;
    if (!enabled) {
      this.velocity.set(0, 0, 0);
    }
  }

  consumePressedKey(code: string): boolean {
    if (!this.pressedKeys.has(code)) {
      return false;
    }
    this.pressedKeys.delete(code);
    return true;
  }

  isSprinting(): boolean {
    return this.movementEnabled && (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'));
  }

  getPosition(): THREE.Vector3 {
    return this.camera.position;
  }

  resetToSpawn(): void {
    this.camera.position.set(0, 12, 24);
    this.velocity.set(0, 0, 0);
    this.movementEnabled = true;
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  update(delta: number): void {
    if (!this.movementEnabled) {
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, 12, delta);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, 0, 12, delta);
      return;
    }

    const sprinting = this.isSprinting();
    const speed = MOVE_SPEED * (sprinting ? SPRINT_MULTIPLIER : 1);

    this.controls.getDirection(this.forward);
    this.forward.y = 0;
    this.forward.normalize();

    this.right.crossVectors(this.forward, new THREE.Vector3(0, 1, 0)).normalize();

    this.moveDirection.set(0, 0, 0);

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) {
      this.moveDirection.add(this.forward);
    }
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) {
      this.moveDirection.sub(this.forward);
    }
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) {
      this.moveDirection.sub(this.right);
    }
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) {
      this.moveDirection.add(this.right);
    }

    if (this.moveDirection.lengthSq() > 0) {
      this.moveDirection.normalize();
      this.velocity.x = this.moveDirection.x * speed;
      this.velocity.z = this.moveDirection.z * speed;
    } else {
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, 12, delta);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, 0, 12, delta);
    }

    if (this.isGrounded && this.keys.has('Space')) {
      this.velocity.y = 8.5;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.velocity.y -= GRAVITY * delta;
    }

    const position = this.camera.position;
    position.x += this.velocity.x * delta;
    position.z += this.velocity.z * delta;
    position.y += this.velocity.y * delta;

    const bounds = this.terrain.getBounds();
    position.x = THREE.MathUtils.clamp(position.x, -bounds, bounds);
    position.z = THREE.MathUtils.clamp(position.z, -bounds, bounds);

    const groundHeight = this.getFloorHeight(position.x, position.z, position.y) + PLAYER_HEIGHT;
    if (position.y <= groundHeight) {
      position.y = groundHeight;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    this.resolveRockCollision(position);
  }

  private resolveRockCollision(position: THREE.Vector3): void {
    const rocks = [
      new THREE.Vector2(-18, -8),
      new THREE.Vector2(24, 12),
      new THREE.Vector2(-6, 28),
      new THREE.Vector2(36, -22),
    ];

    for (const rock of rocks) {
      const dx = position.x - rock.x;
      const dz = position.z - rock.y;
      const distance = Math.hypot(dx, dz);
      const minDistance = 2.4 + PLAYER_RADIUS;

      if (distance < minDistance && distance > 0.0001) {
        const push = (minDistance - distance) / distance;
        position.x += dx * push;
        position.z += dz * push;
      }
    }
  }

  private getFloorHeight(x: number, z: number, currentY: number): number {
    const surface = this.terrain.getHeightAt(x, z);
    if (!this.shelterZones) {
      return surface;
    }

    const bounds = this.shelterZones.getCaveBounds();
    if (
      x >= bounds.minX
      && x <= bounds.maxX
      && z >= bounds.minZ
      && z <= bounds.maxZ
    ) {
      const caveFloor = surface - bounds.depthBelowSurface;
      if (currentY < surface + 1.5) {
        return caveFloor;
      }
    }

    return surface;
  }

  getPositionText(): string {
    const { x, z } = this.camera.position;
    return `${x.toFixed(0)}, ${z.toFixed(0)}`;
  }
}
