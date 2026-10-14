export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private started = false;
  private enabled = false;
  private pulseTimer: number | null = null;

  /** Birinchi foydalanuvchi click'i kerak (brauzer qoidasi). */
  async start() {
    if (this.started) {
      if (this.ctx?.state === 'suspended') await this.ctx.resume();
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    // BOSHLANG'ICH: 0 — audio eshitilmaydi
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);

    this.droneOsc = this.ctx.createOscillator();
    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.value = 55;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.4;

    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);
    this.droneOsc.start();

    this.pulseDrone();

    this.started = true;
    this.enabled = false;
  }

  private pulseDrone() {
    if (!this.ctx || !this.droneGain) return;
    const t = this.ctx.currentTime;
    this.droneGain.gain.cancelScheduledValues(t);
    this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, t);
    this.droneGain.gain.linearRampToValueAtTime(
      0.15 + Math.random() * 0.5,
      t + 3 + Math.random() * 4,
    );
    this.pulseTimer = window.setTimeout(
      () => this.pulseDrone(),
      4000 + Math.random() * 4000,
    );
  }

  setProximity(intensity: number) {
    if (!this.ctx || !this.droneOsc || !this.enabled) return;
    const freq = 55 + intensity * 55;
    this.droneOsc.frequency.linearRampToValueAtTime(
      freq,
      this.ctx.currentTime + 0.5,
    );
  }

  /** ON/OFF qilish. Birinchi marta start() chaqirilishi kerak. */
  async setEnabled(on: boolean) {
    await this.start();
    this.enabled = on;
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.linearRampToValueAtTime(
      on ? 0.15 : 0,
      this.ctx.currentTime + 0.3,
    );
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  dispose() {
    if (this.pulseTimer) window.clearTimeout(this.pulseTimer);
    this.droneOsc?.stop();
    this.ctx?.close();
    this.started = false;
  }
}