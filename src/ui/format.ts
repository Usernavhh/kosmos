const C_KM_PER_S = 299792.458;
const AU_KM = 149_597_870.7;
const AU_PER_SCENE = 5000;
const KM_PER_SCENE = AU_KM / AU_PER_SCENE;
const SCENE_PER_LY = 153_374; // 500,000 / 3.26
const SCENE_PER_PC = 500_000;

/**
 * Masofani formatlash — avtomatik birlik tanlash.
 * Yaxlitlash aniq — bir xil son takrorlanmaydi.
 */
export function formatDistance(sceneUnits: number): string {
  const abs = Math.abs(sceneUnits);

  // Yaqin: m, km
  if (abs < 0.001) {
    return `${(sceneUnits * KM_PER_SCENE * 1000).toFixed(0)} m`;
  }
  if (abs < 0.01) {
    return `${(sceneUnits * KM_PER_SCENE).toFixed(1)} km`;
  }
  // ~10 km - 100,000 km
  if (abs < 200) {
    return `${(sceneUnits * KM_PER_SCENE).toFixed(0)} km`;
  }
  // Million km (0.01 - 0.1 AU)
  if (abs < 500) {
    return `${((sceneUnits * KM_PER_SCENE) / 1e6).toFixed(1)} mln km`;
  }
  // AU (0.1 - 1000 AU)
  if (abs < 5_000_000) {
    const au = sceneUnits / AU_PER_SCENE;
    if (Math.abs(au) < 10) return `${au.toFixed(2)} AU`;
    if (Math.abs(au) < 100) return `${au.toFixed(1)} AU`;
    return `${au.toFixed(0)} AU`;
  }
  // ly (< 100,000 ly)
  const ly = sceneUnits / SCENE_PER_LY;
  if (Math.abs(ly) < 10) return `${ly.toFixed(3)} ly`;
  if (Math.abs(ly) < 1000) return `${ly.toFixed(1)} ly`;
  if (Math.abs(ly) < 100_000) return `${(ly / 1000).toFixed(2)}k ly`;

  // pc
  const pc = sceneUnits / SCENE_PER_PC;
  if (Math.abs(pc) < 10) return `${pc.toFixed(2)} pc`;
  if (Math.abs(pc) < 1000) return `${pc.toFixed(1)} pc`;
  if (Math.abs(pc) < 1e6) return `${(pc / 1000).toFixed(2)} kpc`;
  if (Math.abs(pc) < 1e9) return `${(pc / 1e6).toFixed(2)} Mpc`;
  return `${(pc / 1e9).toFixed(2)} Gpc`;
}

/**
 * Tezlikni formatlash — km/s → %c → x c → warp.
 */
export function formatSpeed(sceneUnitsPerSec: number): string {
  const kms = sceneUnitsPerSec * KM_PER_SCENE;
  const cFrac = kms / C_KM_PER_S;
  const abs = Math.abs(cFrac);

  // m/s
  if (abs < 1e-5) return `${(kms * 1000).toFixed(1)} m/s`;
  // km/s
  if (abs < 1e-3) return `${kms.toFixed(2)} km/s`;
  // % c
  if (abs < 0.01) return `${(cFrac * 100).toFixed(2)}% c`;
  if (abs < 1) return `${(cFrac * 100).toFixed(1)}% c`;
  // x c
  if (abs < 10) return `${cFrac.toFixed(2)}× c`;
  if (abs < 1000) return `${cFrac.toFixed(0)}× c`;
  // warp
  if (abs < 1e6) return `${(cFrac / 1000).toFixed(1)}k× c`;
  if (abs < 1e9) return `${(cFrac / 1e6).toFixed(1)}M× c`;
  return `${(cFrac / 1e9).toFixed(1)}B× c`;
}