import * as THREE from 'three';
import { Body, HelioVector, GeoMoon, MakeTime } from 'astronomy-engine';
import type { PresetConfig } from '../core/QualityManager';
import type { MemoryTracker } from '../core/MemoryTracker';
import { createSun, type SunHandle } from './Sun';

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
  textureNight?: string;
  ring?: boolean;
  ringColor?: number;
  ringInner?: number;
  ringOuter?: number;
  atmosphereColor?: number;
  atmosphereScale?: number;
  atmosphereOpacity?: number;
}

export const PLANETS_META: PlanetMeta[] = [
  { name: 'Merkuriy', nameEn: 'Mercury', body: Body.Mercury, radius: 80, realRadiusKm: 2439, distanceAU: 0.39, periodDays: 88, temperature: '-173…+427°C', texture: '/textures/mercurymap.jpg' },
  { name: 'Venera', nameEn: 'Venus', body: Body.Venus, radius: 140, realRadiusKm: 6052, distanceAU: 0.72, periodDays: 225, temperature: '+464°C', texture: '/textures/venusmap.jpg', atmosphereColor: 0xffdd88, atmosphereScale: 1.06, atmosphereOpacity: 0.35 },
  { name: 'Yer', nameEn: 'Earth', body: Body.Earth, radius: 150, realRadiusKm: 6371, distanceAU: 1.0, periodDays: 365, temperature: '+15°C', texture: '/textures/earth_day.jpg', textureNight: '/textures/earth_night.png', atmosphereColor: 0x4488ff, atmosphereScale: 1.18, atmosphereOpacity: 0.32 },
  { name: 'Mars', nameEn: 'Mars', body: Body.Mars, radius: 100, realRadiusKm: 3390, distanceAU: 1.52, periodDays: 687, temperature: '-63°C', texture: '/textures/marsmap1k.jpg', atmosphereColor: 0xff9966, atmosphereScale: 1.05, atmosphereOpacity: 0.2 },
  { name: 'Yupiter', nameEn: 'Jupiter', body: Body.Jupiter, radius: 500, realRadiusKm: 69911, distanceAU: 5.2, periodDays: 4333, temperature: '-108°C', texture: '/textures/jupitermap.jpg', atmosphereColor: 0xffddaa, atmosphereScale: 1.03, atmosphereOpacity: 0.15 },
  { name: 'Saturn', nameEn: 'Saturn', body: Body.Saturn, radius: 450, realRadiusKm: 58232, distanceAU: 9.58, periodDays: 10759, temperature: '-139°C', texture: '/textures/saturnmap.jpg', ring: true, ringColor: 0xd4b88a, ringInner: 1.4, ringOuter: 2.2, atmosphereColor: 0xffddaa, atmosphereScale: 1.03, atmosphereOpacity: 0.15 },
  { name: 'Uran', nameEn: 'Uranus', body: Body.Uranus, radius: 250, realRadiusKm: 25362, distanceAU: 19.2, periodDays: 30687, temperature: '-197°C', texture: '/textures/uranusmap.jpg', ring: true, ringColor: 0x99aabb, ringInner: 1.6, ringOuter: 2.0, atmosphereColor: 0x88ffdd, atmosphereScale: 1.05, atmosphereOpacity: 0.18 },
  { name: 'Neptun', nameEn: 'Neptune', body: Body.Neptune, radius: 240, realRadiusKm: 24622, distanceAU: 30.05, periodDays: 60190, temperature: '-201°C', texture: '/textures/neptunemap.jpg', atmosphereColor: 0x6688ff, atmosphereScale: 1.08, atmosphereOpacity: 0.22 },
];

interface MoonDef {
  name: string;
  nameUz: string;
  parentBody: Body;
  orbitScale: number;
  radius: number;
  periodDays: number;
  color: number;
  phase: number;
}

