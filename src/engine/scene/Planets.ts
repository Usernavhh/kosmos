import * as THREE from 'three';
import { Body, HelioVector, GeoMoon, MakeTime } from 'astronomy-engine';

export const AU_SCALE = 5000;

export interface PlanetMeta {
  name: string;
  nameEn: string;
  body: Body;
  radius: number;
  realRadiusKm: number;
  distanceAU: number;
  periodDays: number;
  temperature: string;
  texture: string;
  ring?: boolean;
}

export const PLANETS_META: PlanetMeta[] = [
  { name: 'Merkuriy', nameEn: 'Mercury', body: Body.Mercury, radius: 80, realRadiusKm: 2439, distanceAU: 0.39, periodDays: 88, temperature: '-173…+427°C', texture: '/textures/mercurymap.jpg' },
  { name: 'Venera', nameEn: 'Venus', body: Body.Venus, radius: 140, realRadiusKm: 6052, distanceAU: 0.72, periodDays: 225, temperature: '+464°C', texture: '/textures/venusmap.jpg' },
  { name: 'Yer', nameEn: 'Earth', body: Body.Earth, radius: 150, realRadiusKm: 6371, distanceAU: 1.0, periodDays: 365, temperature: '+15°C', texture: '/textures/earth_day.jpg' },
  { name: 'Mars', nameEn: 'Mars', body: Body.Mars, radius: 100, realRadiusKm: 3390, distanceAU: 1.52, periodDays: 687, temperature: '-63°C', texture: '/textures/marsmap1k.jpg' },
  { name: 'Yupiter', nameEn: 'Jupiter', body: Body.Jupiter, radius: 500, realRadiusKm: 69911, distanceAU: 5.2, periodDays: 4333, temperature: '-108°C', texture: '/textures/jupitermap.jpg' },
  { name: 'Saturn', nameEn: 'Saturn', body: Body.Saturn, radius: 450, realRadiusKm: 58232, distanceAU: 9.58, periodDays: 10759, temperature: '-139°C', texture: '/textures/saturnmap.jpg', ring: true },
  { name: 'Uran', nameEn: 'Uranus', body: Body.Uranus, radius: 250, realRadiusKm: 25362, distanceAU: 19.2, periodDays: 30687, temperature: '-197°C', texture: '/textures/uranusmap.jpg' },
  { name: 'Neptun', nameEn: 'Neptune', body: Body.Neptune, radius: 240, realRadiusKm: 24622, distanceAU: 30.05, periodDays: 60190, temperature: '-201°C', texture: '/textures/neptunemap.jpg' },
];

// ========== Yo'ldoshlar (sayyora oylari) ==========
interface MoonDef {
  name: string;
  nameUz: string;
  parentBody: Body;
  /** Orbita radiusi sahnada (parent radiusidan necha marta) */
  orbitScale: number;
  radius: number;
  periodDays: number;
  color: number;
  phase: number;
}

const MOONS: MoonDef[] = [
  // Mars
  { name: 'Phobos', nameUz: 'Fobos', parentBody: Body.Mars, orbitScale: 3.5, radius: 8, periodDays: 0.319, color: 0x8a8070, phase: 0 },
  { name: 'Deimos', nameUz: 'Deymos', parentBody: Body.Mars, orbitScale: 5.5, radius: 6, periodDays: 1.263, color: 0x9a8877, phase: 2 },
  // Yupiter
  { name: 'Io', nameUz: 'Io', parentBody: Body.Jupiter, orbitScale: 2.5, radius: 20, periodDays: 1.769, color: 0xffdd88, phase: 0 },
  { name: 'Europa', nameUz: 'Yevropa', parentBody: Body.Jupiter, orbitScale: 3.2, radius: 18, periodDays: 3.551, color: 0xddddcc, phase: 1 },
  { name: 'Ganymede', nameUz: 'Ganimed', parentBody: Body.Jupiter, orbitScale: 4.0, radius: 26, periodDays: 7.155, color: 0xbb9988, phase: 2 },
  { name: 'Callisto', nameUz: 'Kallisto', parentBody: Body.Jupiter, orbitScale: 5.0, radius: 24, periodDays: 16.689, color: 0x776655, phase: 3 },
  // Saturn
  { name: 'Titan', nameUz: 'Titan', parentBody: Body.Saturn, orbitScale: 4.0, radius: 22, periodDays: 15.945, color: 0xdd9955, phase: 0 },
  // Neptun
  { name: 'Triton', nameUz: 'Triton', parentBody: Body.Neptune, orbitScale: 3.5, radius: 16, periodDays: 5.877, color: 0xccddee, phase: 0 },
];

const SUN_RADIUS = 800;
const MOON_DISTANCE = 600;
const MOON_RADIUS = 40;
const EARTH_RADIUS = 150;

