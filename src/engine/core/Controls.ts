import * as THREE from 'three';

export interface TurboLevel {
  name: string;
  mult: number;
}

export const TURBO_LEVELS: TurboLevel[] = [
  { name: 'OFF', mult: 1 },
  { name: '1', mult: 3 },
  { name: '2', mult: 10 },
  { name: '3', mult: 100 },
  { name: '4', mult: 1000 },
  { name: 'EXTREME', mult: 10000 },
];

export interface ControlsCallbacks {
  onTurboShow?: (selectedIndex: number) => void;
  onTurboSelect?: (selectedIndex: number) => void;
  onTurboHide?: (finalIndex: number) => void;
}

export class Controls {
  private keys = new Set<string>();
  private dragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  private yaw = 0;
  private pitch = 0;

  /** Joriy turbo darajasi (0 = OFF) */
  turboIndex = 0;
  /** Hozir Z bosilib, tanlash jarayoni ketayaptimi? */
  turboSelecting = false;
  /** Tanlash jarayonida joriy highlight */
  turboSelectedIndex = 0;

  enabled = true;

  constructor(
    private camera: THREE.PerspectiveCamera,
    private canvas: HTMLCanvasElement,
    private callbacks: ControlsCallbacks = {},
  ) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // Arrow tugmalari brauzer scroll qilmasin
    if (e.code.startsWith('Arrow')) e.preventDefault();

    // Z — turbo selektorni ochish
    if (e.code === 'KeyZ' && !e.repeat) {
      this.turboSelecting = true;
      this.turboSelectedIndex = this.turboIndex;
      this.callbacks.onTurboShow?.(this.turboSelectedIndex);
    }

    // Turbo tanlash paytida ← → navigatsiya
    if (this.turboSelecting) {
      if (e.code === 'ArrowLeft' && !e.repeat) {
        this.turboSelectedIndex = Math.max(0, this.turboSelectedIndex - 1);
        this.callbacks.onTurboSelect?.(this.turboSelectedIndex);
      }
      if (e.code === 'ArrowRight' && !e.repeat) {
        this.turboSelectedIndex = Math.min(
          TURBO_LEVELS.length - 1,
          this.turboSelectedIndex + 1,
        );
        this.callbacks.onTurboSelect?.(this.turboSelectedIndex);
      }
    }

    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'KeyZ' && this.turboSelecting) {
      this.turboSelecting = false;
      this.turboIndex = this.turboSelectedIndex;
      this.callbacks.onTurboHide?.(this.turboIndex);
      console.log(
        `[controls] Turbo qabul qilindi: ${TURBO_LEVELS[this.turboIndex].name} (×${TURBO_LEVELS[this.turboIndex].mult})`,
      );
    }
    this.keys.delete(e.code);
  };

  private onMouseDown = (e: MouseEvent) => {
    this.dragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  private onMouseUp = () => {
    this.dragging = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.dragging) return;
    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.rotate(dx, dy);
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      this.dragging = true;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
    }
  };

  private onTouchEnd = () => {
    this.dragging = false;
  };

  private onTouchMove = (e: TouchEvent) => {
    if (!this.dragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - this.lastMouseX;
    const dy = e.touches[0].clientY - this.lastMouseY;
    this.lastMouseX = e.touches[0].clientX;
    this.lastMouseY = e.touches[0].clientY;
    this.rotate(dx * 1.5, dy * 1.5);
  };

  private rotate(dx: number, dy: number) {
    const sens = 0.003;
    this.yaw -= dx * sens;
    this.pitch -= dy * sens;
    this.pitch = Math.max(-1.48, Math.min(1.48, this.pitch));
  }

  syncFromCamera() {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(this.camera.quaternion);
    this.pitch = Math.max(-1.48, Math.min(1.48, euler.x));
    this.yaw = euler.y;
  }

  getTurboMultiplier(): number {
    return TURBO_LEVELS[this.turboIndex].mult;
  }

  update(dt: number, speed: number) {
    if (!this.enabled) return;

    // Arrow tugmalari bilan kamera burish (turbo tanlash paytida emas)
    if (!this.turboSelecting) {
      const rotSpeed = 1.6; // rad/sek
      if (this.keys.has('ArrowLeft')) this.yaw += rotSpeed * dt;
      if (this.keys.has('ArrowRight')) this.yaw -= rotSpeed * dt;
      if (this.keys.has('ArrowUp')) this.pitch += rotSpeed * dt;
      if (this.keys.has('ArrowDown')) this.pitch -= rotSpeed * dt;
      this.pitch = Math.max(-1.48, Math.min(1.48, this.pitch));
    }

    const q = new THREE.Quaternion();
    q.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    this.camera.quaternion.copy(q);

    // Turbo tanlash paytida harakat to'xtatiladi
    if (this.turboSelecting) return;

    const dir = new THREE.Vector3();
    if (this.keys.has('KeyW')) dir.z -= 1;
    if (this.keys.has('KeyS')) dir.z += 1;
    if (this.keys.has('KeyA')) dir.x -= 1;
    if (this.keys.has('KeyD')) dir.x += 1;
    if (this.keys.has('Space')) dir.y += 1;
    if (this.keys.has('ShiftLeft')) dir.y -= 1;

    if (dir.lengthSq() > 0) {
      dir.normalize();
      dir.applyQuaternion(this.camera.quaternion);

      // Turbo doim qo'llanadi (tanlangan darajada)
      const turbo = this.getTurboMultiplier();
      const move = dir.multiplyScalar(speed * dt * turbo);
      this.camera.position.add(move);
    }
  }
}