export interface ControlPanelCallbacks {
  onAudioToggle: () => void;
  onAIToggle: () => void;
  onTourStart: (index: number) => void;
  onHelpToggle: () => void;
  onSearchOpen: () => void;
  onGamesOpen: () => void;
  onPhotoToggle: () => void;
}

export class ControlPanel {
  private el: HTMLDivElement;
  private audioBtn!: HTMLButtonElement;
  private aiBtn!: HTMLButtonElement;

  constructor(private cb: ControlPanelCallbacks) {
    this.el = document.createElement('div');
    this.el.className = 'control-panel';
    this.el.innerHTML = `
      <button class="cp-btn cp-search" title="Qidirish (F)">🔍</button>
      <button class="cp-btn cp-games" title="O'yinlar (Q)">🎮</button>
      <button class="cp-btn cp-photo" title="Foto rejim (P)">📸</button>
      <div class="cp-divider"></div>
      <button class="cp-btn cp-audio" title="Audio (M)">🔇</button>
      <button class="cp-btn cp-ai" title="AI gid (G)">🤖</button>
      <div class="cp-divider"></div>
      <button class="cp-btn cp-tour1" title="Tur 1 (7)">☀</button>
      <button class="cp-btn cp-tour2" title="Tur 2 (8)">⚫</button>
      <button class="cp-btn cp-tour3" title="Ulug'bek (9)">⭐</button>
      <div class="cp-divider"></div>
      <button class="cp-btn cp-eclipse" title="Tutilish (0)">🌑</button>
      <button class="cp-btn cp-help" title="Yordam">?</button>
    `;
    document.body.appendChild(this.el);

    this.audioBtn = this.el.querySelector('.cp-audio') as HTMLButtonElement;
    this.aiBtn = this.el.querySelector('.cp-ai') as HTMLButtonElement;

    const bind = (sel: string, fn: () => void) => {
      (this.el.querySelector(sel) as HTMLButtonElement).addEventListener('click', fn);
    };

    bind('.cp-search', () => this.cb.onSearchOpen());
    bind('.cp-games', () => this.cb.onGamesOpen());
    bind('.cp-photo', () => this.cb.onPhotoToggle());
    bind('.cp-audio', () => this.cb.onAudioToggle());
    bind('.cp-ai', () => this.cb.onAIToggle());
    bind('.cp-tour1', () => this.cb.onTourStart(0));
    bind('.cp-tour2', () => this.cb.onTourStart(1));
    bind('.cp-tour3', () => this.cb.onTourStart(2));
    bind('.cp-help', () => this.cb.onHelpToggle());
    bind('.cp-eclipse', () => {
      window.dispatchEvent(new CustomEvent('kosmos-eclipse'));
    });
  }

  setAudioState(on: boolean) {
    this.audioBtn.textContent = on ? '🔊' : '🔇';
    this.audioBtn.classList.toggle('cp-active', on);
  }

  setAIActive(on: boolean) {
    this.aiBtn.classList.toggle('cp-active', on);
  }
}