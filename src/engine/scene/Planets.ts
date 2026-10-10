import * as THREE from 'three';
import { Body, HelioVector, MakeTime } from 'astronomy-engine';

export const AU_SCALE = 5000;

export interface PlanetsHandle {
  group: THREE.Group;
  update(date: Date): void;
}

interface PlanetDef {
  name: string;
  body: Body;
  radius: number;
  texture: string;
  color?: number;
  ring?: boolean;
}

const SUN_RADIUS = 800;

// Sayyora o'lchamlari ko'rinadigan qilib kattalashtirilgan (real nisbat emas).
// Real o'lchamda Yer 1 piksel bo'lardi — shuning uchun "cinematic" scaling.
const PLANETS: PlanetDef[] = [
  { name: 'Merkuriy', body: Body.Mercury, radius: 80, texture: '/textures/mercurymap.jpg' },
  { name: 'Venera', body: Body.Venus, radius: 140, texture: '/textures/venusmap.jpg' },
  { name: 'Yer', body: Body.Earth, radius: 150, texture: '/textures/earth_day.jpg' },
  { name: 'Mars', body: Body.Mars, radius: 100, texture: '/textures/marsmap1k.jpg' },
  { name: 'Yupiter', body: Body.Jupiter, radius: 500, texture: '/textures/jupitermap.jpg' },
  { name: 'Saturn', body: Body.Saturn, radius: 450, texture: '/textures/saturnmap.jpg', ring: true },
  { name: 'Uran', body: Body.Uranus, radius: 250, texture: '/textures/uranusmap.jpg' },
  { name: 'Neptun', body: Body.Neptune, radius: 240, texture: '/textures/neptunemap.jpg' },
];

interface PlanetInstance {
  mesh: THREE.Mesh;
  body: Body;
  ring?: THREE.Mesh;
}

export function createPlanets(): PlanetsHandle {
  const group = new THREE.Group();
  const loader = new THREE.TextureLoader();

  // ========== Quyosh ==========
  const sunTex = loader.load('/textures/sun.jpg');
  sunTex.colorSpace = THREE.SRGBColorSpace;

  const sunGeom = new THREE.SphereGeometry(SUN_RADIUS, 48, 32);
  const sunMat = new THREE.MeshBasicMaterial({
    map: sunTex,
    color: 0xffaa22,
  });
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

  // ========== Sayyoralar ==========
  const instances: PlanetInstance[] = [];

  for (const def of PLANETS) {
    const tex = loader.load(def.texture);
    tex.colorSpace = THREE.SRGBColorSpace;

    const geom = new THREE.SphereGeometry(def.radius, 48, 32);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      color: def.color ?? 0xffffff,
    });
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);

    // Orbita chizig'i
    const orbitPoints = computeOrbitPoints(def.body, 256);
    const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x445588,
      transparent: true,
      opacity: 0.35,
    });
    const orbit = new THREE.Line(orbitGeom, orbitMat);
    group.add(orbit);

    // Saturn halqasi
    let ring: THREE.Mesh | undefined;
    if (def.ring) {
      const ringGeom = new THREE.RingGeometry(def.radius * 1.4, def.radius * 2.2, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xd4b88a,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2.2;
      group.add(ring);
    }

    instances.push({ mesh, body: def.body, ring });
  }

  // ========== Har kadr yangilash ==========
  function update(date: Date) {
    const time = MakeTime(date);

    sun.rotation.y += 0.001;

    for (const inst of instances) {
      const v = HelioVector(inst.body, time);
      const x = v.x * AU_SCALE;
      const y = v.z * AU_SCALE;
      const z = -v.y * AU_SCALE;

      inst.mesh.position.set(x, y, z);
      inst.mesh.rotation.y += 0.01;

      if (inst.ring) {
        inst.ring.position.set(x, y, z);
      }
    }
  }

  update(new Date());

  return { group, update };
}

function computeOrbitPoints(body: Body, segments: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const now = new Date();

  const periodDays = getOrbitalPeriod(body);
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

function getOrbitalPeriod(body: Body): number {
  switch (body) {
    case Body.Mercury: return 88;
    case Body.Venus: return 225;
    case Body.Earth: return 365.25;
    case Body.Mars: return 687;
    case Body.Jupiter: return 4333;
    case Body.Saturn: return 10759;
    case Body.Uranus: return 30687;
    case Body.Neptune: return 60190;
    default: return 365.25;
  }
}