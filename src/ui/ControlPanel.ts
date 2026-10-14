export interface ControlPanelCallbacks {
  onAudioToggle: () => void;
  onAIToggle: () => void;
  onTourStart: (index: number) => void;
  onHelpToggle: () => void;
}

export class ControlPanel {
  private el: HTMLDivElement;
  private audioBtn!: HTMLButtonElement;
  private aiBtn!: HTMLButtonElement;

  constructor(private cb: ControlPanelCallbacks) {
    this.el = document.createElement('div');
    this.el.className = 'control-panel';
    this.el.innerHTML = `
      <button class="cp-btn cp-audio" title="Audio (M)">🔇</button>
      <button class="cp-btn cp-ai" title="AI gid (G)">🤖</button>
      <div class="cp-divider"></div>
      <button class="cp-btn cp-tour1" title="Tur: Quyoshdan Neptungacha (7)">☀</button>
      <button class="cp-btn cp-tour2" title="Tur: Qora tuynukka (8)">⚫</button>
      <button class="cp-btn cp-tour3" title="Ulug'bek osmoni (9)">⭐</button>
      <div class="cp-divider"></div>
      <button class="cp-btn cp-help" title="Yordam (?)">?</button>
    `;
    document.body.appendChild(this.el);

    this.audioBtn = this.el.querySelector('.cp-audio') as HTMLButtonElement;
    this.aiBtn = this.el.querySelector('.cp-ai') as HTMLButtonElement;

    this.audioBtn.addEventListener('click', () => this.cb.onAudioToggle());
    this.aiBtn.addEventListener('click', () => this.cb.onAIToggle());
    (this.el.querySelector('.cp-tour1') as HTMLButtonElement).addEventListener(
      'click',
      () => this.cb.onTourStart(0),
    );
    (this.el.querySelector('.cp-tour2') as HTMLButtonElement).addEventListener(
      'click',
      () => this.cb.onTourStart(1),
    );
    (this.el.querySelector('.cp-tour3') as HTMLButtonElement).addEventListener(
      'click',
      () => this.cb.onTourStart(2),
    );
    (this.el.querySelector('.cp-help') as HTMLButtonElement).addEventListener(
      'click',
      () => this.cb.onHelpToggle(),
    );
  }

  setAudioState(on: boolean) {
    this.audioBtn.textContent = on ? '🔊' : '🔇';
    this.audioBtn.classList.toggle('cp-active', on);
  }

  setAIActive(on: boolean) {
    this.aiBtn.classList.toggle('cp-active', on);
  }
}