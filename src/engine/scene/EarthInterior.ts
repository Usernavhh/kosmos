import * as THREE from 'three';

/**
 * Yer ichki qatlamlari — sirtni kesib o'tganda ko'rinadi.
 * Real qalinliklar:
 *   Po'st: 0-35 km (kontinental), 0-7 km (okean)
 *   Mantiya: 35-2890 km
 *   Tashqi yadro: 2890-5150 km
 *   Ichki yadro: 5150-6371 km
 */

const EARTH_RADIUS = 150;

// Proportsional radiuslar (6371 km = 150 birlik)
const SCALE = EARTH_RADIUS / 6371;

const LAYERS = [
  { name: 'Ichki yadro', radius: 1220 * SCALE, color: 0xfff4e0, realKm: '5150–6371 km' },
  { name: 'Tashqi yadro', radius: 3480 * SCALE, color: 0xffaa33, realKm: '2890–5150 km' },
  { name: 'Mantiya', radius: 6371 * SCALE * 0.99, color: 0xcc4422, realKm: '35–2890 km' },
];

export interface EarthInteriorHandle {
  group: THREE.Group;
  update(camera: THREE.PerspectiveCamera, earthPosition: THREE.Vector3): void;
  isActive(): boolean;
  dispose(): void;
}

export function createEarthInterior(): EarthInteriorHandle {
  const group = new THREE.Group();
  group.visible = false;

  // Har qatlam uchun sfera
  for (const layer of LAYERS) {
    const geom = new THREE.SphereGeometry(layer.radius, 48, 32);
    const mat = new THREE.MeshPhongMaterial({
      color: layer.color,
      emissive: layer.color,
      emissiveIntensity: 0.25,
      shininess: 15,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.userData.layerName = layer.name;
    mesh.userData.realKm = layer.realKm;
    group.add(mesh);
  }

  let active = false;

  return {
    group,

    update(camera: THREE.PerspectiveCamera, earthPosition: THREE.Vector3) {
      const dist = camera.position.distanceTo(earthPosition);

      // Faqat Yer ICHIDA aktivlashtiriladi (dist < EARTH_RADIUS)
      const shouldBeActive = dist < EARTH_RADIUS * 1.05;

      if (!active && shouldBeActive) {
        active = true;
        group.visible = true;
        console.log('[interior] 🜨 Yer ichki qatlamlari ochildi');
      }
      if (active && dist > EARTH_RADIUS * 1.15) {
        active = false;
        group.visible = false;
        console.log('[interior] Yopildi');
        return;
      }
      if (!active) return;

      group.position.copy(earthPosition);
    },

    isActive() {
      return active;
    },

    dispose() {
      group.children.forEach((c) => {
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose();
          if (c.material instanceof THREE.Material) c.material.dispose();
        }
      });
    },
  };
}