const MOONS: MoonDef[] = [
  { name: 'Phobos', nameUz: 'Fobos', parentBody: Body.Mars, orbitScale: 3.5, radius: 8, periodDays: 0.319, color: 0x8a8070, phase: 0 },
  { name: 'Deimos', nameUz: 'Deymos', parentBody: Body.Mars, orbitScale: 5.5, radius: 6, periodDays: 1.263, color: 0x9a8877, phase: 2 },
  { name: 'Io', nameUz: 'Io', parentBody: Body.Jupiter, orbitScale: 2.5, radius: 20, periodDays: 1.769, color: 0xffdd88, phase: 0 },
  { name: 'Europa', nameUz: 'Yevropa', parentBody: Body.Jupiter, orbitScale: 3.2, radius: 18, periodDays: 3.551, color: 0xddddcc, phase: 1 },
  { name: 'Ganymede', nameUz: 'Ganimed', parentBody: Body.Jupiter, orbitScale: 4.0, radius: 26, periodDays: 7.155, color: 0xbb9988, phase: 2 },
  { name: 'Callisto', nameUz: 'Kallisto', parentBody: Body.Jupiter, orbitScale: 5.0, radius: 24, periodDays: 16.689, color: 0x776655, phase: 3 },
  { name: 'Titan', nameUz: 'Titan', parentBody: Body.Saturn, orbitScale: 4.0, radius: 22, periodDays: 15.945, color: 0xdd9955, phase: 0 },
  { name: 'Triton', nameUz: 'Triton', parentBody: Body.Neptune, orbitScale: 3.5, radius: 16, periodDays: 5.877, color: 0xccddee, phase: 0 },
];

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
  sun: SunHandle;
}

interface PlanetInstance {
  mesh: THREE.Mesh;
  meta: PlanetMeta;
  ring?: THREE.Mesh;
  atmosphere?: THREE.Mesh;
  clouds?: THREE.Mesh;
}

interface MoonInstance {
  mesh: THREE.Mesh;
  def: MoonDef;
  parentRadius: number;
}

/**
 * Tekstura yuklash + RAM tracking.
 */
function loadTexture(
  loader: THREE.TextureLoader,
  filename: string,
  config: PresetConfig,
  memory: MemoryTracker,
): THREE.Texture {
  // Preset bo'yicha papka tanlash
  const sizeFolder = config.textureSize.toString();
  const path = `/textures/${sizeFolder}/${filename}`;

  const tex = loader.load(
    path,
    undefined,
    undefined,
    () => {
      // Xato bo'lsa — 2048 papkasidan fallback
      console.warn(`[texture] ${path} topilmadi, fallback: /textures/2048/${filename}`);
      const fallback = loader.load(`/textures/2048/${filename}`);
      fallback.colorSpace = THREE.SRGBColorSpace;
      tex.image = fallback.image;
      tex.needsUpdate = true;
    },
  );

  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = config.textureSize >= 2048 ? 8 : config.textureSize >= 1024 ? 4 : 2;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;

  const size = config.textureSize;
  memory.addTexture(size, size / 2, true);

  return tex;
}

