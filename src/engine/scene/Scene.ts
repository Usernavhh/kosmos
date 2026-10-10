import * as THREE from 'three';
import { loadStars, type Star } from '../../data/stars';
import { loadStarNames, loadConstellations, type NamedStar } from '../../data/starNames';
import { Controls } from '../core/Controls';
import { TimeManager } from '../core/TimeManager';
import { setupTimeKeyboard } from '../core/Keyboard';
import { CameraFly } from '../core/CameraFly';
import { createPlanets, type PlanetsHandle, PLANETS_META } from './Planets';
import { createStarLabels, type StarLabelsHandle } from './StarLabels';
import type { PlanetInfo } from '../../ui/PlanetInfo';
import type { StarInfo } from '../../ui/StarInfo';

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
  planetInfo: PlanetInfo,
  starInfo: StarInfo,
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

  const planets: PlanetsHandle = createPlanets();
  scene.add(planets.group);

  let starsMesh: THREE.Points | null = null;
  let currentSpeed = MIN_SPEED;
  let starLabels: StarLabelsHandle | null = null;

  loadStars('/data/stars.bin')
    .then((stars) => {
      starsMesh = createStarPoints(stars);
      scene.add(starsMesh);
      console.log(`[scene] ${stars.length} yulduz yuklandi`);
    })
    .catch((err) => console.error('[scene] Yulduz xatosi:', err));

  Promise.all([loadStarNames(), loadConstellations()])
    .then(([names, cons]) => {
      starLabels = createStarLabels(names, cons);
      scene.add(starLabels.group);
      console.log(`[scene] ${names.length} nomli yulduz, ${cons.length} turkum`);
    })
    .catch((err) => console.error('[scene] Nomlar xatosi:', err));

  function flyToIndex(index: number) {
    const meta = PLANETS_META[index];
    const pos = planets.getPosition(meta.body);
    if (!pos) return;

    const radius = planets.getRadius(meta.body);
    const dir = new THREE.Vector3().subVectors(camera.position, pos);
    if (dir.lengthSq() < 1) dir.set(0, 0.3, 1);
    dir.normalize();

    const viewDist = radius * 5;
    const targetPos = pos.clone().add(dir.multiplyScalar(viewDist));
    const dist = camera.position.distanceTo(targetPos);
    const duration = Math.min(4, Math.max(1.5, 0.5 + Math.log10(dist) * 0.5));

    fly.start(camera, targetPos, pos, duration);
    currentIndex = index;
    starInfo.hide();
    planetInfo.show(meta);
  }

  function nextPlanet() {
    const next = currentIndex === null ? 0 : (currentIndex + 1) % PLANETS_META.length;
    flyToIndex(next);
  }

  function prevPlanet() {
    const prev = currentIndex === null
      ? PLANETS_META.length - 1
      : (currentIndex - 1 + PLANETS_META.length) % PLANETS_META.length;
    flyToIndex(prev);
  }

  function goHome() {
    fly.stop();
    camera.position.copy(HOME_POSITION);
    const dummy = new THREE.Object3D();
    dummy.position.copy(HOME_POSITION);
    dummy.lookAt(0, 0, 0);
    camera.quaternion.copy(dummy.quaternion);
    controls.syncFromCamera();
    currentIndex = null;
    planetInfo.hide();
    starInfo.hide();
    console.log('[scene] Uyga qaytdik');
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Tab') { e.preventDefault(); nextPlanet(); }
    if (e.code === 'KeyK') prevPlanet();
    if (e.code === 'Escape') { planetInfo.hide(); starInfo.hide(); }
    if (e.code === 'KeyH') goHome();
  });

  canvas.addEventListener('click', (e) => {
    if (!starLabels) return;
    const hit: NamedStar | null = starLabels.hitTest(camera, e.clientX, e.clientY, 40);
    if (hit) {
      starInfo.show(hit);
      planetInfo.hide();
      console.log(`[scene] Yulduz: ${hit.nameUz} (${hit.name})`);
    }
  });

  return {
    scene, camera, controls, time,
    getDistance() { return camera.position.length(); },
    getSpeed() { return currentSpeed; },
    resize(width, height) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    update(dt) {
      if (fly.isActive()) {
        fly.update(camera, dt);
        if (!fly.isActive()) controls.syncFromCamera();
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
    const px = s.x * r, py = s.y * r, pz = s.z * r;
    if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(pz)) continue;

    positions[n * 3 + 0] = px;
    positions[n * 3 + 1] = py;
    positions[n * 3 + 2] = pz;

    const t = Math.min(1, Math.max(0, s.color));
    let rC: number, gC: number, bC: number;
    if (t < 0.5) { rC = 1.0; gC = 2.0 * t; bC = 2.0 * t; }
    else { rC = 2.0 * (1.0 - t); gC = 2.0 * (1.0 - t); bC = 1.0; }
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