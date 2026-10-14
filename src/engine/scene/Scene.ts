import * as THREE from 'three';
import { loadStars, type Star } from '../../data/stars';
import {
  loadStarNames,
  loadConstellations,
  type NamedStar,
} from '../../data/starNames';
import { Controls, type ControlsCallbacks } from '../core/Controls';
import type { PresetConfig } from '../core/QualityManager';
import type { MemoryTracker } from '../core/MemoryTracker';
import { TimeManager } from '../core/TimeManager';
import { setupTimeKeyboard } from '../core/Keyboard';
import { CameraFly } from '../core/CameraFly';
import { TourManager, type TourCallbacks } from '../core/TourManager';
import { FloatingOrigin } from '../core/FloatingOrigin';
import { createPlanets, type PlanetsHandle, PLANETS_META } from './Planets';
import { createStarLabels, type StarLabelsHandle } from './StarLabels';
import { createAsteroids, type AsteroidsHandle } from './Asteroids';
import { createComets, type CometsHandle } from './Comets';
import { createSatellites, type SatellitesHandle } from './Satellites';
import { createGalaxies, type GalaxiesHandle } from './Galaxies';
import { createExoplanets, type ExoplanetsHandle } from './Exoplanets';
import { createBlackHole, type BlackHoleHandle } from './BlackHole';
import { createPulsar, createSupernova, createEclipse, type PulsarHandle, type SupernovaHandle, type EclipseHandle } from './CosmicEvents';
import type { PlanetInfo } from '../../ui/PlanetInfo';
import type { StarInfo } from '../../ui/StarInfo';
import type { SatInfo } from '../../ui/SatInfo';

export interface SceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: Controls;
  time: TimeManager;
  tours: TourManager;
  getDistance(): number;
  getSpeed(): number;
  resize(width: number, height: number): void;
  update(dt: number): void;
  __flyToPlanet(i: number): void;
  __goHome(): void;
  __flyToSgrA(): void;
  __flyToMilkyWay(): void;
  __flyToAndromeda(): void;
  __flyToProxima(): void;
  __triggerEclipse(): void;
  __flyToPulsar(): void;
  __flyToSupernova(): void;
}

const MIN_SPEED = 10;
const MAX_SPEED = 1_000_000;
const PARSEC_SCALE = 500_000;
const HOME_POSITION = new THREE.Vector3(0, 20000, 60000);

