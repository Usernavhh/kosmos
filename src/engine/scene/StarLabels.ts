import * as THREE from 'three';
import type { NamedStar, Constellation } from '../../data/starNames';

const PARSEC_SCALE = 500_000;

export interface StarLabelsHandle {
  group: THREE.Group;
  /** Ekran koordinatalariga nisbatan eng yaqin yulduz */
  hitTest(
    camera: THREE.Camera,
    clickX: number,
    clickY: number,
    maxPixels: number,
  ): NamedStar | null;
}

export function createStarLabels(
  stars: NamedStar[],
  constellations: Constellation[],
): StarLabelsHandle {
  const group = new THREE.Group();

  // ========== Nom bo'yicha xarita ==========
  const byName = new Map<string, NamedStar>();
  for (const s of stars) {
    if (s.name) byName.set(s.name, s);
  }

  // ========== Nom yorliqlari (sprites) ==========
  // Faqat mag < 1.5 (eng yorqin) — ekran to'lmasin
  const LABEL_MAG_LIMIT = 1.5;

  for (const s of stars) {
    if (s.mag > LABEL_MAG_LIMIT) continue;

    const r = s.dist * PARSEC_SCALE;
    const pos = new THREE.Vector3(s.x * r, s.y * r, s.z * r);

    const sprite = makeLabelSprite(s.nameUz);
    sprite.position.copy(pos);
    group.add(sprite);
  }

  // ========== Turkum chiziqlari ==========
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x4a80c0,
    transparent: true,
    opacity: 0.55,
  });

  for (const c of constellations) {
    const points: THREE.Vector3[] = [];

    for (const [a, b] of c.lines) {
      const sa = byName.get(a);
      const sb = byName.get(b);
      if (!sa || !sb) continue;

      const ra = sa.dist * PARSEC_SCALE;
      const rb = sb.dist * PARSEC_SCALE;

      points.push(
        new THREE.Vector3(sa.x * ra, sa.y * ra, sa.z * ra),
        new THREE.Vector3(sb.x * rb, sb.y * rb, sb.z * rb),
      );
    }

    if (points.length > 0) {
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.LineSegments(geom, lineMat);
      group.add(line);
    }
  }

  // ========== Hit test (ekranga proyeksiya) ==========
  const projected = new THREE.Vector3();

  function hitTest(
    camera: THREE.Camera,
    clickX: number,
    clickY: number,
    maxPixels: number,
  ): NamedStar | null {
    let best: NamedStar | null = null;
    let bestDist = maxPixels;

    for (const s of stars) {
      const r = s.dist * PARSEC_SCALE;
      projected.set(s.x * r, s.y * r, s.z * r);
      projected.project(camera);

      // Ortda qolganlarni o'tkazib yuborish
      if (projected.z < -1 || projected.z > 1) continue;

      const sx = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-projected.y * 0.5 + 0.5) * window.innerHeight;

      const dx = sx - clickX;
      const dy = sy - clickY;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }

    return best;
  }

  return { group, hitTest };
}

/**
 * Yulduz nomi uchun sprite (Canvas → Texture).
 */
function makeLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const fontSize = 48;
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;

  const metrics = ctx.measureText(text);
  const padding = 16;
  const width = Math.ceil(metrics.width) + padding * 2;
  const height = fontSize + padding * 2;

  canvas.width = width;
  canvas.height = height;

  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(200, 220, 255, 0.9)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(mat);
  // Sprite o'lchami — yulduzga yaqin ekranda ko'rinadigan o'lcham
  const aspect = width / height;
  sprite.scale.set(aspect * 30, 30, 1);

  return sprite;
}