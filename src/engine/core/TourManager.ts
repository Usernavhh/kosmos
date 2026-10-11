import * as THREE from 'three';
import type { Tour, TourKeyframe } from '../../data/tours';

export interface TourCallbacks {
  onStart?: (tour: Tour) => void;
  onKeyframe?: (kf: TourKeyframe, index: number, total: number) => void;
  onEnd?: () => void;
}

export class TourManager {
  private active = false;
  private tour: Tour | null = null;
  private kfIndex = 0;
  private elapsed = 0;
  private startPos = new THREE.Vector3();
  private startLook = new THREE.Vector3();

  constructor(private callbacks: TourCallbacks = {}) {}

  isActive(): boolean {
    return this.active;
  }

  start(tour: Tour, camera: THREE.Camera) {
    this.active = true;
    this.tour = tour;
    this.kfIndex = 0;
    this.elapsed = 0;
    this.startPos.copy(camera.position);

    // Boshlang'ich qarash nuqtasi
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    this.startLook.copy(camera.position).add(dir.multiplyScalar(1000));

    this.callbacks.onStart?.(tour);
    if (tour.keyframes.length > 0) {
      this.callbacks.onKeyframe?.(tour.keyframes[0], 0, tour.keyframes.length);
    }
  }

  stop() {
    this.active = false;
    this.tour = null;
    this.callbacks.onEnd?.();
  }

  next() {
    if (!this.tour) return;
    if (this.kfIndex < this.tour.keyframes.length - 1) {
      this.kfIndex++;
      this.elapsed = 0;
      this.callbacks.onKeyframe?.(
        this.tour.keyframes[this.kfIndex],
        this.kfIndex,
        this.tour.keyframes.length,
      );
    } else {
      this.stop();
    }
  }

  update(camera: THREE.Camera, dt: number) {
    if (!this.active || !this.tour) return;

    const kf = this.tour.keyframes[this.kfIndex];
    this.elapsed += dt;
    const t = Math.min(1, this.elapsed / kf.duration);
    // ease in-out
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const targetPos = new THREE.Vector3(...kf.pos);
    const targetLook = new THREE.Vector3(...kf.look);

    camera.position.lerpVectors(this.startPos, targetPos, e);

    // LookAt interpolyatsiyasi
    const startDummy = new THREE.Object3D();
    startDummy.position.copy(this.startPos);
    startDummy.lookAt(this.startLook);

    const endDummy = new THREE.Object3D();
    endDummy.position.copy(targetPos);
    endDummy.lookAt(targetLook);

    camera.quaternion.slerpQuaternions(
      startDummy.quaternion,
      endDummy.quaternion,
      e,
    );

    if (t >= 1) {
      // Keyingi keyframe'ga avtomatik o'tish
      this.startPos.copy(targetPos);
      this.startLook.copy(targetLook);
      if (this.kfIndex < this.tour.keyframes.length - 1) {
        this.kfIndex++;
        this.elapsed = 0;
        this.callbacks.onKeyframe?.(
          this.tour.keyframes[this.kfIndex],
          this.kfIndex,
          this.tour.keyframes.length,
        );
      } else {
        this.stop();
      }
    }
  }
}