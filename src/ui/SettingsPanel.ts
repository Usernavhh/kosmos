import type { QualityManager, PresetConfig } from '../engine/core/QualityManager';
import { PRESETS } from '../engine/core/QualityManager';
import type { Preset } from '../types';

export interface SettingsCallbacks {
  onPresetChange: (preset: Preset) => void;
  onQualityChange?: (config: PresetConfig) => void;
}

export class SettingsPanel {
  private el: HTMLDivElement;
  private open = false;
  private quality: QualityManager;

  constructor(quality: QualityManager, private cb: SettingsCallbacks) {
    this.quality = quality;

    this.el = document.createElement('div');
    this.el.className = 'settings-overlay';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    window.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.code === 'Comma' && isInput === false && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.toggle();
      }
      if (e.code === 'Escape' && this.open) this.close();
    });
  }

  isOpen() { return this.open; }

  toggle() {
    if (this.open) this.close();
    else this.open_();
  }

  private open_() {
    this.open = true;
    this.el.style.display = 'flex';
    this.render();
  }

  close() {
    this.open = false;
    this.el.style.display = 'none';
  }

  private render() {
    const current = this.quality.preset;

    this.el.innerHTML = `
      <div class="settings-content">
        <button class="settings-close">✕</button>
        <h2>⚙️ Sozlamalar</h2>

        <div class="settings-section">
          <div class="settings-section-title">Grafika sifati</div>
          <div class="settings-presets"></div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Joriy preset ma'lumotlari</div>
          <div class="settings-info"></div>
        </div>

        <div class="settings-hint">
          , (vergul) — yopish · ESC — yopish
        </div>
      </div>
    `;

    const presetsContainer = this.el.querySelector('.settings-presets') as HTMLDivElement;

    (Object.keys(PRESETS) as Preset[]).forEach((presetKey) => {
      const cfg = PRESETS[presetKey];
      const btn = document.createElement('button');
      btn.className = 'settings-preset-btn';
      if (presetKey === current) btn.classList.add('active');
      btn.innerHTML = `
        <div class="settings-preset-name">${cfg.label}</div>
        <div class="settings-preset-info">
          ${cfg.textureSize}px · ${cfg.renderScale}× · ${cfg.ramBudgetMB} MB
        </div>
      `;
      btn.addEventListener('click', () => {
        this.cb.onPresetChange(presetKey);
        this.cb.onQualityChange?.(cfg);
        this.render();
      });
      presetsContainer.appendChild(btn);
    });

    // Info panel
    const infoContainer = this.el.querySelector('.settings-info') as HTMLDivElement;
    const cfg = PRESETS[current];
    infoContainer.innerHTML = `
      <div class="settings-info-row"><span>Preset:</span><b>${cfg.label}</b></div>
      <div class="settings-info-row"><span>Tekstura:</span><b>${cfg.textureSize}×${cfg.textureSize / 2}</b></div>
      <div class="settings-info-row"><span>Render scale:</span><b>${cfg.renderScale}×</b></div>
      <div class="settings-info-row"><span>RAM budget:</span><b>${cfg.ramBudgetMB} MB</b></div>
      <div class="settings-info-row"><span>Quyosh shader:</span><b>${cfg.sunShader}</b></div>
      <div class="settings-info-row"><span>Atmosfera:</span><b>${cfg.atmosphere ? '✅' : '❌'}</b></div>
      <div class="settings-info-row"><span>Bloom (postfx):</span><b>${cfg.postfx}</b></div>
      <div class="settings-info-row"><span>Sfera segmentlari:</span><b>${cfg.sphereSegments}</b></div>
    `;

    (this.el.querySelector('.settings-close') as HTMLButtonElement).addEventListener(
      'click',
      () => this.close(),
    );
  }
}