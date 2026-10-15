import * as THREE from 'three';

/**
 * NASA GIBS tile loader.
 * Endpoint: https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/
 * Hozircha ishlatilmaydi — kelajakdagi dive-in uchun.
 */

const GIBS_BASE = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
const LAYER = 'BlueMarble_ShadedRelief_Bathymetry';
const TILE_MATRIX = 'GoogleMapsCompatible_Level8';

const tileCache = new Map<string, THREE.Texture>();
const pendingLoads = new Map<string, Promise<THREE.Texture | null>>();

const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';

export async function loadTile(
  z: number,
  x: number,
  y: number,
): Promise<THREE.Texture | null> {
  if (z < 0 || z > 8) return null;
  const max = Math.pow(2, z);
  if (x < 0 || x >= max || y < 0 || y >= max) return null;

  const key = `${z}/${x}/${y}`;
  if (tileCache.has(key)) return tileCache.get(key)!;
  if (pendingLoads.has(key)) return pendingLoads.get(key)!;

  const url = `${GIBS_BASE}/${LAYER}/default/${TILE_MATRIX}/${z}/${y}/${x}.jpeg`;

  const promise = new Promise<THREE.Texture | null>((resolve) => {
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.anisotropy = 4;
        tileCache.set(key, tex);
        pendingLoads.delete(key);
        resolve(tex);
      },
      undefined,
      () => {
        pendingLoads.delete(key);
        resolve(null);
      },
    );
  });

  pendingLoads.set(key, promise);
  return promise;
}

export function latLonToTile(
  lat: number,
  lon: number,
  zoom: number,
): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const latRad = (lat * Math.PI) / 180;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return {
    x: Math.max(0, Math.min(n - 1, x)),
    y: Math.max(0, Math.min(n - 1, y)),
  };
}

export function getTileCacheSize(): number {
  return tileCache.size;
}

export function clearTileCache(): void {
  for (const t of tileCache.values()) t.dispose();
  tileCache.clear();
}