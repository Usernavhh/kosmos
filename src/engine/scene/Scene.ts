import * as THREE from 'three';
import { loadStars, type Star } from '../../data/stars';
import { Controls } from '../core/Controls';
import { TimeManager } from '../core/TimeManager';
import { setupTimeKeyboard } from '../core/Keyboard';
import { CameraFly } from '../core/CameraFly';
import { createPlanets, type PlanetsHandle, PLANETS_META } from './Planets';
import type { PlanetInfo } from '../../ui/PlanetInfo';

export interface SceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: Controls;
  time: TimeManager;
  getDistance(): number;
  getSpeed(): number;
  resize(width: number, height: number): void;
  update(dt: number): void;
}

const MIN_SPEED = 10;
const MAX_SPEED = 100_000;
const PARSEC_SCALE = 500_000;
const HOME_POSITION = new THREE.Vector3(0, 20000, 60000);

export function createScene(
  canvas: HTMLCanvasElement,
  info: PlanetInfo,
): SceneHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.01,
    100_000_000,
  );
  camera.position.copy(HOME_POSITION);

  const controls = new Controls(camera, canvas);
  const time = new TimeManager();
  const fly = new CameraFly();

  setupTimeKeyboard(time);

  let currentIndex: number | null = null;

  // Sayyoralar
  const planets: PlanetsHandle = createPlanets();
  scene.add(planets.group);

  // Yulduzlar
  let starsMesh: THREE.Points | null = null;
  let currentSpeed = MIN_SPEED;

  loadStars('/data/stars.bin')
    .then((stars) => {
      starsMesh = createStarPoints(stars);
      scene.add(starsMesh);
      console.log(`[scene] ${stars.length} yulduz yuklandi`);
    })
    .catch((err) => {
      console.error('[scene] Yulduzlarni yuklashda xato:', err);
    });

  // ========== flyTo() ==========
  function flyToIndex(index: number) {
    const meta = PLANETS_META[index];
    const pos = planets.getPosition(meta.body);
    if (!pos) return;

    const radius = planets.getRadius(meta.body);

    // Kamera yo'nalishi: planetdan kameraga
    const dir = new THREE.Vector3().subVectors(camera.position, pos);
    if (dir.lengthSq() < 1) dir.set(0, 0.3, 1);
    dir.normalize();

    // Ko'rish masofasi: planet radiusidan 5 marta
    const viewDist = radius * 5;
    const targetPos = pos.clone().add(dir.multiplyScalar(viewDist));

    // Davomiylik: masofaga qarab (1.5 - 4 sekund)
    const dist = camera.position.distanceTo(targetPos);
    const duration = Math.min(4, Math.max(1.5, 0.5 + Math.log10(dist) * 0.5));

    fly.start(camera, targetPos, pos, duration);

    currentIndex = index;
    info.show(meta);
    console.log(`[scene] flyTo: ${meta.name} (${duration.toFixed(1)}s)`);
  }

  function nextPlanet() {
    if (currentIndex === null) {
      flyToIndex(0);
    } else {
      flyToIndex((currentIndex + 1) % PLANETS_META.length);
    }
  }

  function prevPlanet() {
    if (currentIndex === null) {
      flyToIndex(PLANETS_META.length - 1);
    } else {
      flyToIndex(
        (currentIndex - 1 + PLANETS_META.length) % PLANETS_META.length,
      );
    }
  }

  function goHome() {
    fly.stop();
    camera.position.copy(HOME_POSITION);
    // Kamerani markazga qaratish
    const dummy = new THREE.Object3D();
    dummy.position.copy(HOME_POSITION);
    dummy.lookAt(0, 0, 0);
    camera.quaternion.copy(dummy.quaternion);
    controls.syncFromCamera();
    currentIndex = null;
    info.hide();
    console.log('[scene] Uyga qaytdik');
  }

  // ========== Klaviatura ==========
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Tab') {
      e.preventDefault();
      nextPlanet();
    }
    if (e.code === 'KeyK') {
      prevPlanet();
    }
    if (e.code === 'Escape') {
      info.hide();
    }
    if (e.code === 'KeyH') {
      goHome();
    }
  });

  return {
    scene,
    camera,
    controls,
    time,

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
      if (fly.isActive()) {
        // Uchish paytida kamera boshqaruvi va vaqt to'xtaydi
        fly.update(camera, dt);
        if (!fly.isActive()) {
          controls.syncFromCamera();
        }
      } else {
        const distFromCenter = camera.position.length();
        const t = Math.min(1, distFromCenter / 50_000);
        currentSpeed = MIN_SPEED * Math.pow(MAX_SPEED / MIN_SPEED, t);
        controls.update(dt, currentSpeed);

        time.update(dt);
        planets.update(time.now);
      }
    },
  };
}

function createStarPoints(stars: Star[]): THREE.Points {
  const positions = new Float32Array(stars.length * 3);
  const colors = new Float32Array(stars.length * 3);
  let n = 0;

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const r = s.dist * PARSEC_SCALE;
    const px = s.x * r;
    const py = s.y * r;
    const pz = s.z * r;
    if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(pz)) continue;

    positions[n * 3 + 0] = px;
    positions[n * 3 + 1] = py;
    positions[n * 3 + 2] = pz;

    const t = Math.min(1, Math.max(0, s.color));
    let rC: number, gC: number, bC: number;
    if (t < 0.5) {
      rC = 1.0; gC = 2.0 * t; bC = 2.0 * t;
    } else {
      rC = 2.0 * (1.0 - t); gC = 2.0 * (1.0 - t); bC = 1.0;
    }
    colors[n * 3 + 0] = rC;
    colors[n * 3 + 1] = gC;
    colors[n * 3 + 2] = bC;
    n++;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions.subarray(0, n * 3), 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors.subarray(0, n * 3), 3));

  const material = new THREE.PointsMaterial({
    size: 1.8, vertexColors: true, sizeAttenuation: false, transparent: true,
  });
  return new THREE.Points(geometry, material);
}