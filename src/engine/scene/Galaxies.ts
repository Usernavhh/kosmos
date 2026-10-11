import * as THREE from 'three';

export const PARSEC_SCALE = 500_000;
const KPC = PARSEC_SCALE * 1000;
const LY = PARSEC_SCALE / 3.26156;

// Somon Yo'li markazi Yerdan 8.2 kpc
const GALACTIC_CENTER_DISTANCE = 8.2 * KPC;

export interface GalaxiesHandle {
  group: THREE.Group;
  milkyWayCenter: THREE.Vector3;
  andromedaCenter: THREE.Vector3;
  sgrAPosition: THREE.Vector3;
}

// ============ Somon Yo'li ============
function createMilkyWay(): {
  points: THREE.Points;
  center: THREE.Vector3;
} {
  const COUNT = 50000;
  const RADIUS_KPC = 15; // galaktika radiusi (kpc)
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);

  // Log spiral: r = a * exp(b * theta)
  const arms = 4;
  const b = 0.35;

  for (let i = 0; i < COUNT; i++) {
    // Asosiy shoxlarga taqsimlash + bir oz tarqalish
    const armIdx = i % arms;
    const armAngle = (armIdx / arms) * Math.PI * 2;

    // Radius: 0.1 dan 15 kpc
    const r = 0.1 + Math.pow(Math.random(), 0.6) * RADIUS_KPC;

    // Log spiral bo'ylab burchak
    const theta = (Math.log(r + 0.1) / b) + armAngle;

    // Tarqalish
    const spread = 0.3 + r * 0.08;
    const dr = (Math.random() - 0.5) * spread;
    const dtheta = (Math.random() - 0.5) * 0.5;

    const rFinal = r + dr;
    const thetaFinal = theta + dtheta;

    const x = Math.cos(thetaFinal) * rFinal;
    const z = Math.sin(thetaFinal) * rFinal;
    // Yupqa disk, ozgina qalinlik
    const y = (Math.random() - 0.5) * (0.3 + r * 0.05);

    positions[i * 3 + 0] = x * KPC;
    positions[i * 3 + 1] = y * KPC;
    positions[i * 3 + 2] = z * KPC;

    // Rang: markaz sariq, tashqi ko'k
    const t = Math.min(1, r / RADIUS_KPC);
    const rC = 1.0 * (1 - t * 0.6) + 0.5 * t * 0.5;
    const gC = 0.85 * (1 - t * 0.4) + 0.6 * t * 0.5;
    const bC = 0.4 * (1 - t * 0.6) + 1.0 * t * 0.7;
    colors[i * 3 + 0] = Math.min(1, rC);
    colors[i * 3 + 1] = Math.min(1, gC);
    colors[i * 3 + 2] = Math.min(1, bC);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 50000,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geom, mat);

  // Markaz Yer sistemasidan 8.2 kpc uzoqda. Yo'nalish: Sagittarius (RA ~266°, Dec -29°)
  const ra = (266.4 * Math.PI) / 180;
  const dec = (-28.9 * Math.PI) / 180;
  const center = new THREE.Vector3(
    Math.cos(dec) * Math.cos(ra),
    Math.sin(dec),
    Math.cos(dec) * Math.sin(ra),
  ).multiplyScalar(GALACTIC_CENTER_DISTANCE);

  points.position.copy(center);

  return { points, center };
}

// ============ Andromeda ============
function createAndromeda(offsetFromMilkyWay: THREE.Vector3): THREE.Points {
  const COUNT = 20000;
  const RADIUS_KPC = 50;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);

  const arms = 2;
  const b = 0.28;

  for (let i = 0; i < COUNT; i++) {
    const armIdx = i % arms;
    const armAngle = (armIdx / arms) * Math.PI * 2;
    const r = 0.3 + Math.pow(Math.random(), 0.5) * RADIUS_KPC;
    const theta = (Math.log(r + 0.1) / b) + armAngle;

    const spread = 0.5 + r * 0.1;
    const dr = (Math.random() - 0.5) * spread;
    const dtheta = (Math.random() - 0.5) * 0.6;

    const rFinal = r + dr;
    const thetaFinal = theta + dtheta;

    const x = Math.cos(thetaFinal) * rFinal;
    const z = Math.sin(thetaFinal) * rFinal;
    const y = (Math.random() - 0.5) * (0.5 + r * 0.06);

    positions[i * 3 + 0] = x * KPC;
    positions[i * 3 + 1] = y * KPC;
    positions[i * 3 + 2] = z * KPC;

    const t = Math.min(1, r / RADIUS_KPC);
    const rC = 1.0 * (1 - t * 0.5) + 0.7 * t * 0.5;
    const gC = 0.9 * (1 - t * 0.3) + 0.7 * t * 0.4;
    const bC = 0.7 * (1 - t * 0.5) + 1.0 * t * 0.6;
    colors[i * 3 + 0] = Math.min(1, rC);
    colors[i * 3 + 1] = Math.min(1, gC);
    colors[i * 3 + 2] = Math.min(1, bC);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 150000,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geom, mat);
  points.position.copy(offsetFromMilkyWay);

  return points;
}

// ============ Sagittarius A* (qora tuynuk) ============
function createSagittariusA(position: THREE.Vector3): THREE.Group {
  const group = new THREE.Group();
  group.position.copy(position);

  // Hodisa gorizonti
  const BH_RADIUS = 200000;
  const blackHole = new THREE.Mesh(
    new THREE.SphereGeometry(BH_RADIUS, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
  );
  group.add(blackHole);

  // Akkretsion disk (halqa)
  const disk = new THREE.Mesh(
    new THREE.RingGeometry(BH_RADIUS * 1.5, BH_RADIUS * 5, 64),
    new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  disk.rotation.x = Math.PI / 2.5;
  group.add(disk);

  // Yorug' halo
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(BH_RADIUS * 1.5, 24, 18),
    new THREE.MeshBasicMaterial({
      color: 0xff8844,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  group.add(halo);

  return group;
}

export function createGalaxies(): GalaxiesHandle {
  const group = new THREE.Group();

  // Somon Yo'li
  const { points: milkyWay, center: milkyWayCenter } = createMilkyWay();
  group.add(milkyWay);

  // Sgr A* — Somon Yo'li markazida
  const sgrA = createSagittariusA(milkyWayCenter);
  group.add(sgrA);

  // Andromeda — Somon Yo'lidan 2.5 Mly uzoqda (Andromeda yo'nalishi: RA 10°, Dec 41°)
  const M31_DISTANCE_LY = 2_537_000;
  const raM31 = (10.68 * Math.PI) / 180;
  const decM31 = (41.27 * Math.PI) / 180;
  const andromedaDir = new THREE.Vector3(
    Math.cos(decM31) * Math.cos(raM31),
    Math.sin(decM31),
    Math.cos(decM31) * Math.sin(raM31),
  );
  const andromedaCenter = andromedaDir
    .clone()
    .multiplyScalar(M31_DISTANCE_LY * LY);

  const andromeda = createAndromeda(andromedaCenter);
  group.add(andromeda);

  return {
    group,
    milkyWayCenter,
    andromedaCenter,
    sgrAPosition: milkyWayCenter.clone(),
  };
}