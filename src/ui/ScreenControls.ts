export class ScreenControls {
  private fullscreenBtn: HTMLButtonElement;
  private eyeBtn: HTMLButtonElement;
  private hidden = false;

  constructor() {
    this.fullscreenBtn = document.createElement('button');
    this.fullscreenBtn.className = 'screen-btn screen-fullscreen';
    this.fullscreenBtn.innerHTML = '⛶';
    this.fullscreenBtn.title = "To'liq ekran (F11)";
    document.body.appendChild(this.fullscreenBtn);

    this.eyeBtn = document.createElement('button');
    this.eyeBtn.className = 'screen-btn screen-eye';
    this.eyeBtn.innerHTML = '👁';
    this.eyeBtn.title = "Panelni ko'rsatish/yashirish (H)";
    this.eyeBtn.style.display = 'none';
    document.body.appendChild(this.eyeBtn);

    this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    this.eyeBtn.addEventListener('click', () => this.togglePanels());

    document.addEventListener('fullscreenchange', () => this.onFullscreenChange());

    // H tugmasi — faqat fullscreen rejimda panellarni yashirish
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'KeyH') return;
      if (!document.fullscreenElement) return;
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      if (isInput) return;
      if (e.shiftKey) {
        // H + Shift = goHome (boshqa joyda ishlaydi)
        return;
      }
      // Oddiy H fullscreen'da — panelni yashirish
      // ... lekin bu H tugmasi "home" bilan to'qnashadi.
      // Shuning uchun boshqa tugma ishlatamiz.
    });

    // G + F tugmasi — panelni toggle
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'KeyV') return;
      if (!document.fullscreenElement) return;
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      if (isInput) return;
      e.preventDefault();
      this.togglePanels();
    });
  }

  private async toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn('[fullscreen] xato:', e);
    }
  }

  private onFullscreenChange() {
    const isFullscreen = !!document.fullscreenElement;
    this.eyeBtn.style.display = isFullscreen ? 'flex' : 'none';

    if (!isFullscreen) {
      // Fullscreen'dan chiqqanda — barcha panellar ko'rinadi
      this.hidden = false;
      document.body.classList.remove('ui-hidden');
      this.eyeBtn.innerHTML = '👁';
    } else {
      // Fullscreen'ga kirganda — ko'rinadi
      document.body.classList.remove('ui-hidden');
      this.eyeBtn.innerHTML = '👁';
      this.hidden = false;
    }
  }

  private togglePanels() {
    this.hidden = !this.hidden;
    if (this.hidden) {
      document.body.classList.add('ui-hidden');
      this.eyeBtn.innerHTML = '👁‍🗨';
    } else {
      document.body.classList.remove('ui-hidden');
      this.eyeBtn.innerHTML = '👁';
    }
  }
}