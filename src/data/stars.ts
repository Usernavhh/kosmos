/**
 * Yulduz katalogini binar fayldan o'qiydi.
 * Format: KOSMOS01 + uint32 (soni) + N × [f32 x, f32 y, f32 z, f32 mag, f32 color]
 */

export interface Star {
  x: number;
  y: number;
  z: number;
  mag: number;
  color: number;
}

const MAGIC = 'KOSMOS01';
const HEADER_SIZE = 12;
const STAR_SIZE = 20;

export async function loadStars(url = '/data/stars_test.bin'): Promise<Star[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Yulduz fayli yuklanmadi: ${res.status}`);

  const buffer = await res.arrayBuffer();
  const view = new DataView(buffer);

  // Sarlavhani tekshirish
  let magic = '';
  for (let i = 0; i < 8; i++) {
    magic += String.fromCharCode(view.getUint8(i));
  }
  if (magic !== MAGIC) {
    throw new Error(`Noto'g'ri fayl formati: ${magic}, kutilgan: ${MAGIC}`);
  }

  const count = view.getUint32(8, true); // little-endian
  console.log(`[stars] ${count} yulduz yuklandi, ${buffer.byteLength} bayt`);

  const stars: Star[] = new Array(count);
  const offset = HEADER_SIZE;

  for (let i = 0; i < count; i++) {
    const o = offset + i * STAR_SIZE;
    stars[i] = {
      x: view.getFloat32(o + 0, true),
      y: view.getFloat32(o + 4, true),
      z: view.getFloat32(o + 8, true),
      mag: view.getFloat32(o + 12, true),
      color: view.getFloat32(o + 16, true),
    };
  }

  return stars;
}