export function createScene(
  canvas: HTMLCanvasElement,
  planetInfo: PlanetInfo,
  starInfo: StarInfo,
  satInfo: SatInfo,
  config: PresetConfig,
  memory: MemoryTracker,
  controlsCallbacks: ControlsCallbacks = {},
  tourCallbacks: TourCallbacks = {},
): SceneHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);

  const camera = new THREE.PerspectiveCamera(
    60, window.innerWidth / window.innerHeight, 1, 1e14,
  );
  camera.position.copy(HOME_POSITION);

  const controls = new Controls(camera, canvas, controlsCallbacks);
  const time = new TimeManager();
  const fly = new CameraFly();
  const tours = new TourManager(tourCallbacks);
  const floatingOrigin = new FloatingOrigin();

  setupTimeKeyboard(time);

  let currentIndex: number | null = null;

  const planets = createPlanets(config, memory);
  scene.add(planets.group);

  const asteroids: AsteroidsHandle = createAsteroids();
  scene.add(asteroids.group);

  const comets: CometsHandle = createComets();
  scene.add(comets.group);

  const satellites: SatellitesHandle = createSatellites();
  scene.add(satellites.group);

  const galaxies: GalaxiesHandle = createGalaxies();
  scene.add(galaxies.group);

  const exoplanets: ExoplanetsHandle = createExoplanets();
  scene.add(exoplanets.group);

  // Qora tuynuk — Sgr A* (galaktika markazida)
  let blackHole: BlackHoleHandle | null = null;
  setTimeout(() => {
    blackHole = createBlackHole(200000);
    blackHole.mesh.position.copy(galaxies.sgrAPosition);
    scene.add(blackHole.mesh);
    console.log('[scene] Sgr A* qo\'shildi');
  }, 1000);

  // ═══════════ Dinamik hodisalar ═══════════
  let pulsar: PulsarHandle | null = null;
  let supernova: SupernovaHandle | null = null;
  let eclipse: EclipseHandle | null = null;

  setTimeout(() => {
    // Pulsar — 200 ly uzoqda
    pulsar = createPulsar();
    pulsar.group.position.set(1.5e7, 0.5e7, 2e7);
    scene.add(pulsar.group);

    // Supernova qoldig'i — 500 ly uzoqda
    supernova = createSupernova(300000);
    supernova.group.position.set(-2e7, 1e7, -1.5e7);
    scene.add(supernova.group);

    // Quyosh tutilishi (boshlang'ichda yashirin)
    eclipse = createEclipse(new THREE.Vector3(0, 0, 0));
    eclipse.group.position.set(0, 0, 0);
    eclipse.group.visible = false;
    scene.add(eclipse.group);

    console.log('[scene] Dinamik hodisalar yuklandi');
  }, 1500);

  // Control panel'dan tutilish
  window.addEventListener('kosmos-eclipse', () => {
    if (eclipse) {
      eclipse.group.visible = true;
      eclipse.trigger();
      // Kamerani Quyoshga qaratish
      camera.position.set(0, 3000, 12000);
      const dummy = new THREE.Object3D();
      dummy.position.set(0, 3000, 12000);
      dummy.lookAt(0, 0, 0);
      camera.quaternion.copy(dummy.quaternion);
      controls.syncFromCamera();
      console.log('[scene] Quyosh tutilishi boshlandi');
    }
  });

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

  // ═══════════════════════════════════════════
  // RESET + FLY — barcha flylar shu orqali
  // ═══════════════════════════════════════════
  function resetAndFly(targetPos: THREE.Vector3, viewDist: number, duration: number) {
    // 1) Floating origin reset — absolut koordinatalarga qaytarish
    floatingOrigin.reset(scene, camera, HOME_POSITION);
    controls.syncFromCamera();

    // 2) Floating origin'ni pauza qilish (fly davomida)
    floatingOrigin.pause();

    // 3) Yashirin teleport: juda uzoq bo'lsa — yaqinlashtirish
    const dist = camera.position.distanceTo(targetPos);
    if (dist > 1e7) {
      const dir = new THREE.Vector3().subVectors(camera.position, targetPos);
      if (dir.lengthSq() < 1) dir.set(0, 0.3, 1);
      dir.normalize();

      const jumpPos = targetPos.clone().add(dir.multiplyScalar(viewDist * 100));
      camera.position.copy(jumpPos);
      controls.syncFromCamera();
      console.log(`[scene] Teleport: ${(dist / 1e6).toFixed(0)}M → ${viewDist * 100}`);
    }

    // 4) Yaqin masofaga fly
    const finalDist = camera.position.distanceTo(targetPos);
    const realDuration = Math.min(
      duration,
      Math.max(1.0, 0.5 + Math.log10(Math.max(finalDist, 1)) * 0.4),
    );

    fly.start(camera, targetPos.clone().add(
      new THREE.Vector3().subVectors(camera.position, targetPos).normalize().multiplyScalar(viewDist)
    ), targetPos, realDuration);
  }

  function flyToIndex(index: number) {
    const meta = PLANETS_META[index];
    const pos = planets.getPosition(meta.body);
    if (!pos) return;

    const radius = planets.getRadius(meta.body);
    const viewDist = radius * 5;

    resetAndFly(pos, viewDist, 3);

    currentIndex = index;
    starInfo.hide();
    satInfo.hide();
    planetInfo.show(meta);
    console.log(`[scene] fly: ${meta.name}`);
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
    tours.stop();
    floatingOrigin.resume();
    floatingOrigin.reset(scene, camera, HOME_POSITION);
    controls.syncFromCamera();
    currentIndex = null;
    planetInfo.hide();
    starInfo.hide();
    satInfo.hide();
    console.log('[scene] Uyga qaytdik');
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Tab') { e.preventDefault(); nextPlanet(); }
    if (e.code === 'KeyK') prevPlanet();
    if (e.code === 'Escape') {
      planetInfo.hide();
      starInfo.hide();
      satInfo.hide();
      if (tours.isActive()) tours.stop();
    }
    if (e.code === 'KeyH') goHome();
  });

  canvas.addEventListener('click', (e) => {
    const planetHit = planets.hitTest(camera, e.clientX, e.clientY, 40);
    if (planetHit) {
      starInfo.hide(); satInfo.hide();
      planetInfo.show(planetHit.meta);
      const idx = PLANETS_META.findIndex((p) => p.body === planetHit.body);
      if (idx >= 0) currentIndex = idx;
      return;
    }

    const satHit = satellites.hitTest(camera, e.clientX, e.clientY, 20);
    if (satHit) {
      planetInfo.hide(); starInfo.hide();
      satInfo.show(satHit);
      return;
    }

    if (!starLabels) return;
    const hit: NamedStar | null = starLabels.hitTest(camera, e.clientX, e.clientY, 40);
    if (hit) {
      planetInfo.hide(); satInfo.hide();
      starInfo.show(hit);
    }
  });

  return {
    scene, camera, controls, time, tours,

    getDistance() {
      return floatingOrigin.getTotalDistance(camera.position);
    },
    getSpeed() { return currentSpeed; },

    resize(width, height) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },

    update(dt) {
      if (tours.isActive()) {
        tours.update(camera, dt);
      } else if (fly.isActive()) {
        fly.update(camera, dt);
        if (!fly.isActive()) {
          controls.syncFromCamera();
          floatingOrigin.resume();
        }
      } else {
        const totalDist = floatingOrigin.getTotalDistance(camera.position);
        const t = Math.min(1, Math.log10(Math.max(totalDist, 1)) / 10);
        currentSpeed = MIN_SPEED * Math.pow(MAX_SPEED / MIN_SPEED, t);
        controls.update(dt, currentSpeed);
      }

      time.update(dt);
      const now = time.now;
      planets.update(now);
      asteroids.update(now);
      comets.update(now);
      satellites.update(now);

      if (blackHole) blackHole.update(camera);
      if (pulsar) pulsar.update(dt);
      if (supernova) supernova.update(dt);
      if (eclipse) eclipse.update(dt, camera);

      floatingOrigin.update(scene, camera);
    },

    // ═══════════ SEARCH UCHUN ═══════════
    __flyToPlanet(i: number) {
      flyToIndex(i);
    },
    __goHome() {
      goHome();
    },
    __flyToSgrA() {
      const target = galaxies.sgrAPosition.clone();
      resetAndFly(target, 800_000, 4);
      planetInfo.hide();
      starInfo.hide();
      satInfo.hide();
    },
    __flyToMilkyWay() {
      const target = galaxies.milkyWayCenter.clone();
      resetAndFly(target, 20_000_000, 5);
      planetInfo.hide();
      starInfo.hide();
      satInfo.hide();
    },
    __flyToAndromeda() {
      const target = galaxies.andromedaCenter.clone();
      resetAndFly(target, 100_000_000, 6);
      planetInfo.hide();
      starInfo.hide();
      satInfo.hide();
    },
    __flyToProxima() {
      const ra = (217.43 * Math.PI) / 180;
      const dec = (-62.68 * Math.PI) / 180;
      const dist = 4.24 * 153374;
      const target = new THREE.Vector3(
        Math.cos(dec) * Math.cos(ra) * dist,
        Math.sin(dec) * dist,
        Math.cos(dec) * Math.sin(ra) * dist,
      );
      resetAndFly(target, 200_000, 5);
      planetInfo.hide();
      starInfo.hide();
      satInfo.hide();
    },
    __triggerEclipse() {
      if (eclipse) {
        eclipse.group.visible = true;
        eclipse.trigger();
        camera.position.set(0, 3000, 12000);
        const dummy = new THREE.Object3D();
        dummy.position.set(0, 3000, 12000);
        dummy.lookAt(0, 0, 0);
        camera.quaternion.copy(dummy.quaternion);
        controls.syncFromCamera();
      }
    },
    __flyToPulsar() {
      if (!pulsar) return;
      const target = pulsar.group.position.clone();
      resetAndFly(target, 1_000_000, 5);
    },
    __flyToSupernova() {
      if (!supernova) return;
      const target = supernova.group.position.clone();
      resetAndFly(target, 1_500_000, 5);
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