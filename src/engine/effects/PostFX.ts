import * as THREE from 'three';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  ToneMappingEffect,
  ToneMappingMode,
  SMAAEffect,
  VignetteEffect,
  BlendFunction,
} from 'postprocessing';
import { DOFEffect } from './DOF';

export interface PostFXConfig {
  bloom: boolean;
  bloomIntensity: number;
  bloomLuminanceThreshold: number;
  bloomLuminanceSmoothing: number;
  bloomRadius: number;
  toneMapping: 'none' | 'aces' | 'reinhard' | 'agx' | 'neutral';
  exposure: number;
  smaa: boolean;
  dof: boolean;
  vignette: boolean;
}

export const POSTFX_PRESETS: Record<string, PostFXConfig> = {
  off: {
    bloom: false, bloomIntensity: 0, bloomLuminanceThreshold: 1,
    bloomLuminanceSmoothing: 0, bloomRadius: 0,
    toneMapping: 'none', exposure: 1, smaa: false,
    dof: false, vignette: false,
  },
  cinematic: {
    bloom: true, bloomIntensity: 0.8, bloomLuminanceThreshold: 0.85,
    bloomLuminanceSmoothing: 0.3, bloomRadius: 0.5,
    toneMapping: 'aces', exposure: 1.05, smaa: true,
    dof: false, vignette: true,
  },
  space: {
    bloom: true, bloomIntensity: 1.4, bloomLuminanceThreshold: 0.7,
    bloomLuminanceSmoothing: 0.4, bloomRadius: 0.7,
    toneMapping: 'aces', exposure: 1.15, smaa: true,
    dof: false, vignette: true,
  },
  extreme: {
    bloom: true, bloomIntensity: 1.8, bloomLuminanceThreshold: 0.55,
    bloomLuminanceSmoothing: 0.5, bloomRadius: 0.9,
    toneMapping: 'agx', exposure: 1.25, smaa: true,
    dof: true, vignette: true,
  },
};

export class PostFX {
  private composer: EffectComposer;
  private bloom: BloomEffect | null = null;
  private dof: DOFEffect | null = null;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    config: PostFXConfig,
  ) {
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.composer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: config.smaa ? 4 : 0,
    });

    this.composer.addPass(new RenderPass(scene, camera));

    const effects: (BloomEffect | ToneMappingEffect | SMAAEffect | VignetteEffect | ReturnType<DOFEffect['getEffect']>)[] = [];

    // Bloom
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

    // SMAA (bloom yo'q bo'lsa)
    if (config.smaa && !config.bloom) {
      effects.push(new SMAAEffect());
    }

    // DOF
    if (config.dof) {
      this.dof = new DOFEffect(camera);
      effects.push(this.dof.getEffect());
    }

    // Vignette (chetlari qorong‘i)
    if (config.vignette) {
      effects.push(new VignetteEffect({
        offset: 0.4,
        darkness: 0.5,
        blendFunction: BlendFunction.NORMAL,
      }));
    }

    // Tone mapping
    if (config.toneMapping !== 'none') {
      const mode =
        config.toneMapping === 'aces' ? ToneMappingMode.ACES_FILMIC
        : config.toneMapping === 'agx' ? ToneMappingMode.AGX
        : config.toneMapping === 'reinhard' ? ToneMappingMode.REINHARD
        : config.toneMapping === 'neutral' ? ToneMappingMode.NEUTRAL
        : ToneMappingMode.ACES_FILMIC;

      effects.push(new ToneMappingEffect({ mode }));
    }

    if (effects.length > 0) {
      this.composer.addPass(new EffectPass(camera, ...effects));
    }

    console.log(
      `[postfx] ✅ ${config.bloom ? 'bloom(' + config.bloomIntensity + ')' : ''}` +
      `${config.dof ? ' + dof' : ''}` +
      `${config.vignette ? ' + vignette' : ''}` +
      `${config.toneMapping !== 'none' ? ' + ' + config.toneMapping : ''}`,
    );
  }

  render(dt: number) {
    this.composer.render(dt);
  }

  updateDOF(turboMult: number) {
    this.dof?.update(turboMult);
  }

  setSize(width: number, height: number) {
    this.composer.setSize(width, height);
  }

  dispose() {
    this.composer.dispose();
  }
}