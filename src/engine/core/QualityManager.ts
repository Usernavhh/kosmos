import type { Preset } from '../../types';

export class QualityManager {
  preset: Preset;
  renderScale: number;
  fps = 0;

  private frames = 0;
  private acc = 0;
  private autoAdjust: boolean;

  constructor(params: URLSearchParams) {
    const q = params.get('quality') as Preset | null;
    this.preset = q ?? 'potato';

    const s = parseFloat(params.get('scale') ?? '');
    this.renderScale = !isNaN(s)
      ? Math.min(1, Math.max(0.4, s))
      : this.defaultScaleFor(this.preset);

    this.autoAdjust = !params.has('scale');
  }

  private defaultScaleFor(p: Preset): number {
    switch (p) {
      case 'potato': return 0.6;
      case 'low':    return 0.75;
      case 'medium': return 1.0;
      case 'high':   return 1.0;
      case 'ultra':  return 1.0;
    }
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
    if (this.fps < 25 && this.renderScale > 0.5) {
      this.renderScale = Math.max(0.5, this.renderScale - 0.1);
    } else if (this.fps > 55 && this.renderScale < 1) {
      this.renderScale = Math.min(1, this.renderScale + 0.05);
    }
  }
}