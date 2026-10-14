export interface PhotoModeCallbacks {
  onEnter?: () => void;
  onExit?: () => void;
  onFilterChange?: (filter: string) => void;
}

export const PHOTO_FILTERS = [
  { name: 'Yoq', css: 'none' },
  { name: 'Kino', css: 'contrast(1.15) saturate(1.1) brightness(1.05)' },
  { name: 'Kosmik', css: 'contrast(1.25) saturate(1.3) hue-rotate(5deg)' },
  { name: 'Issiq', css: 'contrast(1.1) saturate(1.15) sepia(0.15) brightness(1.05)' },
  { name: 'Sovuq', css: 'contrast(1.1) saturate(0.9) hue-rotate(-15deg)' },
  { name: 'Noir', css: 'grayscale(1) contrast(1.3)' },
  { name: 'Vintage', css: 'sepia(0.4) contrast(1.1) brightness(1.05)' },
];

export class PhotoMode {
  private active = false;
  private currentFilter = 0;
  private canvas: HTMLCanvasElement;
  private callbacks: PhotoModeCallbacks;
  private filmGrainEl: HTMLDivElement | null = null;
  private frameEl: HTMLDivElement | null = null;
  private watermarkEl: HTMLDivElement | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: PhotoModeCallbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;
  }

  isActive(): boolean {
    return this.active;
  }

  enter() {
    if (this.active) return;
    this.active = true;

    // Barcha UI yashirish
    document.body.classList.add('photo-mode');

    // Film grain
    this.filmGrainEl = document.createElement('div');
    this.filmGrainEl.className = 'photo-grain';
    document.body.appendChild(this.filmGrainEl);

    // Kadr chegarasi
    this.frameEl = document.createElement('div');
    this.frameEl.className = 'photo-frame';
    document.body.appendChild(this.frameEl);

    // Suv belgisi
    this.watermarkEl = document.createElement('div');
    this.watermarkEl.className = 'photo-watermark';
    this.watermarkEl.textContent = 'KOSMOS';
    document.body.appendChild(this.watermarkEl);

    this.applyFilter();
    this.callbacks.onEnter?.();
  }

  exit() {
    if (!this.active) return;
    this.active = false;

    document.body.classList.remove('photo-mode');
    this.filmGrainEl?.remove();
    this.frameEl?.remove();
    this.watermarkEl?.remove();
    this.filmGrainEl = null;
    this.frameEl = null;
    this.watermarkEl = null;

    this.canvas.style.filter = 'none';
    this.callbacks.onExit?.();
  }

  toggle() {
    if (this.active) this.exit();
    else this.enter();
  }

  nextFilter() {
    this.currentFilter = (this.currentFilter + 1) % PHOTO_FILTERS.length;
    this.applyFilter();
  }

  private applyFilter() {
    const f = PHOTO_FILTERS[this.currentFilter];
    this.canvas.style.filter = f.css;
    this.callbacks.onFilterChange?.(f.name);
    console.log(`[photo] Filter: ${f.name}`);
  }

  /**
   * Skrinshot — blob qaytaradi va yuklab oladi.
   */
  async capture(): Promise<void> {
    // WebGL kontekstida preserveDrawingBuffer kerak, yoki right after render
    this.canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kosmos_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        // Toast
        this.showToast('📸 Saqlandi!');
      },
      'image/png',
      0.95,
    );
  }

  private showToast(text: string) {
    const t = document.createElement('div');
    t.className = 'photo-toast';
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1500);
  }
}