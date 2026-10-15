import * as THREE from 'three';
import { CITIES, type City } from '../../data/cities';

const EARTH_RADIUS = 150;
const ACTIVATE_DISTANCE = 400;
const DEACTIVATE_DISTANCE = 500;

export interface CityMarkersHandle {
  group: THREE.Group;
  update(camera: THREE.PerspectiveCamera, earthPosition: THREE.Vector3): void;
  dispose(): void;
}

interface MarkerEntry {
  mesh: THREE.Mesh;
  label: THREE.Sprite;
  city: City;
}

export function createCityMarkers(): CityMarkersHandle {
  const group = new THREE.Group();
  group.visible = false;

  const markers: MarkerEntry[] = [];

  for (const city of CITIES) {
    const lat = (city.lat * Math.PI) / 180;
    const lon = (city.lon * Math.PI) / 180;

    const r = EARTH_RADIUS * 1.01;
    const x = r * Math.cos(lat) * Math.cos(lon);
    const y = r * Math.sin(lat);
    const z = r * Math.cos(lat) * Math.sin(lon);

    // Nuqta
    const geom = new THREE.SphereGeometry(0.6, 8, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffcc44 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    group.add(mesh);

    // Label
    const label = makeCityLabel(city.nameUz);
    label.position.set(x, y, z);
    label.visible = false;
    group.add(label);

    markers.push({ mesh, label, city });
  }

  let active = false;
  const camDir = new THREE.Vector3();
  const markerWorld = new THREE.Vector3();
  const camToMarker = new THREE.Vector3();

  return {
    group,

    update(camera: THREE.PerspectiveCamera, earthPosition: THREE.Vector3) {
      const dist = camera.position.distanceTo(earthPosition);

      if (!active && dist < ACTIVATE_DISTANCE) {
        active = true;
        group.visible = true;
        console.log('[cities] Aktivlashtirildi');
      }
      if (active && dist > DEACTIVATE_DISTANCE) {
        active = false;
        group.visible = false;
        return;
      }
      if (!active) return;

      group.position.copy(earthPosition);
      camera.getWorldDirection(camDir);

      for (const m of markers) {
        markerWorld.copy(m.mesh.position).add(earthPosition);
        camToMarker.copy(markerWorld).sub(camera.position);
        const distToMarker = camToMarker.length();
        camToMarker.normalize();

        const dot = camToMarker.dot(camDir);
        const visible = distToMarker < 250 && dot > 0.4;
        m.label.visible = visible;
      }
    },

    dispose() {
      for (const m of markers) {
        m.mesh.geometry.dispose();
        (m.mesh.material as THREE.Material).dispose();
        if (m.label.material instanceof THREE.SpriteMaterial) {
          m.label.material.map?.dispose();
          m.label.material.dispose();
        }
      }
    },
  };
}

function makeCityLabel(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const fontSize = 28;
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;

  const metrics = ctx.measureText(text);
  const padding = 10;
  const width = Math.ceil(metrics.width) + padding * 2;
  const height = fontSize + padding * 2;

  canvas.width = width;
  canvas.height = height;

  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255, 204, 68, 0.95)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(mat);
  const aspect = width / height;
  sprite.scale.set(aspect * 3.5, 3.5, 1);

  return sprite;
}