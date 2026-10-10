import type { NamedStar } from '../data/starNames';

export class StarInfo {
  private el: HTMLDivElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'planet-info';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);
  }

  show(s: NamedStar) {
    const ly = s.dist * 3.26156; // parsek → yorug'lik yili
    const fmt = (n: number) => n.toLocaleString('en-US').replace(/,/g, ' ');

    this.el.innerHTML = `
      <h2>${s.nameUz}</h2>
      <div class="pi-en">${s.name}${s.con ? ' · ' + s.con : ''}</div>
      <table>
        <tr><td>Masofa</td><td>${ly.toFixed(1)} yorug'lik yili</td></tr>
        <tr><td>Parsek</td><td>${s.dist.toFixed(2)} pc</td></tr>
        <tr><td>Yorqinlik</td><td>${s.mag.toFixed(2)} mag</td></tr>
      </table>
      <div class="pi-hint">ESC: yopish</div>
    `;
    this.el.style.display = 'block';
  }

  hide() {
    this.el.style.display = 'none';
  }
}