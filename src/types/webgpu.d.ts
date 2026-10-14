interface GPURequestAdapterOptions {
  powerPreference?: 'low-power' | 'high-performance';
}

interface GPULimits {
  maxBufferSize: number;
  maxComputeWorkgroupSizeX?: number;
  maxStorageBufferBindingSize: number;
}

type GPUFeatureName = string;

interface GPUAdapter {
  readonly features: ReadonlySet<GPUFeatureName>;
  readonly limits: GPULimits;
}

interface GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
}

interface Navigator {
  gpu?: GPU;
}
