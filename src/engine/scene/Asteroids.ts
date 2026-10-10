import * as THREE from 'three';
import { HelioVector, MakeTime, Body } from 'astronomy-engine';

export const AU_SCALE = 5000;

const BELT_COUNT = 20000;
const BELT_MIN_AU = 2.1;
const BELT_MAX_AU = 3.3;

// Asosiy asteroidlar — orbital elementlar
interface BigAsteroid {
  name: string;
  nameUz: string;
  a: number;    // katta yarim o'q (AU)
  e: number;    // ekssentrisitet
  inc: number;  // inklinatsiya (radian)
  node: number; // tugun uzunligi (radian)
  peri: number; // perigeliy argumenti (radian)
  M0: number;   // boshlang'ich o'rtacha anomaliya (radian)
  period: number; // kun
  radius: number;  // sahnada (km emas)
  color: number;
}

const BIG_ASTEROIDS: BigAsteroid[] = [
  // Ceres — mitti sayyora
  { name: 'Ceres', nameUz: 'Serera', a: 2.77, e: 0.076, inc: 0.184, node: 1.4, peri: 1.3, M0: 2.0, period: 1681, radius: 25, color: 0x998877 },
  // Vesta
  { name: 'Vesta', nameUz: 'Vesta', a: 2.36, e: 0.089, inc: 0.123, node: 1.8, peri: 2.7, M0: 0.5, period: 1325, radius: 20, color: 0xaaa090 },
  // Pallas
  { name: 'Pallas', nameUz: 'Pallada', a: 2.77, e: 0.231, inc: 0.61, node: 3.0, peri: 5.2, M0: 1.2, period: 1685, radius: 18, color: 0x8a8070 },
  // Hygiea
  { name: 'Hygiea', nameUz: 'Gigeya', a: 3.14, e: 0.117, inc: 0.064, node: 5.1, peri: 4.2, M0: 0.8, period: 2037, radius: 15, color: 0x908878 },
];

export interface AsteroidsHandle {
  group: THREE.Group;
  update(date: Date): void;
}

export function createAsteroids(): AsteroidsHandle {
  const group = new THREE.Group();

  // ========== Asteroid belbog'i (nuqtalar) ==========
  const positions = new Float32Array(BELT_COUNT * 3);
  const colors = new Float32Array(BELT_COUNT * 3);

  for (let i = 0; i < BELT_COUNT; i++) {
    // Tasodifiy orbital parametrlar
    const a = BELT_MIN_AU + Math.random() * (BELT_MAX_AU - BELT_MIN_AU);
    const e = Math.random() * 0.25;
    const inc = (Math.random() - 0.5) * 0.35;
    const phase = Math.random() * Math.PI * 2;

    // Soddalashtirilgan pozitsiya (statik)
    const r = a * AU_SCALE;
    const x = r * Math.cos(phase);
    const z = r * Math.sin(phase);
    const y = r * Math.sin(inc) * Math.sin(phase * 0.5) * 0.3;

    positions[i * 3 + 0] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Rang — kulrang, biroz qizg'ish
    const g = 0.4 + Math.random() * 0.35;
    colors[i * 3 + 0] = g * 1.05;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = g * 0.85;
  }

  const beltGeom = new THREE.BufferGeometry();
  beltGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  beltGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const beltMat = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
  });

  const belt = new THREE.Points(beltGeom, beltMat);
  group.add(belt);

  // ========== Asosiy asteroidlar (sharlar) ==========
  const bigMeshes: { mesh: THREE.Mesh; def: BigAsteroid; t0: number }[] = [];

  for (const def of BIG_ASTEROIDS) {
    const geom = new THREE.SphereGeometry(def.radius, 24, 16);
    const mat = new THREE.MeshPhongMaterial({
      color: def.color,
      shininess: 3,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);

    bigMeshes.push({ mesh, def, t0: Date.now() });
  }

  // ========== Update ==========
  function update(date: Date) {
    // Asosiy asteroidlar orbital bo'ylab harakatlanadi
    for (const { mesh, def } of bigMeshes) {
      // Sekulyar vaqt (kunlarda, J2000 dan)
      const daysSinceJ2000 =
        (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400_000;
      const M = def.M0 + (2 * Math.PI * daysSinceJ2000) / def.period;

      // Kepler tenglamasini Nyuton usuli bilan yechish
      const E = solveKepler(M, def.e);

      // Orbital tekislikdagi pozitsiya
      const xOrb = def.a * (Math.cos(E) - def.e);
      const yOrb = def.a * Math.sqrt(1 - def.e * def.e) * Math.sin(E);

      // 3D ga o'tish (rotation)
      const cosW = Math.cos(def.peri);
      const sinW = Math.sin(def.peri);
      const cosO = Math.cos(def.node);
      const sinO = Math.sin(def.node);
      const cosI = Math.cos(def.inc);
      const sinI = Math.sin(def.inc);

      const x1 = xOrb * cosW - yOrb * sinW;
      const y1 = xOrb * sinW + yOrb * cosW;

      const x = x1 * cosO - y1 * cosI * sinO;
      const y = x1 * sinO + y1 * cosI * cosO;
      const z = y1 * sinI;

      mesh.position.set(x * AU_SCALE, z * AU_SCALE, -y * AU_SCALE);
    }
  }

  return { group, update };
}

/**
 * Kepler tenglamasini Nyuton usuli bilan yechish.
 * M = E - e * sin(E)
 */
function solveKepler(M: number, e: number): number {
  let E = M;
  for (let i = 0; i < 6; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-6) break;
  }
  return E;
}