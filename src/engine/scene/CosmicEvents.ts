import * as THREE from 'three';

/**
 * Dinamik hodisalar: pulsar, supernova qoldig'i, quyosh tutilishi.
 */

export interface PulsarHandle {
  group: THREE.Group;
  update(dt: number): void;
}

export function createPulsar(): PulsarHandle {
  const group = new THREE.Group();

  // Neytron yulduz
  const neutronStar = new THREE.Mesh(
    new THREE.SphereGeometry(50000, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xaaddff }),
  );
  group.add(neutronStar);

  // Yorug' halo
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(120000, 24, 16),
    new THREE.MeshBasicMaterial({
      color: 0x88bbff,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  group.add(halo);

  // Ikkita nur (jet)
  const beamGeom = new THREE.ConeGeometry(80000, 800000, 16, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x88ddff,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const beam1 = new THREE.Mesh(beamGeom, beamMat);
  beam1.position.set(0, 400000, 0);
  group.add(beam1);

  const beam2 = new THREE.Mesh(beamGeom.clone(), beamMat.clone());
  beam2.position.set(0, -400000, 0);
  beam2.rotation.z = Math.PI;
  group.add(beam2);

  // Aylanish tez (millisekundlar)
  let angle = 0;

  return {
    group,
    update(dt: number) {
      // Pulsar 1 sekundda ~10 marta aylanadi (tezlashtirilgan)
      angle += dt * 30;
      group.rotation.z = angle;
      neutronStar.rotation.y = angle * 2;
    },
  };
}

// ═══════════════════════════════════════════
// Supernova qoldig'i
// ═══════════════════════════════════════════

export interface SupernovaHandle {
  group: THREE.Group;
  update(dt: number): void;
}

export function createSupernova(radius = 300000): SupernovaHandle {
  const group = new THREE.Group();
  const COUNT = 3000;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);

  for (let i = 0; i < COUNT; i++) {
    // Sferik qatlam ichida
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.85 + Math.random() * 0.15);

    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    // Ranglar — qizildan ko'kga
    const t = Math.random();
    if (t < 0.4) {
      // Qizil-oq
      colors[i * 3 + 0] = 1.0;
      colors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
      colors[i * 3 + 2] = 0.3 + Math.random() * 0.3;
    } else if (t < 0.75) {
      // Yashil-oq
      colors[i * 3 + 0] = 0.6 + Math.random() * 0.3;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 0.7 + Math.random() * 0.3;
    } else {
      // Ko'k
      colors[i * 3 + 0] = 0.3 + Math.random() * 0.3;
      colors[i * 3 + 1] = 0.6 + Math.random() * 0.3;
      colors[i * 3 + 2] = 1.0;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: radius * 0.01,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geom, mat);
  group.add(points);

  let time = 0;

  return {
    group,
    update(dt: number) {
      time += dt;
      // Sekin pulsatsiya va aylanish
      const pulse = 1 + Math.sin(time * 0.5) * 0.05;
      points.scale.setScalar(pulse);
      points.rotation.y += dt * 0.05;
    },
  };
}

// ═══════════════════════════════════════════
// Quyosh tutilishi (kompyuter animatsiyasi)
// ═══════════════════════════════════════════

export interface EclipseHandle {
  group: THREE.Group;
  trigger(): void;
  update(dt: number, camera: THREE.Camera): void;
}

export function createEclipse(sunPosition: THREE.Vector3): EclipseHandle {
  const group = new THREE.Group();
  group.position.copy(sunPosition);

  // Qora disk — quyosh oldiga tushadi
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(820, 64),
    new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }),
  );
  group.add(disc);

  // Korona — tutilish vaqtida ko'rinadigan yorug' halqa
  const corona = new THREE.Mesh(
    new THREE.RingGeometry(820, 1000, 64),
    new THREE.MeshBasicMaterial({
      color: 0xffcc66,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  group.add(corona);

  let progress = 0;
  let active = false;

  return {
    group,
    trigger() {
      progress = 0;
      active = true;
      disc.visible = true;
      corona.material.opacity = 0;
    },
    update(dt: number, camera: THREE.Camera) {
      if (!active) return;
      progress += dt;
      // 8 sekund davomida tutilish
      const t = Math.min(1, progress / 8);
      // Burchak: 0 → 1 → 0 (vaqt o'tishi bilan)
      disc.scale.setScalar(t < 0.5 ? 1 : 1);

      // Korona yorqinligi — tutilish o'rtasida
      const coronaOpacity = Math.sin(t * Math.PI);
      corona.material.opacity = coronaOpacity * 0.8;
      corona.scale.setScalar(1 + coronaOpacity * 0.3);

      // Diskni kameraga qaratish
      group.lookAt(camera.position);

      if (t >= 1) {
        active = false;
        disc.visible = false;
        corona.material.opacity = 0;
      }
    },
  };
}