export function createPlanets(
  config: PresetConfig,
  memory: MemoryTracker,
): PlanetsHandle {
  const group = new THREE.Group();
  const loader = new THREE.TextureLoader();
  const instances: PlanetInstance[] = [];
  const moonInstances: MoonInstance[] = [];

  const seg = config.sphereSegments;
  const segHalf = Math.round(seg / 2);

  // ═══ Quyosh ═══
  const sun = createSun(config, memory);
  group.add(sun.group);

  group.add(new THREE.AmbientLight(0x445577, 0.35));

  // ═══ Yer maxsus shader ═══
  const earthDayTex = loadTexture(loader, 'earth_day.jpg', config, memory);
  const earthNightTex = loadTexture(loader, 'earth_night.png', config, memory);

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

  // ═══ Sayyoralar ═══
  let earthMesh: THREE.Mesh | null = null;

  for (const def of PLANETS_META) {
    const geom = new THREE.SphereGeometry(def.radius, seg, segHalf);
    memory.addGeometry(geom.attributes.position.count, geom.index?.count ?? 0);

    let mesh: THREE.Mesh;

    if (def.body === Body.Earth) {
      mesh = new THREE.Mesh(geom, earthMat);
      earthMesh = mesh;
    } else {
      // def.texture dan fayl nomini olish
      const filename = def.texture.split('/').pop() ?? def.texture;
      const tex = loadTexture(loader, filename, config, memory);
      const mat = new THREE.MeshPhongMaterial({
        map: tex,
        shininess: config.normalMaps ? 12 : 5,
        specular: new THREE.Color(config.normalMaps ? 0x444444 : 0x111111),
      });
      mesh = new THREE.Mesh(geom, mat);
    }
    group.add(mesh);

    // ═══ Orbita ═══
    const orbitPoints = computeOrbitPoints(def.body, config.orbitSegments, def.periodDays);
    const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbit = new THREE.Line(
      orbitGeom,
      new THREE.LineBasicMaterial({ color: 0x445588, transparent: true, opacity: 0.35 }),
    );
    group.add(orbit);

    // ═══ Atmosfera ═══
    let atmosphere: THREE.Mesh | undefined;
    if (config.atmosphere && def.atmosphereColor) {
      const atmoScale = def.atmosphereScale ?? 1.1;
      const atmoGeom = new THREE.SphereGeometry(def.radius * atmoScale, segHalf, segHalf / 2);
      memory.addGeometry(atmoGeom.attributes.position.count, atmoGeom.index?.count ?? 0);

      const atmoMat = new THREE.MeshBasicMaterial({
        color: def.atmosphereColor,
        transparent: true,
        opacity: def.atmosphereOpacity ?? 0.2,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      atmosphere = new THREE.Mesh(atmoGeom, atmoMat);
      group.add(atmosphere);
    }

    // ═══ Halqa ═══
    let ring: THREE.Mesh | undefined;
    if (def.ring) {
      const inner = def.ringInner ?? 1.4;
      const outer = def.ringOuter ?? 2.2;
      const ringSeg = config.textureSize >= 2048 ? 128 : 64;
      const ringGeom = new THREE.RingGeometry(def.radius * inner, def.radius * outer, ringSeg);
      memory.addGeometry(ringGeom.attributes.position.count, ringGeom.index?.count ?? 0);

      ring = new THREE.Mesh(
        ringGeom,
        new THREE.MeshPhongMaterial({
          color: def.ringColor ?? 0xd4b88a,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
          shininess: config.normalMaps ? 5 : 2,
        }),
      );
      ring.rotation.x = Math.PI / 2.2;
      group.add(ring);
    }

    instances.push({ mesh, meta: def, ring, atmosphere });
  }

  // ═══ Yer bulutlari ═══
  const cloudsTex = loadTexture(loader, 'earth_clouds.png', config, memory);
  const cloudsGeom = new THREE.SphereGeometry(EARTH_RADIUS * 1.012, seg, segHalf);
  memory.addGeometry(cloudsGeom.attributes.position.count, cloudsGeom.index?.count ?? 0);

  const earthClouds = new THREE.Mesh(
    cloudsGeom,
    new THREE.MeshPhongMaterial({
      map: cloudsTex, transparent: true, opacity: 0.85,
      depthWrite: false, shininess: 1,
    }),
  );
  group.add(earthClouds);

  // ═══ Oy ═══
  const moonTex = loadTexture(loader, 'moon.jpg', config, memory);
  const earthMoonGeom = new THREE.SphereGeometry(MOON_RADIUS, segHalf, segHalf / 2);
  memory.addGeometry(earthMoonGeom.attributes.position.count, earthMoonGeom.index?.count ?? 0);

  const earthMoon = new THREE.Mesh(
    earthMoonGeom,
    new THREE.MeshPhongMaterial({ map: moonTex, shininess: 2 }),
  );
  group.add(earthMoon);

  // ═══ Boshqa yo'ldoshlar ═══
  for (const def of MOONS) {
    const parentMeta = PLANETS_META.find((p) => p.body === def.parentBody);
    if (!parentMeta) continue;

    const moonGeom = new THREE.SphereGeometry(def.radius, 16, 12);
    memory.addGeometry(moonGeom.attributes.position.count, moonGeom.index?.count ?? 0);

    const mesh = new THREE.Mesh(
      moonGeom,
      new THREE.MeshPhongMaterial({ color: def.color, shininess: 3 }),
    );
    group.add(mesh);

    moonInstances.push({ mesh, def, parentRadius: parentMeta.radius });
  }

  // ═══ Update ═══
  function update(date: Date) {
    const time = MakeTime(date);

    sun.update(1 / 60);

    for (const inst of instances) {
      const v = HelioVector(inst.meta.body, time);
      const x = v.x * AU_SCALE;
      const y = v.z * AU_SCALE;
      const z = -v.y * AU_SCALE;
      inst.mesh.position.set(x, y, z);
      inst.mesh.rotation.y += 0.01;
      if (inst.ring) inst.ring.position.set(x, y, z);
      if (inst.atmosphere) inst.atmosphere.position.set(x, y, z);
    }

    if (earthMesh) {
      earthClouds.position.copy(earthMesh.position);
      earthClouds.rotation.y += 0.006;

      const sunDir = earthMesh.position.clone().negate().normalize();
      earthUniforms.sunDirection.value.copy(sunDir);

      const mv = GeoMoon(date);
      const dir = new THREE.Vector3(mv.x, mv.z, -mv.y).normalize();
      earthMoon.position.copy(earthMesh.position).addScaledVector(dir, MOON_DISTANCE);
      earthMoon.rotation.y += 0.005;
    }

    const daysSinceJ2000 = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400_000;

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

  return { group, update, getPosition, getRadius, hitTest, sun };
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