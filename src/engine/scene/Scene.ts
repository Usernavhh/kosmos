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

const STAR_RADIUS = 1000;
const MIN_SPEED = 10;
const MAX_SPEED = 100_000;

export function createScene(canvas: HTMLCanvasElement): SceneHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.01,
    10_000_000,
  );
  camera.position.set(0, 0, 0);

  const controls = new Controls(camera, canvas);

  let starsMesh: THREE.Points | null = null;
  let currentSpeed = MIN_SPEED;

  loadStars('/data/stars.bin')
    .then((stars) => {
      starsMesh = createStarPoints(stars, STAR_RADIUS);
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
      const t = Math.min(1, distFromCenter / (STAR_RADIUS * 10));
      currentSpeed = MIN_SPEED * Math.pow(MAX_SPEED / MIN_SPEED, t);
      controls.update(dt, currentSpeed);
    },
  };
}

function createStarPoints(stars: Star[], radius: number): THREE.Points {
  const positions = new Float32Array(stars.length * 3);
  const colors = new Float32Array(stars.length * 3);

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    positions[i * 3 + 0] = s.x * radius;
    positions[i * 3 + 1] = s.y * radius;
    positions[i * 3 + 2] = s.z * radius;

    const t = Math.min(1, Math.max(0, s.color));
    let r: number, g: number, b: number;
    if (t < 0.5) {
      r = 1.0;
      g = 2.0 * t;
      b = 2.0 * t;
    } else {
      r = 2.0 * (1.0 - t);
      g = 2.0 * (1.0 - t);
      b = 1.0;
    }
    colors[i * 3 + 0] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.8,
    vertexColors: true,
    sizeAttenuation: false,
    transparent: true,
  });

  return new THREE.Points(geometry, material);
}