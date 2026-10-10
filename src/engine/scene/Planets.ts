import * as THREE from 'three';
import { Body, HelioVector, MakeTime } from 'astronomy-engine';

export const AU_SCALE = 5000;

export interface PlanetMeta {
  name: string;
  nameEn: string;
  body: Body;
  radius: number;
  realRadiusKm: number;
  distanceAU: number;
  periodDays: number;
  temperature: string;
  texture: string;
  ring?: boolean;
}

export const PLANETS_META: PlanetMeta[] = [
  {
    name: 'Merkuriy', nameEn: 'Mercury', body: Body.Mercury,
    radius: 80, realRadiusKm: 2439, distanceAU: 0.39,
    periodDays: 88, temperature: '-173…+427°C',
    texture: '/textures/mercurymap.jpg',
  },
  {
    name: 'Venera', nameEn: 'Venus', body: Body.Venus,
    radius: 140, realRadiusKm: 6052, distanceAU: 0.72,
    periodDays: 225, temperature: '+464°C',
    texture: '/textures/venusmap.jpg',
  },
  {
    name: 'Yer', nameEn: 'Earth', body: Body.Earth,
    radius: 150, realRadiusKm: 6371, distanceAU: 1.0,
    periodDays: 365, temperature: '+15°C',
    texture: '/textures/earth_day.jpg',
  },
  {
    name: 'Mars', nameEn: 'Mars', body: Body.Mars,
    radius: 100, realRadiusKm: 3390, distanceAU: 1.52,
    periodDays: 687, temperature: '-63°C',
    texture: '/textures/marsmap1k.jpg',
  },
  {
    name: 'Yupiter', nameEn: 'Jupiter', body: Body.Jupiter,
    radius: 500, realRadiusKm: 69911, distanceAU: 5.2,
    periodDays: 4333, temperature: '-108°C',
    texture: '/textures/jupitermap.jpg',
  },
  {
    name: 'Saturn', nameEn: 'Saturn', body: Body.Saturn,
    radius: 450, realRadiusKm: 58232, distanceAU: 9.58,
    periodDays: 10759, temperature: '-139°C',
    texture: '/textures/saturnmap.jpg', ring: true,
  },
  {
    name: 'Uran', nameEn: 'Uranus', body: Body.Uranus,
    radius: 250, realRadiusKm: 25362, distanceAU: 19.2,
    periodDays: 30687, temperature: '-197°C',
    texture: '/textures/uranusmap.jpg',
  },
  {
    name: 'Neptun', nameEn: 'Neptune', body: Body.Neptune,
    radius: 240, realRadiusKm: 24622, distanceAU: 30.05,
    periodDays: 60190, temperature: '-201°C',
    texture: '/textures/neptunemap.jpg',
  },
];

const SUN_RADIUS = 800;

export interface PlanetsHandle {
  group: THREE.Group;
  update(date: Date): void;
  getPosition(body: Body): THREE.Vector3 | null;
  getRadius(body: Body): number;
}

interface PlanetInstance {
  mesh: THREE.Mesh;
  body: Body;
  ring?: THREE.Mesh;
}

export function createPlanets(): PlanetsHandle {
  const group = new THREE.Group();
  const loader = new THREE.TextureLoader();
  const byBody = new Map<Body, PlanetInstance>();

  // ========== Quyosh nuri ==========
  // Butun Quyosh sistemasiga yorug'lik tarqatadi.
  // decay=0 — masofa bilan kuchsizlanmaydi (katta miqyosda kerak).
  const sunLight = new THREE.PointLight(0xffffff, 2.5, 0, 0);
  group.add(sunLight);

  // Yengil ambient — to'liq qorong'i tomonni ko'rinadigan qilish uchun
  const ambient = new THREE.AmbientLight(0x334466, 0.35);
  group.add(ambient);

  // ========== Quyosh ==========
  const sunTex = loader.load('/textures/sun.jpg');
  sunTex.colorSpace = THREE.SRGBColorSpace;

  const sunGeom = new THREE.SphereGeometry(SUN_RADIUS, 48, 32);
  const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
  const sun = new THREE.Mesh(sunGeom, sunMat);
  group.add(sun);

  // Quyosh glow
  const glowGeom = new THREE.SphereGeometry(SUN_RADIUS * 1.8, 32, 24);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffaa33,
    transparent: true,
    opacity: 0.18,
    side: THREE.BackSide,
  });
  const sunGlow = new THREE.Mesh(glowGeom, glowMat);
  group.add(sunGlow);

  // ========== Sayyoralar (yorug'likka javob beradi) ==========
  for (const def of PLANETS_META) {
    const tex = loader.load(def.texture);
    tex.colorSpace = THREE.SRGBColorSpace;

    const geom = new THREE.SphereGeometry(def.radius, 48, 32);
    // MeshPhongMaterial — yorug'likka javob beradi
    const mat = new THREE.MeshPhongMaterial({
      map: tex,
      shininess: 5,
      specular: 0x111111,
    });
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);

    // Orbita
    const orbitPoints = computeOrbitPoints(def.body, 256, def.periodDays);
    const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x445588, transparent: true, opacity: 0.35,
    });
    const orbit = new THREE.Line(orbitGeom, orbitMat);
    group.add(orbit);

    // Saturn halqasi
    let ring: THREE.Mesh | undefined;
    if (def.ring) {
      const ringGeom = new THREE.RingGeometry(def.radius * 1.4, def.radius * 2.2, 96);
      const ringMat = new THREE.MeshPhongMaterial({
        color: 0xd4b88a,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        shininess: 2,
      });
      ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2.2;
      group.add(ring);
    }

    byBody.set(def.body, { mesh, body: def.body, ring });
  }

  // ========== Update ==========
  function update(date: Date) {
    const time = MakeTime(date);
    sun.rotation.y += 0.001;

    for (const inst of byBody.values()) {
      const v = HelioVector(inst.body, time);
      const x = v.x * AU_SCALE;
      const y = v.z * AU_SCALE;
      const z = -v.y * AU_SCALE;

      inst.mesh.position.set(x, y, z);
      inst.mesh.rotation.y += 0.01;

      if (inst.ring) inst.ring.position.set(x, y, z);
    }
  }

  function getPosition(body: Body): THREE.Vector3 | null {
    const inst = byBody.get(body);
    if (!inst) return null;
    return inst.mesh.position.clone();
  }

  function getRadius(body: Body): number {
    const meta = PLANETS_META.find((p) => p.body === body);
    return meta?.radius ?? 100;
  }

  update(new Date());

  return { group, update, getPosition, getRadius };
}

function computeOrbitPoints(
  body: Body,
  segments: number,
  periodDays: number,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const now = new Date();
  const periodMs = periodDays * 86400_000;

  for (let i = 0; i <= segments; i++) {
    const t = new Date(now.getTime() + (i / segments) * periodMs);
    const time = MakeTime(t);
    const v = HelioVector(body, time);
    points.push(
      new THREE.Vector3(v.x * AU_SCALE, v.z * AU_SCALE, -v.y * AU_SCALE),
    );
  }
  return points;
}