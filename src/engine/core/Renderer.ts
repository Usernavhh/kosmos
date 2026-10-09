import type * as THREE from 'three';
import type { RenderBackend } from '../backends/RenderBackend';
import { WebGL2Backend } from '../backends/WebGL2Backend';

export class Renderer {
  readonly backend: RenderBackend;
  readonly canvas: HTMLCanvasElement;

  constructor(container: HTMLElement) {
    this.backend = new WebGL2Backend();
    this.canvas = this.backend.canvas;
    container.appendChild(this.canvas);
  }

  setSize(width: number, height: number) {
    this.backend.setSize(width, height);
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.backend.render(scene, camera);
  }
}