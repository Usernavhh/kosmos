import { DepthOfFieldEffect, BlendFunction } from 'postprocessing';
import type * as THREE from 'three';

export class DOFEffect {
  private effect: DepthOfFieldEffect;

  constructor(camera: THREE.PerspectiveCamera) {
    this.effect = new DepthOfFieldEffect(camera, {
      // focusDistance — camera.near va camera.far orasida
      // 0.0001 = juda yaqin (1e10 birlik)
      // 0.01 = uzoq (1e12 birlik)
      focusDistance: 0.0005,
      focalLength: 0.03,
      bokehScale: 3.0,
      height: 480,
      blendFunction: BlendFunction.NORMAL,
    });

    console.log('[dof] DOF yaratildi (focus=0.0005)');
  }

  getEffect(): DepthOfFieldEffect {
    return this.effect;
  }

  update(turboMult: number) {
    const t = Math.min(1, Math.log10(Math.max(turboMult, 1)) / 4);

    // Bokeh — turbo bilan kuchayadi
    this.effect.bokehScale = 3.0 + t * 8.0;

    // Fokus juda yaqin (kosmik ko'rinish)
    const mat = this.effect as unknown as {
      circleOfConfusionMaterial: { focusDistance: number };
    };
    mat.circleOfConfusionMaterial.focusDistance = 0.0003 + t * 0.001;
  }

  setEnabled(on: boolean) {
    this.effect.blendMode.opacity.value = on ? 1 : 0;
  }

  dispose() {
    this.effect.dispose();
  }
}