export interface PlanetHit {
  meta: PlanetMeta;
  body: Body;
}

export interface PlanetsHandle {
  group: THREE.Group;
  update(date: Date): void;
  getPosition(body: Body): THREE.Vector3 | null;
  getRadius(body: Body): number;
  hitTest(camera: THREE.Camera, clickX: number, clickY: number, maxPixels: number): PlanetHit | null;
}

interface PlanetInstance {
  mesh: THREE.Mesh;
  meta: PlanetMeta;
  ring?: THREE.Mesh;
}

interface MoonInstance {
  mesh: THREE.Mesh;
  def: MoonDef;
  parentRadius: number;
}

export function createPlanets(): PlanetsHandle {
  const group = new THREE.Group();
  const loader = new THREE.TextureLoader();
  const instances: PlanetInstance[] = [];
  const moonInstances: MoonInstance[] = [];

  const sunLight = new THREE.PointLight(0xffffff, 2.5, 0, 0);
  group.add(sunLight);
  group.add(new THREE.AmbientLight(0x334466, 0.35));

  // ========== Quyosh ==========
  const sunTex = loader.load('/textures/sun.jpg');
  sunTex.colorSpace = THREE.SRGBColorSpace;
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_RADIUS, 48, 32),
    new THREE.MeshBasicMaterial({ map: sunTex }),
  );
  group.add(sun);

  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_RADIUS * 1.8, 32, 24),
    new THREE.MeshBasicMaterial({
      color: 0xffaa33, transparent: true, opacity: 0.18, side: THREE.BackSide,
    }),
  );
  group.add(sunGlow);

  // ========== Yer maxsus shader ==========
  const earthDayTex = loader.load('/textures/earth_day.jpg');
  earthDayTex.colorSpace = THREE.SRGBColorSpace;
  const earthNightTex = loader.load('/textures/earth_night.png');
  earthNightTex.colorSpace = THREE.SRGBColorSpace;

  const earthUniforms = {
    dayTexture: { value: earthDayTex },
    nightTexture: { value: earthNightTex },
    sunDirection: { value: new THREE.Vector3(1, 0, 0) },
  };

  const earthMat = new THREE.ShaderMaterial({
    uniforms: earthUniforms,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform vec3 sunDirection;
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      void main() {
        vec3 dayColor = texture2D(dayTexture, vUv).rgb;
        vec3 nightColor = texture2D(nightTexture, vUv).rgb;
        float d = dot(normalize(vWorldNormal), normalize(sunDirection));
        float dayMix = smoothstep(-0.12, 0.12, d);
        vec3 color = mix(nightColor * 1.8, dayColor, dayMix);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

  // ========== Sayyoralar ==========
  let earthMesh: THREE.Mesh | null = null;

  for (const def of PLANETS_META) {
    let mesh: THREE.Mesh;

    if (def.body === Body.Earth) {
      mesh = new THREE.Mesh(new THREE.SphereGeometry(def.radius, 64, 48), earthMat);
      earthMesh = mesh;
    } else {
      const tex = loader.load(def.texture);
      tex.colorSpace = THREE.SRGBColorSpace;
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(def.radius, 48, 32),
        new THREE.MeshPhongMaterial({ map: tex, shininess: 5, specular: 0x111111 }),
      );
    }
    group.add(mesh);

    const orbitPoints = computeOrbitPoints(def.body, 256, def.periodDays);
    const orbit = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(orbitPoints),
      new THREE.LineBasicMaterial({ color: 0x445588, transparent: true, opacity: 0.35 }),
    );
    group.add(orbit);

    let ring: THREE.Mesh | undefined;
    if (def.ring) {
      ring = new THREE.Mesh(
        new THREE.RingGeometry(def.radius * 1.4, def.radius * 2.2, 96),
        new THREE.MeshPhongMaterial({
          color: 0xd4b88a, transparent: true, opacity: 0.7,
          side: THREE.DoubleSide, shininess: 2,
        }),
      );
      ring.rotation.x = Math.PI / 2.2;
      group.add(ring);
    }

    instances.push({ mesh, meta: def, ring });
  }

  // ========== Yer atmosferasi + bulutlar ==========
  const earthAtmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.15, 64, 48),
    new THREE.MeshBasicMaterial({
      color: 0x4488ff, transparent: true, opacity: 0.22,
      side: THREE.BackSide, depthWrite: false,
    }),
  );
  group.add(earthAtmosphere);

  const cloudsTex = loader.load('/textures/earth_clouds.png');
  cloudsTex.colorSpace = THREE.SRGBColorSpace;
  const earthClouds = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.012, 64, 48),
    new THREE.MeshPhongMaterial({
      map: cloudsTex, transparent: true, opacity: 0.85,
      depthWrite: false, shininess: 1,
    }),
  );
  group.add(earthClouds);

  // ========== Oy (Yer yo'ldoshi) ==========
  const moonTex = loader.load('/textures/moon.jpg');
  moonTex.colorSpace = THREE.SRGBColorSpace;
  const earthMoon = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_RADIUS, 32, 24),
    new THREE.MeshPhongMaterial({ map: moonTex, shininess: 2 }),
  );
  group.add(earthMoon);

  // ========== Boshqa yo'ldoshlar ==========
  for (const def of MOONS) {
    const parentMeta = PLANETS_META.find((p) => p.body === def.parentBody);
    if (!parentMeta) continue;

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(def.radius, 20, 14),
      new THREE.MeshPhongMaterial({ color: def.color, shininess: 3 }),
    );
    group.add(mesh);

    moonInstances.push({ mesh, def, parentRadius: parentMeta.radius });
  }

  // ========== Update ==========
  function update(date: Date) {
    const time = MakeTime(date);
    sun.rotation.y += 0.001;

    for (const inst of instances) {
      const v = HelioVector(inst.meta.body, time);
      const x = v.x * AU_SCALE;
      const y = v.z * AU_SCALE;
      const z = -v.y * AU_SCALE;
      inst.mesh.position.set(x, y, z);
      inst.mesh.rotation.y += 0.01;
      if (inst.ring) inst.ring.position.set(x, y, z);
    }

    if (earthMesh) {
      earthAtmosphere.position.copy(earthMesh.position);
      earthClouds.position.copy(earthMesh.position);
      earthClouds.rotation.y += 0.006;

      const sunDir = earthMesh.position.clone().negate().normalize();
      earthUniforms.sunDirection.value.copy(sunDir);

      // Oy
      const mv = GeoMoon(date);
      const dir = new THREE.Vector3(mv.x, mv.z, -mv.y).normalize();
      earthMoon.position.copy(earthMesh.position).addScaledVector(dir, MOON_DISTANCE);
      earthMoon.rotation.y += 0.005;
    }

    // Boshqa yo'ldoshlar
    const daysSinceJ2000 =
      (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400_000;

    for (const inst of moonInstances) {
      const parentInst = instances.find((p) => p.meta.body === inst.def.parentBody);
      if (!parentInst) continue;

      const angle = inst.def.phase + (2 * Math.PI * daysSinceJ2000) / inst.def.periodDays;
      const radius = inst.parentRadius * inst.def.orbitScale;

      inst.mesh.position.set(
        parentInst.mesh.position.x + Math.cos(angle) * radius,
        parentInst.mesh.position.y + Math.sin(angle) * radius * 0.3,
        parentInst.mesh.position.z + Math.sin(angle) * radius * 0.9,
      );
    }
  }

  function getPosition(body: Body): THREE.Vector3 | null {
    const inst = instances.find((i) => i.meta.body === body);
    return inst ? inst.mesh.position.clone() : null;
  }

  function getRadius(body: Body): number {
    const inst = instances.find((i) => i.meta.body === body);
    return inst?.meta.radius ?? 100;
  }

  const projected = new THREE.Vector3();

  function hitTest(
    camera: THREE.Camera,
    clickX: number,
    clickY: number,
    maxPixels: number,
  ): PlanetHit | null {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const persp = camera as THREE.PerspectiveCamera;
    const fovFactor = (h / 2) / Math.tan((persp.fov * Math.PI) / 360);

    let best: PlanetHit | null = null;
    let bestDist = Infinity;

    for (const inst of instances) {
      projected.copy(inst.mesh.position).project(camera);
      if (projected.z < -1 || projected.z > 1) continue;

      const sx = (projected.x * 0.5 + 0.5) * w;
      const sy = (-projected.y * 0.5 + 0.5) * h;
      const cameraDist = camera.position.distanceTo(inst.mesh.position);
      const screenRadius = (inst.meta.radius / cameraDist) * fovFactor;
      const tolerance = Math.max(screenRadius, maxPixels);
      const dx = sx - clickX;
      const dy = sy - clickY;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d < tolerance && d < bestDist) {
        bestDist = d;
        best = { meta: inst.meta, body: inst.meta.body };
      }
    }
    return best;
  }

  update(new Date());

  return { group, update, getPosition, getRadius, hitTest };
}

function computeOrbitPoints(body: Body, segments: number, periodDays: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const now = new Date();
  const periodMs = periodDays * 86400_000;

  for (let i = 0; i <= segments; i++) {
    const t = new Date(now.getTime() + (i / segments) * periodMs);
    const v = HelioVector(body, MakeTime(t));
    points.push(new THREE.Vector3(v.x * AU_SCALE, v.z * AU_SCALE, -v.y * AU_SCALE));
  }
  return points;
}