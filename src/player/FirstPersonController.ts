import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import type { ShelterZones } from '../survival/ShelterZones';
import type { Terrain } from '../world/Terrain';

const MOVE_SPEED = 14;
const SPRINT_MULTIPLIER = 1.65;
const GRAVITY = 28;
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.35;
/**
 * Face +Z on spawn. The spawn sits where two trenches cross; +Z looks down the open trench
 * floor towards the rising Thaw sun instead of straight into a 10 m wall.
 */
const SPAWN_YAW = Math.PI;

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
  private touchMode = false;
  private touchEngaged = false;
  private readonly virtualKeys = new Set<string>();

  constructor(
    domElement: HTMLElement,
    private readonly terrain: Terrain,
    private readonly shelterZones: ShelterZones | null,
    aspect: number,
  ) {
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 800);
    this.camera.position.set(0, 12, 24);
    this.setFacing(SPAWN_YAW);

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

  enableTouchMode(): void {
    this.touchMode = true;
    this.touchEngaged = true;
    if (this.controls.isLocked) {
      this.controls.unlock();
    }
  }

  isTouchMode(): boolean {
    return this.touchMode;
  }

  applyLookDelta(yawDelta: number, pitchDelta: number): void {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(this.camera.quaternion);
    euler.y -= yawDelta;
    euler.x -= pitchDelta;
    euler.x = THREE.MathUtils.clamp(euler.x, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
    this.camera.quaternion.setFromEuler(euler);
  }

  setVirtualKey(code: string, active: boolean): void {
    if (active) {
      this.virtualKeys.add(code);
    } else {
      this.virtualKeys.delete(code);
    }
  }

  pulseVirtualKey(code: string): void {
    this.pressedKeys.add(code);
  }

  private isKeyActive(code: string): boolean {
    return this.keys.has(code) || this.virtualKeys.has(code);
  }

  lock(): void {
    if (this.touchMode) {
      this.touchEngaged = true;
      return;
    }
    this.controls.lock();
  }

  tryLock(): void {
    if (this.touchMode) {
      this.touchEngaged = true;
      return;
    }
    if (this.controls.isLocked) {
      return;
    }
    this.controls.lock();
  }

  unlock(): void {
    if (this.touchMode) {
      this.touchEngaged = false;
      return;
    }
    this.controls.unlock();
  }

  isLocked(): boolean {
    if (this.touchMode) {
      return this.touchEngaged;
    }
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
    return this.movementEnabled && (
      this.isKeyActive('ShiftLeft')
      || this.isKeyActive('ShiftRight')
    );
  }

  getPosition(): THREE.Vector3 {
    return this.camera.position;
  }

  resetToSpawn(): void {
    this.setPosition(0, 12, 24);
    this.setFacing(SPAWN_YAW);
  }

  /** Yaw in radians (0 = -Z); pitch in radians, positive looks up. */
  setFacing(yaw: number, pitch = 0): void {
    this.camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
  }

  setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
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

    if (this.isKeyActive('KeyW') || this.isKeyActive('ArrowUp')) {
      this.moveDirection.add(this.forward);
    }
    if (this.isKeyActive('KeyS') || this.isKeyActive('ArrowDown')) {
      this.moveDirection.sub(this.forward);
    }
    if (this.isKeyActive('KeyA') || this.isKeyActive('ArrowLeft')) {
      this.moveDirection.sub(this.right);
    }
    if (this.isKeyActive('KeyD') || this.isKeyActive('ArrowRight')) {
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

    if (this.isGrounded && this.isKeyActive('Space')) {
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

  /** Y-axis rotation in radians (0 ≈ looking toward world −Z). */
  getHorizontalYaw(): number {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(this.camera.quaternion);
    return euler.y;
  }
}
