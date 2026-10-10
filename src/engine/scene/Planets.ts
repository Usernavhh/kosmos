import * as THREE from 'three';
import { Body, HelioVector, MakeTime } from 'astronomy-engine';

export const AU_SCALE = 5000;
const EARTH_RADIUS = 200;
const SUN_RADIUS = 500;

export interface PlanetsHandle {
  group: THREE.Group;
  update(date: Date): void;
}

export function createPlanets(): PlanetsHandle {
  const group = new THREE.Group();
  const loader = new THREE.TextureLoader();

  // ========== Quyosh ==========
  // Oy rasmini yuklaymiz, lekin sariq-to'q sariq rang bilan bo'yaymiz.
  // Shunda yuzasi quyoshga o'xshaydi.
  const sunTex = loader.load('/textures/sun.jpg');
  sunTex.colorSpace = THREE.SRGBColorSpace;

  const sunGeom = new THREE.SphereGeometry(SUN_RADIUS, 48, 32);
  const sunMat = new THREE.MeshBasicMaterial({
    map: sunTex,
    color: 0xffaa22, // sariq-to'q sariq rang
  });
  const sun = new THREE.Mesh(sunGeom, sunMat);
  group.add(sun);

  // Quyosh glow (yumshoq nurlanish)
  const glowGeom = new THREE.SphereGeometry(SUN_RADIUS * 1.8, 32, 24);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffaa33,
    transparent: true,
    opacity: 0.18,
    side: THREE.BackSide,
  });
  const sunGlow = new THREE.Mesh(glowGeom, glowMat);
  group.add(sunGlow);

  // ========== Yer ==========
  const earthTex = loader.load('/textures/earth_day.jpg');
  earthTex.colorSpace = THREE.SRGBColorSpace;

  const earthGeom = new THREE.SphereGeometry(EARTH_RADIUS, 48, 32);
  const earthMat = new THREE.MeshBasicMaterial({ map: earthTex });
  const earth = new THREE.Mesh(earthGeom, earthMat);
  group.add(earth);

  // Yer orbitasi (ko'k chiziq)
  const orbitPoints = computeOrbitPoints(Body.Earth, 128);
  const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMat = new THREE.LineBasicMaterial({
    color: 0x445588,
    transparent: true,
    opacity: 0.5,
  });
  const earthOrbit = new THREE.Line(orbitGeom, orbitMat);
  group.add(earthOrbit);

  // ========== Har kadr yangilash ==========
  function update(date: Date) {
    const time = MakeTime(date);

    const earthVec = HelioVector(Body.Earth, time);
    earth.position.set(
      earthVec.x * AU_SCALE,
      earthVec.z * AU_SCALE,
      -earthVec.y * AU_SCALE,
    );

    // Yer o'z o'qi atrofida aylanadi (chiroyli effekt)
    earth.rotation.y += 0.01;

    // Quyosh ham sekin aylanadi
    sun.rotation.y += 0.001;
  }

  update(new Date());

  return { group, update };
}

function computeOrbitPoints(body: Body, segments: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const now = new Date();

  for (let i = 0; i <= segments; i++) {
    const t = new Date(now.getTime() + (i / segments) * 365.25 * 86400_000);
    const time = MakeTime(t);
    const v = HelioVector(body, time);
    points.push(
      new THREE.Vector3(v.x * AU_SCALE, v.z * AU_SCALE, -v.y * AU_SCALE),
    );
  }

  return points;
}