import * as THREE from 'three';

/**
 * Warp / streak effekti.
 * Turbo paytida yulduzlar radial cho'ziladi (Star Trek uslubi).
 */
export class StarStreaks {
  private material: THREE.ShaderMaterial;
  private uWarp: { value: number };
  private uDirection: { value: THREE.Vector3 };

  constructor(points: THREE.Points) {
    const originalMaterial = points.material as THREE.PointsMaterial;

    this.uWarp = { value: 0 };
    this.uDirection = { value: new THREE.Vector3(0, 0, -1) };

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uWarp: this.uWarp,
        uDirection: this.uDirection,
        uSize: { value: originalMaterial.size ?? 1.8 },
        uPixelRatio: { value: window.devicePixelRatio },
      },
      vertexShader: `
        attribute vec3 color;
        varying vec3 vColor;
        varying float vWarp;
        uniform float uWarp;
        uniform float uSize;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vWarp = uWarp;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          // Turbo paytida nuqta kattalashadi
          float scale = uSize * (1.0 + uWarp * 6.0) * uPixelRatio;
          gl_PointSize = scale * (400.0 / -mvPosition.z);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec3 vColor;
        varying float vWarp;

        void main() {
          // Point koordinatasi: -0.5 .. +0.5
          vec2 uv = gl_PointCoord - 0.5;
          float dist = length(uv);

          // Oddiy yulduz: dumaloq gradient
          float core = 1.0 - smoothstep(0.0, 0.5, dist);

          // Warp paytida: radial streak (gorizontal cho'zish)
          float streak = 0.0;
          if (vWarp > 0.05) {
            // Y yupqaroq, X kengroq
            vec2 stretchedUv = vec2(uv.x / (1.0 + vWarp * 3.0), uv.y * 3.0);
            streak = (1.0 - smoothstep(0.0, 0.5, length(stretchedUv))) * vWarp;
          }

          float alpha = max(core, streak);
          alpha = pow(alpha, 1.5);

          // Warp paytida ko'kroq (Star Trek uslubi)
          vec3 warpColor = mix(vColor, vec3(0.5, 0.7, 1.0), vWarp * 0.5);

          gl_FragColor = vec4(warpColor * alpha, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    points.material = this.material;
  }

  /**
   * Turbo multiplier asosida warp kuchini belgilash.
   * @param turboMult Turbo ko'paytiruvchi (1 = off, 10000 = max)
   * @param cameraDirection Kamera qarash yo'nalishi
   */
  update(turboMult: number, cameraDirection: THREE.Vector3) {
    // log10(1) = 0 → 0
    // log10(1000) = 3 → 1.0 (max)
    const warp = Math.max(0, Math.min(1, Math.log10(Math.max(turboMult, 1)) / 3));
    this.uWarp.value = warp;
    this.uDirection.value.copy(cameraDirection);
  }

  getMaterial(): THREE.ShaderMaterial {
    return this.material;
  }
}