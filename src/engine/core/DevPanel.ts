import type { QualityManager } from './QualityManager';
import type { TimeManager } from './TimeManager';
import type { Controls } from './Controls';
import { TURBO_LEVELS } from './Controls';

export class DevPanel {
  private el: HTMLDivElement;
  private enabled: boolean;
  private acc = 0;

  constructor(
    private quality: QualityManager,
    private time: TimeManager,
    private controls: Controls,
    params: URLSearchParams,
  ) {
    this.enabled = params.get('stats') === '1';
    this.el = document.createElement('div');
    this.el.className = 'dev-panel';
    this.el.textContent = '...';
    this.el.style.display = this.enabled ? 'block' : 'none';
    document.body.appendChild(this.el);
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

    const lvl = TURBO_LEVELS[this.controls.turboIndex];
    const turboText =
      this.controls.turboIndex > 0
        ? `TURBO ${lvl.name} (×${lvl.mult})`
        : 'TURBO off';
    const color = this.controls.turboIndex > 0 ? '#ffcc44' : '#5a7090';

    this.el.innerHTML =
      `FPS ${this.quality.fps.toFixed(0)} | ` +
      `dist ${d} | speed ${s} u/s | RAM ${memText}<br>` +
      `⏱ ${this.time.format()} | ${this.time.formatSpeed()}<br>` +
      `<span style="color:${color}">${turboText}</span>`;
  }
}