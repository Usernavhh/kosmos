import type { Preset } from '../../types';

export interface PresetConfig {
  name: Preset;
  label: string;
  renderScale: number;
  textureSize: number;         // 512 | 1024 | 2048 | 4096
  ramBudgetMB: number;         // RAM chegarasi
  sunShader: 'basic' | 'shader';
  sunGranulation: boolean;
  sunCorona: boolean;
  sunFlares: boolean;
  atmosphere: boolean;
  normalMaps: boolean;
  ringsParticles: boolean;
  postfx: 'off' | 'cinematic' | 'space' | 'extreme';
  starLimit: number; // ko‘rsatiladigan yulduzlar soni
  webgpu: boolean;
  starCount: 'min' | 'low' | 'mid' | 'high' | 'max';
  /** Sayyora segmentlari (sfera silliqligi) */
  sphereSegments: number;
  /** Orbit chizig'i segmentlari */
  orbitSegments: number;
}

export const PRESETS: Record<Preset, PresetConfig> = {
  potato: {
    name: 'potato', label: 'Potato',
    renderScale: 0.5, textureSize: 512, ramBudgetMB: 100,
    sunShader: 'basic', sunGranulation: false, sunCorona: false, sunFlares: false,
    atmosphere: false, normalMaps: false, ringsParticles: false,
    postfx: 'off', starLimit: 20000, webgpu: false, starCount: 'min',
    sphereSegments: 24, orbitSegments: 64,
  },
  low: {
    name: 'low', label: 'Low',
    renderScale: 0.65, textureSize: 1024, ramBudgetMB: 150,
    sunShader: 'basic', sunGranulation: false, sunCorona: true, sunFlares: false,
    atmosphere: false, normalMaps: false, ringsParticles: false,
    postfx: 'off', starLimit: 40000, webgpu: false, starCount: 'low',
    sphereSegments: 32, orbitSegments: 96,
  },
  medium: {
    name: 'medium', label: 'Medium',
    renderScale: 0.85, textureSize: 1024, ramBudgetMB: 250,
    sunShader: 'basic', sunGranulation: true, sunCorona: true, sunFlares: false,
    atmosphere: true, normalMaps: false, ringsParticles: false,
    postfx: 'off', starLimit: 60000, webgpu: false, starCount: 'mid',
    sphereSegments: 48, orbitSegments: 128,
  },
  high: {
    name: 'high', label: 'High',
    renderScale: 1.0, textureSize: 2048, ramBudgetMB: 400,
    sunShader: 'shader', sunGranulation: true, sunCorona: true, sunFlares: true,
    atmosphere: true, normalMaps: true, ringsParticles: true,
    postfx: 'cinematic', starLimit: 80000, webgpu: false, starCount: 'high',
    sphereSegments: 64, orbitSegments: 256,
  },
  ultra: {
    name: 'ultra', label: 'Ultra',
    renderScale: 1.0, textureSize: 2048, ramBudgetMB: 600,
    sunShader: 'shader', sunGranulation: true, sunCorona: true, sunFlares: true,
    atmosphere: true, normalMaps: true, ringsParticles: true,
    postfx: 'space', starLimit: 100000, webgpu: false, starCount: 'high',
    sphereSegments: 96, orbitSegments: 384,
  },
  'ultra-plus': {
    name: 'ultra-plus', label: 'Ultra+',
    renderScale: 1.25, textureSize: 4096, ramBudgetMB: 1024,
    sunShader: 'shader', sunGranulation: true, sunCorona: true, sunFlares: true,
    atmosphere: true, normalMaps: true, ringsParticles: true,
    postfx: 'space', starLimit: 119000, webgpu: false, starCount: 'max',
    sphereSegments: 128, orbitSegments: 512,
  },
  extreme: {
    name: 'extreme', label: 'EXTREME',
    renderScale: 1.5, textureSize: 4096, ramBudgetMB: 2048,
    sunShader: 'shader', sunGranulation: true, sunCorona: true, sunFlares: true,
    atmosphere: true, normalMaps: true, ringsParticles: true,
    postfx: 'extreme', starLimit: 200000, webgpu: true, starCount: 'max',
    sphereSegments: 192, orbitSegments: 768,
  },
};

export class QualityManager {
  preset: Preset;
  renderScale: number;
  fps = 0;

  private frames = 0;
  private acc = 0;
  private autoAdjust: boolean;

  constructor(params: URLSearchParams) {
    const q = params.get('quality') as Preset | null;
    this.preset = q && PRESETS[q] ? q : 'potato';

    const s = parseFloat(params.get('scale') ?? '');
    const cfg = PRESETS[this.preset];
    this.renderScale = !isNaN(s)
      ? Math.min(2, Math.max(0.4, s))
      : cfg.renderScale;

    this.autoAdjust = !params.has('scale');
  }

  getConfig(): PresetConfig {
    return PRESETS[this.preset];
  }

  update(dt: number) {
    this.frames++;
    this.acc += dt;
    if (this.acc < 0.5) return;
    this.fps = this.frames / this.acc;
    this.frames = 0;
    this.acc = 0;
    if (this.autoAdjust) this.autoAdjustScale();
  }

  private autoAdjustScale() {
    if (this.preset === 'extreme') return;
    if (this.fps < 25 && this.renderScale > 0.5) {
      this.renderScale = Math.max(0.5, this.renderScale - 0.1);
    } else if (this.fps > 55 && this.renderScale < PRESETS[this.preset].renderScale) {
      this.renderScale = Math.min(PRESETS[this.preset].renderScale, this.renderScale + 0.05);
    }
  }
}