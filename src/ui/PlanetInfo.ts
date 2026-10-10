import type { PlanetMeta } from '../engine/scene/Planets';

export class PlanetInfo {
  private el: HTMLDivElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'planet-info';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);
  }

  show(meta: PlanetMeta) {
    const fmt = (n: number) => n.toLocaleString('en-US').replace(/,/g, ' ');
    this.el.innerHTML = `
      <h2>${meta.name}</h2>
      <div class="pi-en">${meta.nameEn}</div>
      <table>
        <tr><td>Radius</td><td>${fmt(meta.realRadiusKm)} km</td></tr>
        <tr><td>Masofa</td><td>${meta.distanceAU.toFixed(2)} AU</td></tr>
        <tr><td>Davr</td><td>${fmt(meta.periodDays)} kun</td></tr>
        <tr><td>Harorat</td><td>${meta.temperature}</td></tr>
      </table>
      <div class="pi-hint">Tab: keyingi · K: oldingi · H: uy</div>
    `;
    this.el.style.display = 'block';
  }

  hide() {
    this.el.style.display = 'none';
  }
}