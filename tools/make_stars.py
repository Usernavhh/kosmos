export interface Star {
  x: number;
  y: number;
  z: number;
  mag: number;
  color: number;
  dist: number; // parsek
}

const MAGIC = 'KOSMOS01';
const HEADER_SIZE = 12;
const STAR_SIZE = 24; // 6 × float32

export async function loadStars(url = '/data/stars.bin'): Promise<Star[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Yulduz fayli yuklanmadi: ${res.status}`);

  const buffer = await res.arrayBuffer();
  const view = new DataView(buffer);

  let magic = '';
  for (let i = 0; i < 8; i++) {
    magic += String.fromCharCode(view.getUint8(i));
  }
  if (magic !== MAGIC) {
    throw new Error(`Noto'g'ri format: ${magic}, kutilgan: ${MAGIC}`);
  }

  const count = view.getUint32(8, true);
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
      dist: view.getFloat32(o + 20, true),
    };
  }

  return stars;
}