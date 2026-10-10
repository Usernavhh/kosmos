import * as THREE from 'three';
import { Body, HelioVector, MakeTime } from 'astronomy-engine';

const AU_SCALE = 5000;

// Yer radiusi sahnada (Planets.ts bilan mos)
const EARTH_RADIUS = 150;
const EARTH_RADIUS_KM = 6371;

// 1 km → sahna birligi
const KM_TO_SCENE = EARTH_RADIUS / EARTH_RADIUS_KM;

interface SatDef {
  name: string;
  nameUz: string;
  /** Yer yuzasidan balandlik, km */
  altitudeKm: number;
  /** Orbital inklinatsiya, radian */
  inclination: number;
  /** Orbital davr, sekundlar */
  periodSec: number;
  /** Boshlang'ich faza (radian) */
  phase: number;
  /** Rang */
  color: number;
  /** Trajectory chizig'ini ko'rsatish */
  showOrbit?: boolean;
}

const SATELLITES: SatDef[] = [
  {
    name: 'ISS (Zarya)',
    nameUz: 'XKS',
    altitudeKm: 420,
    inclination: 51.6 * Math.PI / 180,
    periodSec: 92.9 * 60,
    phase: 0,
    color: 0xffcc33,
    showOrbit: true,
  },
  {
    name: 'Hubble Space Telescope',
    nameUz: 'Hubble',
    altitudeKm: 540,
    inclination: 28.5 * Math.PI / 180,
    periodSec: 95.4 * 60,
    phase: Math.PI * 0.5,
    color: 0x66aaff,
    showOrbit: true,
  },
  {
    name: 'Tiangong (CSS)',
    nameUz: 'Tyangun',
    altitudeKm: 390,
    inclination: 41.5 * Math.PI / 180,
    periodSec: 92.2 * 60,
    phase: Math.PI,
    color: 0xff8866,
    showOrbit: true,
  },
  {
    name: 'Sentinel-6',
    nameUz: 'Sentinel-6',
    altitudeKm: 1336,
    inclination: 66 * Math.PI / 180,
    periodSec: 112 * 60,
    phase: Math.PI * 1.5,
    color: 0x88ffaa,
    showOrbit: false,
  },
];

export interface SatellitesHandle {
  group: THREE.Group;
  update(date: Date): void;
  hitTest(
    camera: THREE.Camera,
    clickX: number,
    clickY: number,
    maxPixels: number,
  ): SatDef | null;
}

interface SatInstance {
  mesh: THREE.Mesh;
  def: SatDef;
  orbitRadius: number;
}

export function createSatellites(): SatellitesHandle {
  const group = new THREE.Group();
  const instances: SatInstance[] = [];
  const t0 = Date.now() / 1000;

  for (const def of SATELLITES) {
    const orbitRadius = (EARTH_RADIUS_KM + def.altitudeKm) * KM_TO_SCENE;

    // Yo'ldosh mesh
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(3, 8, 6),
      new THREE.MeshBasicMaterial({ color: def.color }),
    );
    group.add(mesh);

    // Orbita chizig'i (ixtiyoriy)
    if (def.showOrbit) {
      const points: THREE.Vector3[] = [];
      const segs = 128;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        // Yer markazi atrofida aylanma orbita (inclination bilan)
        const x = Math.cos(a) * orbitRadius;
        const y = Math.sin(a) * orbitRadius * Math.cos(def.inclination);
        const z = Math.sin(a) * orbitRadius * Math.sin(def.inclination);
        points.push(new THREE.Vector3(x, y, z));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: 0.22,
      });
      const line = new THREE.Line(geom, mat);
      group.add(line);
    }

    instances.push({ mesh, def, orbitRadius });
  }

  // Yer pozitsiyasini kuzatish uchun
  let earthPos = new THREE.Vector3();

  function update(date: Date) {
    // Yer pozitsiyasi
    const time = MakeTime(date);
    const earthVec = HelioVector(Body.Earth, time);
    earthPos.set(
      earthVec.x * AU_SCALE,
      earthVec.z * AU_SCALE,
      -earthVec.y * AU_SCALE,
    );

    const nowSec = date.getTime() / 1000;
    const elapsed = nowSec - t0;

    for (const inst of instances) {
      const { mesh, def, orbitRadius } = inst;
      const angle = def.phase + (elapsed / def.periodSec) * Math.PI * 2;

      // Yer markaziga nisbatan orbita
      const x = Math.cos(angle) * orbitRadius;
      const y = Math.sin(angle) * orbitRadius * Math.cos(def.inclination);
      const z = Math.sin(angle) * orbitRadius * Math.sin(def.inclination);

      mesh.position.set(
        earthPos.x + x,
        earthPos.y + y,
        earthPos.z + z,
      );
    }
  }

  const projected = new THREE.Vector3();

  function hitTest(
    camera: THREE.Camera,
    clickX: number,
    clickY: number,
    maxPixels: number,
  ): SatDef | null {
    const w = window.innerWidth;
    const h = window.innerHeight;

    let best: SatDef | null = null;
    let bestDist = maxPixels;

    for (const inst of instances) {
      projected.copy(inst.mesh.position).project(camera);
      if (projected.z < -1 || projected.z > 1) continue;

      const sx = (projected.x * 0.5 + 0.5) * w;
      const sy = (-projected.y * 0.5 + 0.5) * h;
      const dx = sx - clickX;
      const dy = sy - clickY;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d < bestDist) {
        bestDist = d;
        best = inst.def;
      }
    }
    return best;
  }

  update(new Date());

  return { group, update, hitTest };
}