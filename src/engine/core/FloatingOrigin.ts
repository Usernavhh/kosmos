import * as THREE from 'three';

export class FloatingOrigin {
  threshold = 1_000_000;
  private accumulatedOffset = new THREE.Vector3();
  private paused = false;

  update(scene: THREE.Scene, camera: THREE.PerspectiveCamera): boolean {
    if (this.paused) return false;

    const dist = camera.position.length();
    if (dist < this.threshold) return false;

    const offset = camera.position.clone();
    for (const child of scene.children) {
      child.position.sub(offset);
    }
    camera.position.set(0, 0, 0);
    this.accumulatedOffset.add(offset);

    console.log(
      `[floating-origin] Warp: ${offset.length().toFixed(0)} ` +
      `(jami: ${this.accumulatedOffset.length().toFixed(0)})`,
    );
    return true;
  }

  getTotalDistance(cameraPos: THREE.Vector3): number {
    return this.accumulatedOffset.clone().add(cameraPos).length();
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; }
  isPaused() { return this.paused; }

  reset(scene: THREE.Scene, camera: THREE.PerspectiveCamera, homePosition: THREE.Vector3) {
    for (const child of scene.children) {
      child.position.add(this.accumulatedOffset);
    }
    this.accumulatedOffset.set(0, 0, 0);

    camera.position.copy(homePosition);
    const dummy = new THREE.Object3D();
    dummy.position.copy(homePosition);
    dummy.lookAt(0, 0, 0);
    camera.quaternion.copy(dummy.quaternion);

    console.log('[floating-origin] Reset');
  }
}