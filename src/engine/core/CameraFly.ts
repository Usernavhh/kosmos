import * as THREE from 'three';

/**
 * Kamera uchun silliq uchish animatsiyasi.
 * Boshlang'ich va oxirgi nuqtalar orasida logarifmik interpolyatsiya.
 */
export class CameraFly {
  private active = false;
  private startPos = new THREE.Vector3();
  private endPos = new THREE.Vector3();
  private startQuat = new THREE.Quaternion();
  private endQuat = new THREE.Quaternion();
  private duration = 0;
  private elapsed = 0;

  start(
    camera: THREE.Camera,
    endPos: THREE.Vector3,
    endLookAt: THREE.Vector3,
    duration: number,
  ) {
    this.startPos.copy(camera.position);
    this.endPos.copy(endPos);
    this.startQuat.copy(camera.quaternion);

    // End quaternion - qarash yo'nalishi
    const dummy = new THREE.Object3D();
    dummy.position.copy(endPos);
    dummy.lookAt(endLookAt);
    this.endQuat.copy(dummy.quaternion);

    this.duration = duration;
    this.elapsed = 0;
    this.active = true;
  }

  update(camera: THREE.Camera, dt: number) {
    if (!this.active) return;
    this.elapsed += dt;

    let t = Math.min(1, this.elapsed / this.duration);
    // ease-in-out cubic
    t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    camera.position.lerpVectors(this.startPos, this.endPos, t);
    camera.quaternion.slerpQuaternions(this.startQuat, this.endQuat, t);

    if (this.elapsed >= this.duration) {
      this.active = false;
    }
  }

  isActive(): boolean {
    return this.active;
  }

  stop() {
    this.active = false;
  }
}