import * as THREE from 'three';
import { Body, HelioVector, GeoMoon, MakeTime } from 'astronomy-engine';

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
  { name: 'Merkuriy', nameEn: 'Mercury', body: Body.Mercury, radius: 80, realRadiusKm: 2439, distanceAU: 0.39, periodDays: 88, temperature: '-173…+427°C', texture: '/textures/mercurymap.jpg' },
  { name: 'Venera', nameEn: 'Venus', body: Body.Venus, radius: 140, realRadiusKm: 6052, distanceAU: 0.72, periodDays: 225, temperature: '+464°C', texture: '/textures/venusmap.jpg' },
  { name: 'Yer', nameEn: 'Earth', body: Body.Earth, radius: 150, realRadiusKm: 6371, distanceAU: 1.0, periodDays: 365, temperature: '+15°C', texture: '/textures/earth_day.jpg' },
  { name: 'Mars', nameEn: 'Mars', body: Body.Mars, radius: 100, realRadiusKm: 3390, distanceAU: 1.52, periodDays: 687, temperature: '-63°C', texture: '/textures/marsmap1k.jpg' },
  { name: 'Yupiter', nameEn: 'Jupiter', body: Body.Jupiter, radius: 500, realRadiusKm: 69911, distanceAU: 5.2, periodDays: 4333, temperature: '-108°C', texture: '/textures/jupitermap.jpg' },
  { name: 'Saturn', nameEn: 'Saturn', body: Body.Saturn, radius: 450, realRadiusKm: 58232, distanceAU: 9.58, periodDays: 10759, temperature: '-139°C', texture: '/textures/saturnmap.jpg', ring: true },
  { name: 'Uran', nameEn: 'Uranus', body: Body.Uranus, radius: 250, realRadiusKm: 25362, distanceAU: 19.2, periodDays: 30687, temperature: '-197°C', texture: '/textures/uranusmap.jpg' },
  { name: 'Neptun', nameEn: 'Neptune', body: Body.Neptune, radius: 240, realRadiusKm: 24622, distanceAU: 30.05, periodDays: 60190, temperature: '-201°C', texture: '/textures/neptunemap.jpg' },
];

const SUN_RADIUS = 800;
const MOON_DISTANCE = 600;
const MOON_RADIUS = 40;

export interface PlanetHit {
  meta: PlanetMeta;
  body: Body;
}

export interface PlanetsHandle {
  group: THREE.Group;
  update(date: Date): void;
  getPosition(body: Body): THREE.Vector3 | null;
  getRadius(body: Body): number;
  hitTest(
    camera: THREE.Camera,
    clickX: number,
    clickY: number,
    maxPixels: number,
  ): PlanetHit | null;
}

interface PlanetInstance {
  mesh: THREE.Mesh;
  meta: PlanetMeta;
  ring?: THREE.Mesh;
}

