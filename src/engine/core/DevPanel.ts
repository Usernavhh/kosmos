import type { QualityManager } from './QualityManager';
import type { TimeManager } from './TimeManager';
import type { Controls } from './Controls';
import type { MemoryTracker } from './MemoryTracker';
import { TURBO_LEVELS } from './Controls';
import { formatDistance, formatSpeed } from '../../ui/format';
import { getGPUFeatures } from './GPUFeatures';

export class DevPanel {
  private el: HTMLDivElement;
  private enabled: boolean;
  private acc = 0;
  private showGPU = false;

  constructor(
    private quality: QualityManager,
    private time: TimeManager,
    private controls: Controls,
    private memory: MemoryTracker,
    params: URLSearchParams,
  ) {
    this.enabled = params.get('stats') === '1';
    this.showGPU = params.get('gpu') === '1';
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
    const turboText = this.controls.turboIndex > 0
      ? `TURBO ${lvl.name} (×${lvl.mult})`
      : 'TURBO off';

    const barWidth = 100;
    const filled = Math.round((pct / 100) * barWidth);
    const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);

    let html =
      `FPS ${this.quality.fps.toFixed(0)} | preset <b>${cfg.label}</b><br>` +
      `📍 ${distStr} | 🚀 ${speedStr}<br>` +
      `⏱ ${this.time.format()} | ${this.time.formatSpeed()}<br>` +
      `<span style="color:${turboText.includes('off') ? '#5a7090' : '#ffcc44'}">${turboText}</span><br>` +
      `<span style="color:${color}">RAM ${total.toFixed(0)} / ${cfg.ramBudgetMB} MB (${pct.toFixed(0)}%)</span><br>` +
      `<span style="color:${color};font-size:10px">${bar}</span>`;

    // Groq kalitlar holati
    const groqStatus = (window as unknown as {
      __kosmos_groq_status?: () => {
        total: number;
        available: number;
        cooldowns: { prefix: string; wait: number; uses: number }[];
      };
    }).__kosmos_groq_status?.();

    if (groqStatus) {
      const okColor = groqStatus.available > 0 ? '#88ffaa' : '#ff6644';
      html += `<br><span style="font-size:10px;color:#7a90b8">` +
        `Groq: <span style="color:${okColor}">${groqStatus.available}/${groqStatus.total} aktiv</span>` +
        `</span>`;
    }

    // GPU info
    const gpu = getGPUFeatures();
    if (gpu) {
      const wgpuColor = gpu.webgpu ? '#88ffaa' : '#ff8866';
      const glColor = gpu.webgl2 ? '#88ffaa' : '#ff8866';

      html += `<br><span style="font-size:10px;color:#7a90b8">` +
        `GPU: <span style="color:${wgpuColor}">WebGPU ${gpu.webgpu ? '✅' : '❌'}</span> · ` +
        `<span style="color:${glColor}">WebGL2 ✅</span>` +
        `</span>`;

      if (this.showGPU) {
        html += `<br><span style="font-size:9px;color:#5a7090;white-space:pre-line">` +
          `  ${gpu.webglRenderer.slice(0, 40)}\n` +
          (gpu.webgpu
            ? `  Adapter: ${gpu.webgpuAdapter}\n` +
              `  Features: ${gpu.webgpuFeatures.length}\n` +
              `  Max buf: ${((gpu.webgpuLimits?.maxBufferSize ?? 0) / 1048576).toFixed(0)} MB`
            : '  (WebGPU yo`q)') +
          `</span>`;
      }
    }

    this.el.innerHTML = html;
  }
}