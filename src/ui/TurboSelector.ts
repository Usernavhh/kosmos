import { TURBO_LEVELS } from '../engine/core/Controls';

export class TurboSelector {
  private el: HTMLDivElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'turbo-selector';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);
  }

  private render(selected: number) {
    this.el.innerHTML = `
      <div class="ts-title">TEZLIK REJIMI</div>
      <div class="ts-row">
        ${TURBO_LEVELS.map(
          (l, i) => `
          <div class="ts-item ${i === selected ? 'ts-active' : ''}">
            <div class="ts-name">${l.name}</div>
            <div class="ts-mult">×${l.mult}</div>
          </div>
        `,
        ).join('')}
      </div>
      <div class="ts-hint">← →: tanlash · Z qo'yib yuboring: qabul</div>
    `;
  }

  show(selected: number) {
    this.render(selected);
    this.el.style.display = 'block';
  }

  update(selected: number) {
    this.render(selected);
  }

  hide() {
    this.el.style.display = 'none';
  }
}