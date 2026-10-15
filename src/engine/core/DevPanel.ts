import type { QualityManager } from './QualityManager';
import type { TimeManager } from './TimeManager';
import type { Controls } from './Controls';
import type { MemoryTracker } from './MemoryTracker';
import { TURBO_LEVELS } from './Controls';
import { formatDistance, formatSpeed } from '../../ui/format';

export class DevPanel {
  private el: HTMLDivElement;
  private enabled: boolean;
  private acc = 0;

  constructor(
    private quality: QualityManager,
    private time: TimeManager,
    private controls: Controls,
    private memory: MemoryTracker,
    params: URLSearchParams,
  ) {
    this.enabled = params.get('stats') === '1';
    this.el = document.createElement('div');
    this.el.className = 'dev-panel';
    this.el.style.display = this.enabled ? 'block' : 'none';
    document.body.appendChild(this.el);
  }

  update(dt: number, distance: number, baseSpeed: number) {
    if (!this.enabled) return;
    this.acc += dt;
    if (this.acc < 0.2) return;
    this.acc = 0;

    const cfg = this.quality.getConfig();
    const jsHeap = this.memory.getJSHeapMB();
    const gpuMem = this.memory.getTotalMB();
    const total = jsHeap + gpuMem;
    const pct = this.memory.getUsagePercent(cfg.ramBudgetMB);
    const level = this.memory.getLevel(cfg.ramBudgetMB);

    const color = level === 'ok' ? '#88ffaa' : level === 'warn' ? '#ffcc44' : '#ff6644';

    const turboMult = this.controls.getTurboMultiplier();
    const realSpeed = baseSpeed * turboMult;
    const distStr = formatDistance(distance);
    const speedStr = formatSpeed(realSpeed);

    const lvl = TURBO_LEVELS[this.controls.turboIndex];
    const turboBadge =
      this.controls.turboIndex > 0
        ? `<span class="dp-turbo">🚀 ×${lvl.mult}</span>`
        : '';

    this.el.innerHTML = `
      <div class="dp-row">
        <span class="dp-fps">${this.quality.fps.toFixed(0)} FPS</span>
        <span class="dp-sep">·</span>
        <span class="dp-preset">${cfg.label}</span>
        <span class="dp-sep">·</span>
        <span class="dp-ram" style="color:${color}">RAM ${pct.toFixed(0)}%</span>
      </div>
      <div class="dp-row">
        <span class="dp-pos">📍 ${distStr}</span>
        <span class="dp-sep">·</span>
        <span class="dp-speed">🚀 ${speedStr}</span>
        ${turboBadge}
      </div>
    `;
  }
}