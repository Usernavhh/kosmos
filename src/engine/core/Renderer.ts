import type * as THREE from 'three';
import { WebGL2Backend } from '../backends/WebGL2Backend';
import { PostFX, POSTFX_PRESETS } from '../effects/PostFX';
import type { PresetConfig } from './QualityManager';

export class Renderer {
  readonly backend: WebGL2Backend;
  readonly canvas: HTMLCanvasElement;
  private postfx: PostFX | null = null;
  private config: PresetConfig;

  constructor(container: HTMLElement, config: PresetConfig) {
    this.config = config;
    this.backend = new WebGL2Backend();
    this.canvas = this.backend.canvas;
    container.appendChild(this.canvas);

    console.log(`[renderer] Preset: ${config.label}, PostFX: ${config.postfx}`);
  }

  attach(scene: THREE.Scene, camera: THREE.Camera) {
    const postfxConfig = POSTFX_PRESETS[this.config.postfx];

    if (postfxConfig && (postfxConfig.bloom || postfxConfig.toneMapping !== 'none')) {
      try {
        this.postfx = new PostFX(
          this.backend.renderer,
          scene,
          camera,
          postfxConfig,
        );
      } catch (e) {
        console.error('[renderer] PostFX xato:', e);
        this.postfx = null;
      }
    }
  }

  setSize(width: number, height: number) {
    this.backend.setSize(width, height);
    this.postfx?.setSize(width, height);
  }

  render(scene: THREE.Scene, camera: THREE.Camera, dt = 0.016) {
    if (this.postfx) {
      this.postfx.render(dt);
    } else {
      this.backend.render(scene, camera);
    }
  }

  dispose() {
    this.postfx?.dispose();
    this.backend.dispose();
  }
}