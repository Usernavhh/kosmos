import * as THREE from 'three';
import { loadStars, type Star } from '../../data/stars';
import { Controls } from '../core/Controls';

export interface SceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: Controls;
  getDistance(): number;
  getSpeed(): number;
  resize(width: number, height: number): void;
  update(dt: number): void;
}

const MIN_SPEED = 10;
const MAX_SPEED = 100_000;
const PARSEC_SCALE = 100;

export function createScene(canvas: HTMLCanvasElement): SceneHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.01,
    100_000_000,
  );
  camera.position.set(0, 0, 0);

  const controls = new Controls(camera, canvas);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyH') {
      camera.position.set(0, 0, 0);
      console.log('[scene] Uyga qaytdik');
    }
  });

  let starsMesh: THREE.Points | null = null;
  let currentSpeed = MIN_SPEED;

  loadStars('/data/stars.bin')
    .then((stars) => {
      starsMesh = createStarPoints(stars);
      scene.add(starsMesh);
      console.log(`[scene] ${stars.length} yulduz sahnaga qo'shildi`);
    })
    .catch((err) => {
      console.error('[scene] Yulduzlarni yuklashda xato:', err);
    });

  return {
    scene,
    camera,
    controls,

    getDistance() {
      return camera.position.length();
    },

    getSpeed() {
      return currentSpeed;
    },

    resize(width, height) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },

    update(dt) {
      const distFromCenter = camera.position.length();
      const t = Math.min(1, distFromCenter / 50_000);
      currentSpeed = MIN_SPEED * Math.pow(MAX_SPEED / MIN_SPEED, t);
      controls.update(dt, currentSpeed);
    },
  };
}

function createStarPoints(stars: Star[]): THREE.Points {
  const positions = new Float32Array(stars.length * 3);
  const colors = new Float32Array(stars.length * 3);

  let n = 0; // haqiqiy yulduzlar soni (NaN/Inf filtrlangan)

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const r = s.dist * PARSEC_SCALE;
    const px = s.x * r;
    const py = s.y * r;
    const pz = s.z * r;

    // NaN/Inf bo'lsa, o'tkazib yuborish
    if (
      !Number.isFinite(px) ||
      !Number.isFinite(py) ||
      !Number.isFinite(pz)
    ) {
      continue;
    }

    positions[n * 3 + 0] = px;
    positions[n * 3 + 1] = py;
    positions[n * 3 + 2] = pz;

    const t = Math.min(1, Math.max(0, s.color));
    let rC: number, gC: number, bC: number;
    if (t < 0.5) {
      rC = 1.0;
      gC = 2.0 * t;
      bC = 2.0 * t;
    } else {
      rC = 2.0 * (1.0 - t);
      gC = 2.0 * (1.0 - t);
      bC = 1.0;
    }
    colors[n * 3 + 0] = rC;
    colors[n * 3 + 1] = gC;
    colors[n * 3 + 2] = bC;

    n++;
  }

  console.log(`[scene] ${n} yulduz chizishga tayyor (NaN/Inf filtrlangan)`);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions.subarray(0, n * 3), 3),
  );
  geometry.setAttribute(
    'color',
    new THREE.BufferAttribute(colors.subarray(0, n * 3), 3),
  );

  const material = new THREE.PointsMaterial({
    size: 1.8,
    vertexColors: true,
    sizeAttenuation: false,
    transparent: true,
  });

  return new THREE.Points(geometry, material);
}