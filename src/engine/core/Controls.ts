import * as THREE from 'three';

export class Controls {
  private keys = new Set<string>();
  private mouseX = 0;
  private mouseY = 0;
  private dragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // Burchaklar (radian)
  private yaw = 0;
  private pitch = 0;

  enabled = true;

  constructor(
    private camera: THREE.PerspectiveCamera,
    private canvas: HTMLCanvasElement,
  ) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);

    // Touch (mobil)
    canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
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
    // Cheklash: pitch -85° ... +85°
    this.pitch = Math.max(-1.48, Math.min(1.48, this.pitch));
  }

  /**
   * Har kadr chaqiriladi. Kamerani harakatlantiradi.
   * speed — joriy tezlik (birlik/sekund).
   */
  update(dt: number, speed: number) {
    if (!this.enabled) return;

    // Kamera yo'nalishini yaw/pitch bo'yicha yangilash
    const q = new THREE.Quaternion();
    q.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    this.camera.quaternion.copy(q);

    // Harakat vektori
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
      const move = dir.multiplyScalar(speed * dt);
      this.camera.position.add(move);
    }
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('touchmove', this.onTouchMove);
  }
}