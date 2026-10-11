import type { Tour } from '../data/tours';

export class TourUI {
  private el: HTMLDivElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'tour-overlay';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);
  }

  show(tour: Tour) {
    this.el.innerHTML = `
      <div class="tour-title">${tour.titleUz}</div>
      <div class="tour-hint">ESC: to'xtatish · →: keyingi</div>
    `;
    this.el.style.display = 'block';
  }

  setText(text: string, title?: string) {
    const titleEl = this.el.querySelector('.tour-title');
    const textEl = this.el.querySelector('.tour-text');
    if (titleEl && title) titleEl.textContent = title;
    if (!textEl) {
      const div = document.createElement('div');
      div.className = 'tour-text';
      div.textContent = text;
      this.el.insertBefore(div, this.el.querySelector('.tour-hint'));
    } else {
      textEl.textContent = text;
    }
  }

  hide() {
    this.el.style.display = 'none';
  }
}