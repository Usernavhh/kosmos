import type { QualityManager } from './QualityManager';

export class DevPanel {
  private el: HTMLDivElement;
  private enabled: boolean;
  private acc = 0;

  constructor(private quality: QualityManager, params: URLSearchParams) {
    this.enabled = params.get('stats') === '1';
    this.el = document.createElement('div');
    this.el.className = 'dev-panel';
    this.el.textContent = '...';
    this.el.style.display = this.enabled ? 'block' : 'none';
    document.body.appendChild(this.el);
    console.log('[DevPanel] enabled:', this.enabled);
  }

  update(dt: number, distance: number, speed: number) {
    if (!this.enabled) return;
    this.acc += dt;
    if (this.acc < 0.25) return;
    this.acc = 0;

    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    const memText = mem ? `${(mem.usedJSHeapSize / 1048576).toFixed(0)} MB` : 'n/a';

    const d = Number.isFinite(distance) ? distance.toFixed(0) : '?';
    const s = Number.isFinite(speed) ? speed.toFixed(0) : '?';

    this.el.textContent =
      `FPS ${this.quality.fps.toFixed(0)} | ` +
      `preset ${this.quality.preset} | ` +
      `dist ${d} | ` +
      `speed ${s} u/s | ` +
      `RAM ${memText}`;
  }
}