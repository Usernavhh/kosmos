export interface SearchItem {
  id: string;
  name: string;
  nameEn?: string;
  type: string;
  icon: string;
  action: () => void;
}

export class Search {
  private overlay: HTMLDivElement;
  private input: HTMLInputElement;
  private list: HTMLDivElement;
  private items: SearchItem[] = [];
  private open = false;
  private onClose?: () => void;

  constructor(private onOpenChange?: (open: boolean) => void) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'search-overlay';
    this.overlay.style.display = 'none';
    this.overlay.innerHTML = `
      <div class="search-panel">
        <div class="search-header">
          <span class="search-icon">🔍</span>
          <input class="search-input" placeholder="Qidirish: Yupiter, Sirius, Sagittarius A*..." />
          <button class="search-close">✕</button>
        </div>
        <div class="search-list"></div>
        <div class="search-hint">
          ESC — yopish · Enter — birinchi natija
        </div>
      </div>
    `;
    document.body.appendChild(this.overlay);

    this.input = this.overlay.querySelector('.search-input') as HTMLInputElement;
    this.list = this.overlay.querySelector('.search-list') as HTMLDivElement;

    (this.overlay.querySelector('.search-close') as HTMLButtonElement).addEventListener(
      'click',
      () => this.close(),
    );

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    this.input.addEventListener('input', () => this.render());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
      if (e.key === 'Enter') {
        const first = this.list.querySelector('.search-item');
        if (first) (first as HTMLElement).click();
      }
      e.stopPropagation();
    });

    window.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.code === 'Slash' && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.openSearch();
      }
      if (e.code === 'KeyF' && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.openSearch();
      }
      if (e.code === 'Escape' && this.open) {
        this.close();
      }
    });
  }

  setItems(items: SearchItem[]) {
    this.items = items;
  }

  isOpen(): boolean {
    return this.open;
  }

  openSearch() {
    this.open = true;
    this.overlay.style.display = 'flex';
    this.input.value = '';
    this.render();
    setTimeout(() => this.input.focus(), 50);
    this.onOpenChange?.(true);
  }

  close() {
    this.open = false;
    this.overlay.style.display = 'none';
    this.onOpenChange?.(false);
  }

  private render() {
    const q = this.input.value.trim().toLowerCase();
    this.list.innerHTML = '';

    let results = this.items;
    if (q) {
      results = this.items
        .map((item) => {
          const hay = `${item.name} ${item.nameEn ?? ''} ${item.type}`.toLowerCase();
          const name = item.name.toLowerCase();
          let score = 0;
          if (name === q) score = 100;
          else if (name.startsWith(q)) score = 80;
          else if (name.includes(q)) score = 60;
          else if (hay.includes(q)) score = 40;
          return { item, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.item);
    }

    if (results.length === 0) {
      this.list.innerHTML = '<div class="search-empty">Natija yo\'q</div>';
      return;
    }

    for (const item of results.slice(0, 30)) {
      const el = document.createElement('div');
      el.className = 'search-item';
      el.innerHTML = `
        <span class="search-item-icon">${item.icon}</span>
        <div class="search-item-info">
          <div class="search-item-name">${item.name}</div>
          <div class="search-item-meta">${item.type}${item.nameEn ? ' · ' + item.nameEn : ''}</div>
        </div>
      `;
      el.addEventListener('click', () => {
        this.close();
        item.action();
      });
      this.list.appendChild(el);
    }
  }
}