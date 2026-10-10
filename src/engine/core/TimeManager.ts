export class TimeManager {
  private currentTime: Date;
  speed = 1;
  paused = false;

  constructor(now: Date = new Date()) {
    this.currentTime = new Date(now);
  }

  get now(): Date {
    return new Date(this.currentTime);
  }

  update(dt: number) {
    if (this.paused) return;
    const deltaMs = dt * 1000 * this.speed;
    this.currentTime = new Date(this.currentTime.getTime() + deltaMs);
  }

  reset() {
    this.currentTime = new Date();
  }

  setSpeed(mult: number) {
    this.speed = mult;
    this.paused = false;
  }

  togglePause() {
    this.paused = !this.paused;
  }

  format(): string {
    const d = this.currentTime;
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
      `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
    );
  }

  formatSpeed(): string {
    if (this.paused) return 'PAUSED';
    if (this.speed === 1) return '×1 (real)';
    if (this.speed < 60) return `×${this.speed.toFixed(0)}`;
    if (this.speed < 3600) return `×${(this.speed / 60).toFixed(1)} min/s`;
    if (this.speed < 86400) return `×${(this.speed / 3600).toFixed(1)} soat/s`;
    if (this.speed < 86400 * 30) return `×${(this.speed / 86400).toFixed(1)} kun/s`;
    if (this.speed < 86400 * 365) return `×${(this.speed / 86400 / 30).toFixed(1)} oy/s`;
    return `×${(this.speed / 86400 / 365).toFixed(1)} yil/s`;
  }
}