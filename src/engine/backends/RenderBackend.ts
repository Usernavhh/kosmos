import type * as THREE from 'three';

export interface RenderBackend {
  readonly kind: 'webgl2' | 'webgpu';
  readonly canvas: HTMLCanvasElement;
  setSize(width: number, height: number): void;
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  dispose(): void;
}