export function createPlanets(): PlanetsHandle {
  const group = new THREE.Group();
  const loader = new THREE.TextureLoader();
  const instances: PlanetInstance[] = [];

  // Quyosh nuri
  const sunLight = new THREE.PointLight(0xffffff, 2.5, 0, 0);
  group.add(sunLight);

  const ambient = new THREE.AmbientLight(0x334466, 0.35);
  group.add(ambient);

  // ========== Quyosh ==========
  const sunTex = loader.load('/textures/sun.jpg');
  sunTex.colorSpace = THREE.SRGBColorSpace;
  const sunGeom = new THREE.SphereGeometry(SUN_RADIUS, 48, 32);
  const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
  const sun = new THREE.Mesh(sunGeom, sunMat);
  group.add(sun);

  const glowGeom = new THREE.SphereGeometry(SUN_RADIUS * 1.8, 32, 24);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffaa33, transparent: true, opacity: 0.18, side: THREE.BackSide,
  });
  const sunGlow = new THREE.Mesh(glowGeom, glowMat);
  group.add(sunGlow);

  // ========== Sayyoralar ==========
  let earthMesh: THREE.Mesh | null = null;
  const earthRadius = 150;

  for (const def of PLANETS_META) {
    const tex = loader.load(def.texture);
    tex.colorSpace = THREE.SRGBColorSpace;

    const geom = new THREE.SphereGeometry(def.radius, 48, 32);
    const mat = new THREE.MeshPhongMaterial({
      map: tex, shininess: 5, specular: 0x111111,
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
        color: 0xd4b88a, transparent: true, opacity: 0.7,
        side: THREE.DoubleSide, shininess: 2,
      });
      ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2.2;
      group.add(ring);
    }

    instances.push({ mesh, meta: def, ring });

    if (def.body === Body.Earth) earthMesh = mesh;
  }

  // ========== Yer atmosferasi ==========
  const atmoGeom = new THREE.SphereGeometry(earthRadius * 1.15, 64, 48);
  const atmoMat = new THREE.MeshBasicMaterial({
    color: 0x4488ff, transparent: true, opacity: 0.22,
    side: THREE.BackSide, depthWrite: false,
  });
  const earthAtmosphere = new THREE.Mesh(atmoGeom, atmoMat);
  group.add(earthAtmosphere);

  // ========== Oy ==========
  const moonTex = loader.load('/textures/moon.jpg');
  moonTex.colorSpace = THREE.SRGBColorSpace;

  const moonGeom = new THREE.SphereGeometry(MOON_RADIUS, 32, 24);
  const moonMat = new THREE.MeshPhongMaterial({
    map: moonTex, shininess: 2,
  });
  const moon = new THREE.Mesh(moonGeom, moonMat);
  group.add(moon);

  // ========== Update ==========
  function update(date: Date) {
    const time = MakeTime(date);
    sun.rotation.y += 0.001;

    for (const inst of instances) {
      const v = HelioVector(inst.meta.body, time);
      const x = v.x * AU_SCALE;
      const y = v.z * AU_SCALE;
      const z = -v.y * AU_SCALE;
      inst.mesh.position.set(x, y, z);
      inst.mesh.rotation.y += 0.01;
      if (inst.ring) inst.ring.position.set(x, y, z);
    }

    if (earthMesh) {
      earthAtmosphere.position.copy(earthMesh.position);
      const mv = GeoMoon(date);
      const dir = new THREE.Vector3(mv.x, mv.z, -mv.y).normalize();
      moon.position.copy(earthMesh.position).addScaledVector(dir, MOON_DISTANCE);
      moon.rotation.y += 0.005;
    }
  }

  function getPosition(body: Body): THREE.Vector3 | null {
    const inst = instances.find((i) => i.meta.body === body);
    return inst ? inst.mesh.position.clone() : null;
  }

  function getRadius(body: Body): number {
    const inst = instances.find((i) => i.meta.body === body);
    return inst?.meta.radius ?? 100;
  }

  // ========== Raycast (bosish uchun) ==========
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const projected = new THREE.Vector3();

  function hitTest(
    camera: THREE.Camera,
    clickX: number,
    clickY: number,
    maxPixels: number,
  ): PlanetHit | null {
    // 1) Ekran burchagidagi masofa bo'yicha tekshiramiz
    // Bu ekrandan tashqarida va kichik sayyoralarni ham topadi
    const w = window.innerWidth;
    const h = window.innerHeight;

    let best: PlanetHit | null = null;
    let bestDist = Infinity;

    for (const inst of instances) {
      projected.copy(inst.mesh.position).project(camera);
      if (projected.z < -1 || projected.z > 1) continue;

      const sx = (projected.x * 0.5 + 0.5) * w;
      const sy = (-projected.y * 0.5 + 0.5) * h;

      // Sayyora ekrandagi radiusini hisoblash
      const cameraDist = camera.position.distanceTo(inst.mesh.position);
      const screenRadius = (inst.meta.radius / cameraDist) * (h / 2) / Math.tan((camera as THREE.PerspectiveCamera).fov * Math.PI / 360);

      const dx = sx - clickX;
      const dy = sy - clickY;
      const d = Math.sqrt(dx * dx + dy * dy);

      // Sayyora radiusi ichida yoki yaqinida bo'lsa
      const tolerance = Math.max(screenRadius, maxPixels);

      if (d < tolerance && d < bestDist) {
        bestDist = d;
        best = { meta: inst.meta, body: inst.meta.body };
      }
    }

    return best;
  }

  update(new Date());

  return { group, update, getPosition, getRadius, hitTest };
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