import * as THREE from 'three';
import type { RenderBackend } from './RenderBackend';

export class WebGL2Backend implements RenderBackend {
  readonly kind = 'webgl2' as const;
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;

  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.canvas = this.renderer.domElement;
  }

  setSize(width: number, height: number) {
    this.renderer.setSize(width, height, false);
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer.render(scene, camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}