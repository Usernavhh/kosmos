import * as THREE from 'three';
import type { PresetConfig } from '../core/QualityManager';
import type { MemoryTracker } from '../core/MemoryTracker';

export interface SunHandle {
  group: THREE.Group;
  update(dt: number): void;
  dispose(): void;
}

const SUN_RADIUS = 800;

/**
 * Haqiqiy Quyosh — proceduraviy shader bilan.
 * Granulyatsiya, korona, portlashlar (shader presetlar bo'yicha).
 */
export function createSun(config: PresetConfig, memory?: MemoryTracker): SunHandle {
  const group = new THREE.Group();

  // Ixtiyoriy: 4K Quyosh teksturasi (basic shader uchun)
  let sunTexture: THREE.Texture | null = null;
  if (config.sunShader === 'basic') {
    const loader = new THREE.TextureLoader();
    const sizeFolder = config.textureSize.toString();
    sunTexture = loader.load(`/textures/${sizeFolder}/sun.jpg`);
    sunTexture.colorSpace = THREE.SRGBColorSpace;
    if (memory) memory.addTexture(config.textureSize, config.textureSize / 2, true);
  }

  // ═══════════════════════════════════════
  // Yadro — asosiy sfera
  // ═══════════════════════════════════════
  const coreGeom = new THREE.SphereGeometry(SUN_RADIUS, 64, 48);

  const coreUniforms = {
    uTime: { value: 0 },
    uGranulation: { value: config.sunGranulation ? 1.0 : 0.0 },
    uNoiseScale: { value: 4.0 },
  };

  // Basic rejim — tekstura bilan oddiy material
  const basicMat = sunTexture
    ? new THREE.MeshBasicMaterial({ map: sunTexture })
    : new THREE.MeshBasicMaterial({ color: 0xffcc44 });

  const coreMat = config.sunShader === 'basic'
    ? basicMat
    : new THREE.ShaderMaterial({
        uniforms: coreUniforms,
        vertexShader: `
          varying vec3 vPos;
          varying vec3 vNormal;
          void main() {
            vPos = position;
            vNormal = normal;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
      precision highp float;
      uniform float uTime;
      uniform float uGranulation;
      uniform float uNoiseScale;

      varying vec3 vPos;
      varying vec3 vNormal;

      // 3D noise (iq)
      vec3 hash33(vec3 p) {
        p = fract(p * vec3(0.1031, 0.1030, 0.0973));
        p += dot(p, p.yxz + 33.33);
        return fract((p.xxy + p.yxx) * p.zyx);
      }

      float noise3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(
            dot(hash33(i + vec3(0,0,0)) - 0.5, f - vec3(0,0,0)),
            dot(hash33(i + vec3(1,0,0)) - 0.5, f - vec3(1,0,0)), u.x),
          mix(dot(hash33(i + vec3(0,1,0)) - 0.5, f - vec3(0,1,0)),
            dot(hash33(i + vec3(1,1,0)) - 0.5, f - vec3(1,1,0)), u.x), u.y),
          mix(mix(
            dot(hash33(i + vec3(0,0,1)) - 0.5, f - vec3(0,0,1)),
            dot(hash33(i + vec3(1,0,1)) - 0.5, f - vec3(1,0,1)), u.x),
          mix(dot(hash33(i + vec3(0,1,1)) - 0.5, f - vec3(0,1,1)),
            dot(hash33(i + vec3(1,1,1)) - 0.5, f - vec3(1,1,1)), u.x), u.y),
        u.z);
      }

      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 6; i++) {
          v += a * noise3(p);
          p *= 2.03;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        // Granulyatsiya — proceduraviy shovqin
        float gran = fbm(vPos * uNoiseScale * 0.01 + uTime * 0.1);
        float granules = smoothstep(0.0, 1.0, gran * 0.5 + 0.5);

        // Asosiy rang — oqdan to'q sariq
        vec3 hot = vec3(1.0, 0.98, 0.85);
        vec3 mid = vec3(1.0, 0.75, 0.3);
        vec3 dark = vec3(0.9, 0.4, 0.05);

        vec3 color = mix(dark, mid, granules);
        color = mix(color, hot, pow(granules, 2.0) * 0.5);

        // Limb darkening (chetlari to'qroq)
        vec3 viewDir = normalize(cameraPosition - vPos);
        float ndv = dot(normalize(vNormal), viewDir);
        float limb = pow(max(ndv, 0.0), 0.4);
        color *= mix(0.55, 1.0, limb);

        // Granulation o'chirilgan bo'lsa — tekis
        color = mix(vec3(1.0, 0.85, 0.4), color, uGranulation);

        gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

  const core = new THREE.Mesh(coreGeom, coreMat as THREE.Material);
  group.add(core);

  // ═══════════════════════════════════════
  // Korona — tashqi yorug' qatlam
  // ═══════════════════════════════════════
  let coronaMesh: THREE.Mesh | null = null;
  const coronaUniforms = {
    uTime: { value: 0 },
    uIntensity: { value: 1.0 },
  };

  if (config.sunCorona) {
    const coronaGeom = new THREE.SphereGeometry(SUN_RADIUS * 1.25, 48, 32);
    const coronaMat = new THREE.ShaderMaterial({
      uniforms: coronaUniforms,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vNormal = normalize(mat3(modelMatrix) * normal);
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vWorldPos;

        void main() {
          // Fresnel-like chet effekti
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float fres = 1.0 - abs(dot(vNormal, viewDir));
          fres = pow(fres, 2.5);

          // Pulsatsiya
          float pulse = 0.85 + 0.15 * sin(uTime * 0.8);

          // Rang — sariq-to'q sariq gradient
          vec3 inner = vec3(1.0, 0.9, 0.5);
          vec3 outer = vec3(1.0, 0.5, 0.15);
          vec3 color = mix(inner, outer, fres);

          gl_FragColor = vec4(color, fres * 0.7 * pulse * uIntensity);
        }
      `,
    });

    coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
    group.add(coronaMesh);
  }

  // ═══════════════════════════════════════
  // Portlashlar (flares) — alohida sfera
  // ═══════════════════════════════════════
  let flaresMesh: THREE.Mesh | null = null;
  const flaresUniforms = {
    uTime: { value: 0 },
    uIntensity: { value: 1.0 },
  };

  if (config.sunFlares) {
    const flaresGeom = new THREE.SphereGeometry(SUN_RADIUS * 1.05, 64, 48);
    const flaresMat = new THREE.ShaderMaterial({
      uniforms: flaresUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      vertexShader: `
        varying vec3 vPos;
        varying vec3 vNormal;
        void main() {
          vPos = position;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform float uIntensity;
        varying vec3 vPos;
        varying vec3 vNormal;

        // 3D noise
        vec3 hash33(vec3 p) {
          p = fract(p * vec3(0.1031, 0.1030, 0.0973));
          p += dot(p, p.yxz + 33.33);
          return fract((p.xxy + p.yxx) * p.zyx);
        }
        float noise3(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          vec3 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(
              dot(hash33(i + vec3(0,0,0)) - 0.5, f),
              dot(hash33(i + vec3(1,0,0)) - 0.5, f - vec3(1,0,0)), u.x),
            mix(dot(hash33(i + vec3(0,1,0)) - 0.5, f - vec3(0,1,0)),
              dot(hash33(i + vec3(1,1,0)) - 0.5, f - vec3(1,1,0)), u.x), u.y),
            mix(mix(
              dot(hash33(i + vec3(0,0,1)) - 0.5, f - vec3(0,0,1)),
              dot(hash33(i + vec3(1,0,1)) - 0.5, f - vec3(1,0,1)), u.x),
            mix(dot(hash33(i + vec3(0,1,1)) - 0.5, f - vec3(0,1,1)),
              dot(hash33(i + vec3(1,1,1)) - 0.5, f - vec3(1,1,1)), u.x), u.y),
          u.z);
        }
        float fbm(vec3 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise3(p);
            p *= 2.03;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          // Portlashlar (flares) — katta shovqin
          float t = uTime * 0.3;
          float flares = fbm(vPos * 0.005 + vec3(t, t * 0.7, t * 0.5));
          flares = smoothstep(0.2, 0.8, flares);

          // Faqat ba'zi joylarda yorqin
          flares = pow(flares, 3.0);

          // Chet effekti (edge)
          vec3 viewDir = normalize(cameraPosition - vPos);
          float edge = 1.0 - abs(dot(normalize(vNormal), viewDir));
          edge = pow(edge, 1.2);

          vec3 color = vec3(1.0, 0.4, 0.1);
          float alpha = flares * edge * 0.85 * uIntensity;

          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    flaresMesh = new THREE.Mesh(flaresGeom, flaresMat);
    group.add(flaresMesh);
  }

  // ═══════════════════════════════════════
  // Yorug' glow — billboard sprite
  // ═══════════════════════════════════════
  const glowGeom = new THREE.SphereGeometry(SUN_RADIUS * 2.2, 32, 24);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffaa33,
    transparent: true,
    opacity: config.sunCorona ? 0.12 : 0.2,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeom, glowMat);
  group.add(glow);

  // ═══════════════════════════════════════
  // Nur — PointLight
  // ═══════════════════════════════════════
  const light = new THREE.PointLight(0xffffff, 2.5, 0, 0);
  group.add(light);

  // ═══════════════════════════════════════
  // Update
  // ═══════════════════════════════════════
  let elapsed = 0;

  return {
    group,
    update(dt: number) {
      elapsed += dt;
      if (config.sunShader === 'shader') {
        coreUniforms.uTime.value = elapsed;
      }
      core.rotation.y += dt * 0.02;

      if (coronaMesh) {
        coronaUniforms.uTime.value = elapsed;
        coronaMesh.rotation.y -= dt * 0.005;
      }

      if (flaresMesh) {
        flaresUniforms.uTime.value = elapsed;
        flaresMesh.rotation.y += dt * 0.015;
      }
    },
    dispose() {
      coreGeom.dispose();
      coreMat.dispose();
      if (coronaMesh) {
        coronaMesh.geometry.dispose();
        (coronaMesh.material as THREE.Material).dispose();
      }
      if (flaresMesh) {
        flaresMesh.geometry.dispose();
        (flaresMesh.material as THREE.Material).dispose();
      }
    },
  };
}