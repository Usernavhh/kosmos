import * as THREE from 'three';

export const AU_SCALE = 5000;

interface CometDef {
  name: string;
  nameUz: string;
  a: number;
  e: number;
  inc: number;
  node: number;
  peri: number;
  M0: number;
  period: number;
  color: number;
  tailColor: number;
}

const COMETS: CometDef[] = [
  {
    name: 'Halley',
    nameUz: 'Galley',
    a: 17.8, e: 0.967, inc: 0.285,
    node: 1.04, peri: 1.95, M0: 0,
    period: 27510,
    color: 0xaaddff,
    tailColor: 0x88bbdd,
  },
  {
    name: 'Encke',
    nameUz: 'Enke',
    a: 2.22, e: 0.848, inc: 0.197,
    node: 5.87, peri: 3.15, M0: 0,
    period: 1204,
    color: 0xbbddff,
    tailColor: 0x99ccff,
  },
];

interface CometInstance {
  nucleus: THREE.Mesh;
  glow: THREE.Mesh;
  tail: THREE.Points;
  tailPositions: Float32Array;
  tailSizes: Float32Array;
  def: CometDef;
}

export interface CometsHandle {
  group: THREE.Group;
  update(date: Date): void;
}

const TAIL_PARTICLES = 400;
const TAIL_LENGTH = 6000;
const NUCLEUS_RADIUS = 15;

export function createComets(): CometsHandle {
  const group = new THREE.Group();
  const instances: CometInstance[] = [];

  for (const def of COMETS) {
    // ========== Yadro ==========
    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(NUCLEUS_RADIUS, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    group.add(nucleus);

    // Yadro atrofidagi yorug' halo (koma)
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(NUCLEUS_RADIUS * 3, 16, 12),
      new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: 0.35,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    );
    group.add(glow);

    // ========== Dum ==========
    const tailPositions = new Float32Array(TAIL_PARTICLES * 3);
    const tailColors = new Float32Array(TAIL_PARTICLES * 3);
    const tailSizes = new Float32Array(TAIL_PARTICLES);

    // Har bir zarracha uchun tasodifiy offset (konus uchun)
    for (let i = 0; i < TAIL_PARTICLES; i++) {
      const c = new THREE.Color(def.tailColor);
      // Uzoqroq zarrachalar xiraroq
      const t = i / TAIL_PARTICLES;
      const fade = 1 - t * 0.7;
      tailColors[i * 3 + 0] = c.r * fade;
      tailColors[i * 3 + 1] = c.g * fade;
      tailColors[i * 3 + 2] = c.b * fade;
      tailSizes[i] = 0;
    }

    const tailGeom = new THREE.BufferGeometry();
    tailGeom.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    tailGeom.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));

    const tailMat = new THREE.PointsMaterial({
      size: 60,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const tail = new THREE.Points(tailGeom, tailMat);
    group.add(tail);

    instances.push({ nucleus, glow, tail, tailPositions, tailSizes, def });
  }

  // Zarrachalar uchun boshlang'ich tasodifiy taqsimot
  // (har bir zarracha uchun "spread" koeffitsienti)
  const spreads: Float32Array[] = instances.map(() => {
    const arr = new Float32Array(TAIL_PARTICLES);
    for (let i = 0; i < TAIL_PARTICLES; i++) {
      // Kvadrat taqsimot — ko'p zarrachalar o'rtada, kam chetlarda
      const r = Math.random();
      arr[i] = r * r; // 0..1, markazga moyil
    }
    return arr;
  });

  const angles: Float32Array[] = instances.map(() => {
    const arr = new Float32Array(TAIL_PARTICLES);
    for (let i = 0; i < TAIL_PARTICLES; i++) {
      arr[i] = Math.random() * Math.PI * 2;
    }
    return arr;
  });

  function update(date: Date) {
    for (let instIdx = 0; instIdx < instances.length; instIdx++) {
      const inst = instances[instIdx];
      const { def, nucleus, glow, tail, tailPositions } = inst;

      const daysSinceJ2000 =
        (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400_000;
      const M = def.M0 + (2 * Math.PI * daysSinceJ2000) / def.period;
      const E = solveKepler(M, def.e);

      const xOrb = def.a * (Math.cos(E) - def.e);
      const yOrb = def.a * Math.sqrt(1 - def.e * def.e) * Math.sin(E);

      const cosW = Math.cos(def.peri);
      const sinW = Math.sin(def.peri);
      const cosO = Math.cos(def.node);
      const sinO = Math.sin(def.node);
      const cosI = Math.cos(def.inc);
      const sinI = Math.sin(def.inc);

      const x1 = xOrb * cosW - yOrb * sinW;
      const y1 = xOrb * sinW + yOrb * cosW;

      const px = x1 * cosO - y1 * cosI * sinO;
      const py = x1 * sinO + y1 * cosI * cosO;
      const pz = y1 * sinI;

      nucleus.position.set(px * AU_SCALE, pz * AU_SCALE, -py * AU_SCALE);
      glow.position.copy(nucleus.position);

      // Quyoshdan uzoqlashuvchi yo'nalish
      const sunToComet = new THREE.Vector3(
        px * AU_SCALE,
        pz * AU_SCALE,
        -py * AU_SCALE,
      ).normalize();

      // Quyoshga masofa — dum uzunligi uchun
      const distToSun = Math.sqrt(px * px + py * py + pz * pz);
      // Yaqinda uzoq dum, uzoqda qisqa
      const activity = Math.min(1, 2.5 / Math.max(distToSun, 0.8));
      const tailLength = activity * TAIL_LENGTH;

      // Perpendikulyar o'qlar (konus uchun)
      const up = new THREE.Vector3(0, 1, 0);
      const perp1 = new THREE.Vector3().crossVectors(sunToComet, up).normalize();
      if (perp1.lengthSq() < 0.01) perp1.set(1, 0, 0);
      const perp2 = new THREE.Vector3().crossVectors(sunToComet, perp1).normalize();

      const spreadArr = spreads[instIdx];
      const angleArr = angles[instIdx];

      for (let i = 0; i < TAIL_PARTICLES; i++) {
        const t = i / TAIL_PARTICLES;
        // Konus radiusi: uzoqda katta
        const spreadRadius = spreadArr[i] * t * tailLength * 0.35;
        const angle = angleArr[i];

        const jitter1 = Math.cos(angle) * spreadRadius;
        const jitter2 = Math.sin(angle) * spreadRadius;

        tailPositions[i * 3 + 0] =
          nucleus.position.x +
          sunToComet.x * t * tailLength +
          perp1.x * jitter1 +
          perp2.x * jitter2;
        tailPositions[i * 3 + 1] =
          nucleus.position.y +
          sunToComet.y * t * tailLength +
          perp1.y * jitter1 +
          perp2.y * jitter2;
        tailPositions[i * 3 + 2] =
          nucleus.position.z +
          sunToComet.z * t * tailLength +
          perp1.z * jitter1 +
          perp2.z * jitter2;
      }
      tail.geometry.attributes.position.needsUpdate = true;
    }
  }

  update(new Date());

  return { group, update };
}

function solveKepler(M: number, e: number): number {
  let E = M;
  for (let i = 0; i < 8; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-6) break;
  }
  return E;
}