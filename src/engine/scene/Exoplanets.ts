import * as THREE from 'three';
import { EXOPLANET_SYSTEMS, type ExoplanetSystem } from '../../data/exoplanets';

const PARSEC_SCALE = 500_000;
const LY = PARSEC_SCALE / 3.26156;

// 1 AU necha birlik
const AU_EXOPLANET_SCALE = 2000;

export interface ExoplanetsHandle {
  group: THREE.Group;
  hitTest(
    camera: THREE.Camera,
    clickX: number,
    clickY: number,
    maxPixels: number,
  ): ExoplanetSystem | null;
}

interface SystemInstance {
  def: ExoplanetSystem;
  starMesh: THREE.Mesh;
  planetMeshes: { mesh: THREE.Mesh; periodDays: number; distanceAU: number; phase: number }[];
  position: THREE.Vector3;
}

export function createExoplanets(): ExoplanetsHandle {
  const group = new THREE.Group();
  const instances: SystemInstance[] = [];

  for (const def of EXOPLANET_SYSTEMS) {
    // RA/Dec → 3D pozitsiya
    const ra = (def.ra * Math.PI) / 180;
    const dec = (def.dec * Math.PI) / 180;
    const dist = def.distanceLy * LY;

    const x = Math.cos(dec) * Math.cos(ra) * dist;
    const y = Math.sin(dec) * dist;
    const z = Math.cos(dec) * Math.sin(ra) * dist;
    const pos = new THREE.Vector3(x, y, z);

    // Yulduz
    const starMesh = new THREE.Mesh(
      new THREE.SphereGeometry(def.starSize, 24, 16),
      new THREE.MeshBasicMaterial({ color: def.starColor }),
    );
    starMesh.position.copy(pos);
    group.add(starMesh);

    // Yulduz glow
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(def.starSize * 2.5, 20, 14),
      new THREE.MeshBasicMaterial({
        color: def.starColor,
        transparent: true,
        opacity: 0.25,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    );
    glow.position.copy(pos);
    group.add(glow);

    // Sayyoralar
    const planetMeshes: SystemInstance['planetMeshes'] = [];
    for (let i = 0; i < def.planets.length; i++) {
      const p = def.planets[i];
      const planetMesh = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(8, p.radiusEarth * 5), 16, 12),
        new THREE.MeshPhongMaterial({
          color: p.color,
          emissive: p.color,
          emissiveIntensity: 0.3,
          shininess: 5,
        }),
      );
      group.add(planetMesh);

      // Orbita chizig'i
      const orbitPoints: THREE.Vector3[] = [];
      const orbitRadius = p.distanceAU * AU_EXOPLANET_SCALE + def.starSize * 3;
      for (let s = 0; s <= 64; s++) {
        const a = (s / 64) * Math.PI * 2;
        orbitPoints.push(
          new THREE.Vector3(
            Math.cos(a) * orbitRadius,
            Math.sin(a) * orbitRadius * 0.15,
            Math.sin(a) * orbitRadius,
          ),
        );
      }
      const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitLine = new THREE.Line(
        orbitGeom,
        new THREE.LineBasicMaterial({
          color: def.starColor,
          transparent: true,
          opacity: 0.3,
        }),
      );
      orbitLine.position.copy(pos);
      group.add(orbitLine);

      planetMeshes.push({
        mesh: planetMesh,
        periodDays: p.periodDays,
        distanceAU: p.distanceAU,
        phase: (i / def.planets.length) * Math.PI * 2,
      });
    }

    instances.push({ def, starMesh, planetMeshes, position: pos });
  }

  const projected = new THREE.Vector3();

  function hitTest(
    camera: THREE.Camera,
    clickX: number,
    clickY: number,
    maxPixels: number,
  ): ExoplanetSystem | null {
    const w = window.innerWidth;
    const h = window.innerHeight;
    let best: ExoplanetSystem | null = null;
    let bestDist = maxPixels * 5;

    for (const inst of instances) {
      projected.copy(inst.position).project(camera);
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

  return { group, hitTest };
}