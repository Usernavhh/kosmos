export interface SatMeta {
  name: string;
  nameUz: string;
  altitudeKm: number;
  inclination: number;
  periodSec: number;
}

export class SatInfo {
  private el: HTMLDivElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'planet-info';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);
  }

  show(s: SatMeta) {
    const incl = ((s.inclination * 180) / Math.PI).toFixed(1);
    const periodMin = (s.periodSec / 60).toFixed(1);

    this.el.innerHTML = `
      <h2>${s.nameUz}</h2>
      <div class="pi-en">${s.name} · SUN'IY YO'LDOSH</div>
      <table>
        <tr><td>Balandlik</td><td>${s.altitudeKm} km</td></tr>
        <tr><td>Inklinatsiya</td><td>${incl}°</td></tr>
        <tr><td>Davr</td><td>${periodMin} daqiqa</td></tr>
      </table>
      <div class="pi-hint">ESC: yopish</div>
    `;
    this.el.style.display = 'block';
  }

  hide() {
    this.el.style.display = 'none';
  }
}