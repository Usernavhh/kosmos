/**
 * WebGPU va WebGL2 imkoniyatlarini aniqlash.
 */

export interface GPUFeatures {
  webgpu: boolean;
  webgpuAdapter: string | null;
  webgpuFeatures: string[];
  webgpuLimits: {
    maxBufferSize: number;
    maxComputeWorkgroupSize: number;
    maxStorageBufferBindingSize: number;
  } | null;
  webgl2: boolean;
  webglRenderer: string;
  webglVendor: string;
  webglMaxTextureSize: number;
  detectTimeMs: number;
}

let cached: GPUFeatures | null = null;

export async function detectGPUFeatures(): Promise<GPUFeatures> {
  if (cached) return cached;

  const t0 = performance.now();
  const features: GPUFeatures = {
    webgpu: false,
    webgpuAdapter: null,
    webgpuFeatures: [],
    webgpuLimits: null,
    webgl2: false,
    webglRenderer: 'unknown',
    webglVendor: 'unknown',
    webglMaxTextureSize: 0,
    detectTimeMs: 0,
  };

  // ═══ WebGL2 aniqlash ═══
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');

    if (gl) {
      features.webgl2 = true;

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        features.webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? 'unknown';
        features.webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) ?? 'unknown';
      } else {
        features.webglRenderer = gl.getParameter(gl.RENDERER) ?? 'unknown';
        features.webglVendor = gl.getParameter(gl.VENDOR) ?? 'unknown';
      }

      features.webglMaxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) ?? 0;
    }
  } catch (e) {
    console.warn('[gpu] WebGL2 xato:', e);
  }

  // ═══ WebGPU aniqlash ═══
  try {
    const nav = navigator as unknown as { gpu?: GPU };
    if (nav.gpu) {
      const adapter = await nav.gpu.requestAdapter({ powerPreference: 'high-performance' });

      if (adapter) {
        features.webgpu = true;

        // Adapter ma'lumotlari
        const info = (adapter as unknown as { info?: { vendor: string; architecture: string } }).info;
        if (info) {
          features.webgpuAdapter = `${info.vendor} ${info.architecture}`;
        } else {
          features.webgpuAdapter = 'WebGPU Adapter';
        }

        // Features ro'yxati
        features.webgpuFeatures = [...adapter.features] as string[];

        // Limits
        const limits = adapter.limits;
        features.webgpuLimits = {
          maxBufferSize: limits.maxBufferSize,
          maxComputeWorkgroupSize: limits.maxComputeWorkgroupSizeX ?? 256,
          maxStorageBufferBindingSize: limits.maxStorageBufferBindingSize,
        };

        console.log(
          `[gpu] ✅ WebGPU: ${features.webgpuAdapter}\n` +
          `       Features: ${features.webgpuFeatures.length}\n` +
          `       Max buffer: ${(limits.maxBufferSize / 1048576).toFixed(0)} MB\n` +
          `       Max storage: ${(limits.maxStorageBufferBindingSize / 1048576).toFixed(0)} MB`,
        );
      } else {
        console.log('[gpu] WebGPU yo`q — adapter topilmadi');
      }
    } else {
      console.log('[gpu] WebGPU yo`q — navigator.gpu mavjud emas');
    }
  } catch (e) {
    console.warn('[gpu] WebGPU xato:', e);
  }

  features.detectTimeMs = performance.now() - t0;

  console.log(
    `[gpu] WebGL2: ${features.webgl2 ? '✅' : '❌'} ${features.webglRenderer}\n` +
    `       Max texture: ${features.webglMaxTextureSize}px\n` +
    `       Aniqlash: ${features.detectTimeMs.toFixed(0)}ms`,
  );

  cached = features;
  return features;
}

export function getGPUFeatures(): GPUFeatures | null {
  return cached;
}

/**
 * WebGPU mavjud bo'lsa va kuchli bo'lsa — Extreme tavsiya.
 */
export function canRunExtreme(): boolean {
  if (!cached) return false;
  if (!cached.webgpu) return false;

  // Kamida 1 GB storage buffer
  const maxStorage = cached.webgpuLimits?.maxStorageBufferBindingSize ?? 0;
  if (maxStorage < 1024 * 1024 * 1024) return false;

  return true;
}