import * as THREE from 'three';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  ToneMappingEffect,
  ToneMappingMode,
  SMAAEffect,
} from 'postprocessing';

export interface PostFXConfig {
  bloom: boolean;
  bloomIntensity: number;
  bloomLuminanceThreshold: number;
  bloomLuminanceSmoothing: number;
  bloomRadius: number;
  toneMapping: 'none' | 'aces' | 'reinhard' | 'agx' | 'neutral';
  exposure: number;
  smaa: boolean;
}

export const POSTFX_PRESETS: Record<string, PostFXConfig> = {
  off: {
    bloom: false, bloomIntensity: 0, bloomLuminanceThreshold: 1,
    bloomLuminanceSmoothing: 0, bloomRadius: 0,
    toneMapping: 'none', exposure: 1, smaa: false,
  },
  cinematic: {
    bloom: true, bloomIntensity: 0.8, bloomLuminanceThreshold: 0.85,
    bloomLuminanceSmoothing: 0.3, bloomRadius: 0.5,
    toneMapping: 'aces', exposure: 1.05, smaa: true,
  },
  space: {
    bloom: true, bloomIntensity: 1.4, bloomLuminanceThreshold: 0.7,
    bloomLuminanceSmoothing: 0.4, bloomRadius: 0.7,
    toneMapping: 'aces', exposure: 1.15, smaa: true,
  },
  extreme: {
    bloom: true, bloomIntensity: 1.8, bloomLuminanceThreshold: 0.55,
    bloomLuminanceSmoothing: 0.5, bloomRadius: 0.9,
    toneMapping: 'agx', exposure: 1.25, smaa: true,
  },
};

export class PostFX {
  private composer: EffectComposer;
  private bloom: BloomEffect | null = null;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    config: PostFXConfig,
  ) {
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.composer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: config.smaa ? 4 : 0,
    });

    this.composer.addPass(new RenderPass(scene, camera));

    const effects: (BloomEffect | ToneMappingEffect | SMAAEffect)[] = [];

    if (config.bloom) {
      this.bloom = new BloomEffect({
        intensity: config.bloomIntensity,
        luminanceThreshold: config.bloomLuminanceThreshold,
        luminanceSmoothing: config.bloomLuminanceSmoothing,
        radius: config.bloomRadius,
        mipmapBlur: true,
      });
      effects.push(this.bloom);
    }

    if (config.smaa && !config.bloom) {
      effects.push(new SMAAEffect());
    }

    if (config.toneMapping !== 'none') {
      const mode =
        config.toneMapping === 'aces' ? ToneMappingMode.ACES_FILMIC
        : config.toneMapping === 'agx' ? ToneMappingMode.AGX
        : config.toneMapping === 'reinhard' ? ToneMappingMode.REINHARD
        : config.toneMapping === 'neutral' ? ToneMappingMode.NEUTRAL
        : ToneMappingMode.ACES_FILMIC;

      effects.push(new ToneMappingEffect({
        mode,
        exposure: config.exposure,
      }));
    }

    if (effects.length > 0) {
      this.composer.addPass(new EffectPass(camera, ...effects));
    }

    console.log(
      `[postfx] ✅ ${config.bloom ? 'bloom(' + config.bloomIntensity + ')' : ''}` +
      `${config.toneMapping !== 'none' ? ' + ' + config.toneMapping : ''}` +
      `${config.smaa ? ' + smaa' : ''}`,
    );
  }

  render(dt: number) {
    this.composer.render(dt);
  }

  setSize(width: number, height: number) {
    this.composer.setSize(width, height);
  }

  dispose() {
    this.composer.dispose();
  }
}