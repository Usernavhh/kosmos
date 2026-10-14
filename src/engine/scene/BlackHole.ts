import * as THREE from 'three';

export interface BlackHoleHandle {
  mesh: THREE.Mesh;
  update(camera: THREE.Camera): void;
  dispose(): void;
}

/**
 * Schwarzschild qora tuynuk — raymarching.
 * Faqat high/ultra presetda ishlatiladi (og'ir).
 */
export function createBlackHole(radius = 200000): BlackHoleHandle {
  const geometry = new THREE.PlaneGeometry(radius * 20, radius * 20);

  const uniforms = {
    uTime: { value: 0 },
    uCameraPos: { value: new THREE.Vector3() },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uBlackHolePos: { value: new THREE.Vector3() },
    uRs: { value: 1.0 }, // Schwarzschild radius (normalized)
    uDiskInner: { value: 2.6 },
    uDiskOuter: { value: 12.0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uTime;
      uniform vec3 uCameraPos;
      uniform vec2 uResolution;
      uniform vec3 uBlackHolePos;
      uniform float uRs;
      uniform float uDiskInner;
      uniform float uDiskOuter;

      varying vec3 vWorldPos;

      #define PI 3.14159265359
      #define MAX_STEPS 200
      #define ESCAPE_R 30.0

      // Soddalashtirilgan hash — yulduz foni uchun
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      // Yulduz foni — oddiy procedural
      vec3 starfield(vec3 dir) {
        vec3 c = vec3(0.0);
        // "Grid" yulduzlar
        for (int i = 0; i < 3; i++) {
          vec3 p = dir * (100.0 + float(i) * 80.0);
          vec3 f = floor(p);
          float h = hash(f);
          if (h > 0.985) {
            vec3 col = mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.9, 0.7), hash(f + 1.0));
            c += col * (h - 0.985) * 60.0;
          }
        }
        // Fon
        c += vec3(0.005, 0.008, 0.02);
        return c;
      }

      // Akkretsion disk rangi (harorat gradient)
      vec3 diskColor(float r, float phi) {
        float t = clamp((r - uDiskInner) / (uDiskOuter - uDiskInner), 0.0, 1.0);
        // Ichki qism issiq-oq, tashqi qism to'q-sariq
        vec3 hot = vec3(1.0, 0.95, 0.8);
        vec3 mid = vec3(1.0, 0.5, 0.1);
        vec3 cold = vec3(0.6, 0.15, 0.05);
        vec3 col = mix(hot, mix(mid, cold, t), t);
        // Doppler effekti (aylanuvchi disk)
        float doppler = 1.0 + 0.5 * sin(phi);
        return col * doppler;
      }

      void main() {
        // Ray origin (camera) va direction
        vec3 ro = uCameraPos - uBlackHolePos;
        vec3 rd = normalize(vWorldPos - uCameraPos);

        vec3 p = ro;
        vec3 v = rd;

        // Boshlang'ich burchak momentumi (r × v)²
        vec3 h = cross(p, v);
        float h2 = dot(h, h);

        vec3 col = vec3(0.0);
        bool captured = false;
        bool escaped = false;

        // Raymarching (Runge-Kutta emas, oddiy Euler)
        for (int i = 0; i < MAX_STEPS; i++) {
          float r = length(p);

          // Hodisa gorizonti ichida
          if (r < uRs) {
            captured = true;
            break;
          }

          // Qochib ketdi
          if (r > ESCAPE_R) {
            escaped = true;
            break;
          }

          // Qadam hajmi — kichik r da kichikroq
          float dt = clamp(r * 0.15, 0.05, 1.0);

          // Geodezik akseleratsiya (Schwarzschild yaqinlashuvi)
          vec3 a = -1.5 * h2 * p / pow(r, 5.0);

          // Yangi pozitsiya va tezlik
          vec3 newV = v + a * dt;
          vec3 newP = p + v * dt + 0.5 * a * dt * dt;

          // Disk kesib o'tishni tekshirish (y = 0 tekislik)
          if (p.y * newP.y < 0.0) {
            // Chiziqli interpolyatsiya
            float t = -p.y / (newP.y - p.y);
            vec3 hit = mix(p, newP, t);
            float hr = length(hit.xz);

            if (hr > uDiskInner && hr < uDiskOuter) {
              float phi = atan(hit.z, hit.x);
              // Disk balandligi bilan yumshoq o'tish
              float thickness = smoothstep(0.0, 0.5, abs(hit.y));
              col += diskColor(hr, phi) * (1.0 - thickness) * 2.0;
            }
          }

          p = newP;
          v = newV;
        }

        if (captured) {
          col = vec3(0.0); // qora
        } else if (escaped || !captured) {
          // Yulduz fonini qo'shish
          vec3 bg = starfield(normalize(v));
          // Gravitatsion linzalanish bilan birlashtirish
          col += bg * (1.0 - smoothstep(1.0, 3.0, length(p)));
        }

        // Yorqinlik chegarasi
        col = pow(col, vec3(0.85));

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;

  return {
    mesh,
    update(camera: THREE.Camera) {
      uniforms.uTime.value = performance.now() / 1000;
      uniforms.uCameraPos.value.copy(camera.position);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      // Mesh doim kameraga qaraydi (billboard)
      mesh.lookAt(camera.position);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}