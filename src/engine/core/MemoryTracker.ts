/**
 * RAM budget hisoblagichi.
 * GPU + CPU xotirani taxminiy hisoblaydi.
 */

export interface MemoryBudget {
  label: string;
  limitMB: number;
}

export const RAM_BUDGETS: Record<string, MemoryBudget> = {
  potato: { label: '100 MB', limitMB: 100 },
  low: { label: '150 MB', limitMB: 150 },
  medium: { label: '250 MB', limitMB: 250 },
  high: { label: '400 MB', limitMB: 400 },
  ultra: { label: '600 MB', limitMB: 600 },
  'ultra-plus': { label: '1 GB', limitMB: 1024 },
  extreme: { label: '2 GB', limitMB: 2048 },
};

export class MemoryTracker {
  private textureBytes = 0;
  private geometryBytes = 0;
  private otherBytes = 0;

  /** Textura xotirasini qo'shish */
  addTexture(width: number, height: number, hasMipmaps = true): void {
    const base = width * height * 4; // RGBA
    const total = hasMipmaps ? base * 1.33 : base;
    this.textureBytes += total;
  }

  /** Geometry xotirasi */
  addGeometry(vertexCount: number, indexCount = 0): void {
    // Position + Normal + UV + Color ≈ 32 bayt / vertex
    this.geometryBytes += vertexCount * 32 + indexCount * 4;
  }

  /** Boshqa xotira (bufer, uniform va h.k.) */
  addOther(bytes: number): void {
    this.otherBytes += bytes;
  }

  /** JS heap (performance.memory API) */
  getJSHeapMB(): number {
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    if (!mem) return 0;
    return mem.usedJSHeapSize / 1048576;
  }

  /** Total GPU + CPU taxminiy */
  getTotalMB(): number {
    return (this.textureBytes + this.geometryBytes + this.otherBytes) / 1048576;
  }

  getTextureMB(): number {
    return this.textureBytes / 1048576;
  }

  getGeometryMB(): number {
    return this.geometryBytes / 1048576;
  }

  /** Foydalanish foizi */
  getUsagePercent(limitMB: number): number {
    return Math.min(100, (this.getTotalMB() / limitMB) * 100);
  }

  /** Ogohlantirish darajasi */
  getLevel(limitMB: number): 'ok' | 'warn' | 'critical' {
    const pct = this.getUsagePercent(limitMB);
    if (pct < 70) return 'ok';
    if (pct < 90) return 'warn';
    return 'critical';
  }

  reset() {
    this.textureBytes = 0;
    this.geometryBytes = 0;
    this.otherBytes = 0;
  }
}