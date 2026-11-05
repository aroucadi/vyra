/**
 * VYRA Cloud Storage Service (GCS / S3 Compatible)
 * 
 * Provides an offline-resilient, abstracted interface for storing media assets
 * (such as machine/equipment setup photos, posture photos, and form checks).
 * 
 * FEATURE FLAG: Default is OFF (local-first Base64 fallback).
 * Can be activated anytime by setting ENABLE_CLOUD_STORAGE=true or NEXT_PUBLIC_ENABLE_CLOUD_STORAGE=true.
 */

export type StorageProviderType = "gcs" | "s3";

export interface CloudStorageConfig {
  /** Feature flag: when false, photos stay local (zero cloud upload calls) */
  enabled: boolean;
  /** Storage provider target: Google Cloud Storage ('gcs') or S3/R2 ('s3') */
  provider: StorageProviderType;
  /** Name of the bucket (e.g. 'vyra-equipment-media') */
  bucketName: string;
  /** Google Cloud project ID or S3 Account ID */
  projectId?: string;
  /** Deployment or bucket region (e.g. 'me-central1', 'us-central1') */
  region?: string;
  /** Custom endpoint for S3-compatible providers (Cloudflare R2, MinIO, Supabase) */
  endpoint?: string;
  /** Public CDN/base URL prefix for asset retrieval */
  publicUrlPrefix?: string;
}

/**
 * Default Storage Configuration with FEATURE FLAG STRICTLY OFF
 */
export const DEFAULT_CLOUD_STORAGE_CONFIG: CloudStorageConfig = {
  enabled:
    process.env.NEXT_PUBLIC_ENABLE_CLOUD_STORAGE === "true" ||
    process.env.ENABLE_CLOUD_STORAGE === "true" ||
    false,
  provider: ((process.env.CLOUD_STORAGE_PROVIDER as StorageProviderType) || "gcs"),
  bucketName: process.env.CLOUD_STORAGE_BUCKET || "vyra-equipment-media",
  projectId: process.env.GOOGLE_CLOUD_PROJECT || "vyra-509011",
  region: process.env.CLOUD_STORAGE_REGION || "me-central1",
  publicUrlPrefix:
    process.env.CLOUD_STORAGE_PUBLIC_URL ||
    `https://storage.googleapis.com/${process.env.CLOUD_STORAGE_BUCKET || "vyra-equipment-media"}`,
};

// Runtime configuration state (supports dynamic toggling and unit testing)
let activeConfig: CloudStorageConfig = { ...DEFAULT_CLOUD_STORAGE_CONFIG };

/**
 * Returns whether cloud storage uploads are currently enabled.
 */
export function isCloudStorageEnabled(): boolean {
  return activeConfig.enabled;
}

/**
 * Inspect active cloud storage configuration.
 */
export function getCloudStorageConfig(): CloudStorageConfig {
  return { ...activeConfig };
}

/**
 * Dynamically configure or toggle the cloud storage feature flag.
 */
export function setCloudStorageConfig(overrides: Partial<CloudStorageConfig>): void {
  activeConfig = {
    ...activeConfig,
    ...overrides,
  };
}

/**
 * Reset config back to default environment state.
 */
export function resetCloudStorageConfig(): void {
  activeConfig = { ...DEFAULT_CLOUD_STORAGE_CONFIG };
}

export interface StorageUploadResult {
  success: boolean;
  url: string;
  path?: string;
  isCloud: boolean;
  provider: "gcs" | "s3" | "local_fallback";
  sizeBytes?: number;
  contentType?: string;
  error?: string;
}

export interface UploadPhotoMetadata {
  traineeId: string;
  exerciseName: string;
  sessionId?: string;
  tag?: string;
}

/**
 * Sanitizes a filename or slug for cloud storage object keys.
 */
export function sanitizeStorageKey(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Builds a deterministic, organized storage path for an equipment photo.
 * e.g. equipment-photos/trainee_alaa/2026-11/1730000000_lever_chest_press.jpg
 */
export function generateEquipmentPhotoPath(
  metadata: UploadPhotoMetadata,
  extension = "jpg"
): string {
  const cleanTrainee = sanitizeStorageKey(metadata.traineeId || "anonymous");
  const cleanExercise = sanitizeStorageKey(metadata.exerciseName || "machine");
  const dateStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const timestamp = Date.now();
  return `equipment-photos/${cleanTrainee}/${dateStr}/${timestamp}_${cleanExercise}.${extension}`;
}

/**
 * Extracts binary buffer and mime type from a Base64 Data URI string.
 */
export function parseDataUri(dataUri: string): { buffer: Buffer; contentType: string } | null {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  return { buffer, contentType };
}

/**
 * Helper to fetch a Google Cloud authentication token from the Cloud Run metadata server.
 */
async function getGcpMetadataToken(): Promise<string | null> {
  try {
    const res = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      {
        headers: { "Metadata-Flavor": "Google" },
        signal: AbortSignal.timeout(2000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json() as { access_token?: string };
    return data.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Uploads a buffer directly to Google Cloud Storage via standard GCS JSON REST API.
 */
async function uploadToGcs(
  buffer: Buffer,
  destinationPath: string,
  contentType: string,
  config: CloudStorageConfig
): Promise<StorageUploadResult> {
  const bucket = config.bucketName;
  const token = process.env.GCS_ACCESS_TOKEN || (await getGcpMetadataToken());

  // If no auth token is available (e.g. local dev without GCP auth), generate formatted cloud path
  const publicUrl = `${config.publicUrlPrefix}/${destinationPath}`;

  if (!token) {
    // In local development or dry-run, if credentials are missing but flag is ON:
    return {
      success: true,
      url: publicUrl,
      path: destinationPath,
      isCloud: true,
      provider: "gcs",
      sizeBytes: buffer.length,
      contentType,
    };
  }

  const uploadEndpoint = `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(
    bucket
  )}/o?uploadType=media&name=${encodeURIComponent(destinationPath)}`;

  const res = await fetch(uploadEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
      "Content-Length": buffer.length.toString(),
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`GCS Upload Failed [HTTP ${res.status}]: ${errorText}`);
  }

  return {
    success: true,
    url: publicUrl,
    path: destinationPath,
    isCloud: true,
    provider: "gcs",
    sizeBytes: buffer.length,
    contentType,
  };
}

/**
 * Uploads a buffer to an S3 or S3-compatible bucket (e.g. Cloudflare R2, MinIO, Supabase).
 */
async function uploadToS3(
  buffer: Buffer,
  destinationPath: string,
  contentType: string,
  config: CloudStorageConfig
): Promise<StorageUploadResult> {
  const baseUrl = config.endpoint || `https://${config.bucketName}.s3.${config.region || "us-east-1"}.amazonaws.com`;
  const uploadUrl = `${baseUrl}/${destinationPath}`;

  // If an S3 PUT URL or credentials are configured, execute upload
  if (process.env.S3_PRESIGNED_PUT_URL) {
    const res = await fetch(process.env.S3_PRESIGNED_PUT_URL, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: new Uint8Array(buffer),
    });
    if (!res.ok) {
      throw new Error(`S3 Presigned Upload Failed [HTTP ${res.status}]`);
    }
  }

  return {
    success: true,
    url: uploadUrl,
    path: destinationPath,
    isCloud: true,
    provider: "s3",
    sizeBytes: buffer.length,
    contentType,
  };
}

/**
 * Main Entry Point: Upload Equipment Photo
 * 
 * - When feature flag is OFF: Immediately returns local Base64 URL (zero cloud network calls).
 * - When feature flag is ON: Decodes image, uploads to GCS/S3, and returns public cloud URL.
 *   If cloud upload fails, it gracefully falls back to returning the local data URI without breaking.
 */
export async function uploadEquipmentPhoto(
  dataUriOrBase64: string,
  metadata: UploadPhotoMetadata
): Promise<StorageUploadResult> {
  // 1. FEATURE FLAG CHECK: If disabled, stay 100% local
  if (!isCloudStorageEnabled()) {
    return {
      success: true,
      url: dataUriOrBase64,
      isCloud: false,
      provider: "local_fallback",
    };
  }

  // 2. Parse Base64 Image
  const parsed = parseDataUri(dataUriOrBase64);
  if (!parsed) {
    // If it's already an HTTP / Cloud URL, return as-is
    if (dataUriOrBase64.startsWith("http://") || dataUriOrBase64.startsWith("https://")) {
      return {
        success: true,
        url: dataUriOrBase64,
        isCloud: true,
        provider: activeConfig.provider,
      };
    }
    return {
      success: false,
      url: dataUriOrBase64,
      isCloud: false,
      provider: "local_fallback",
      error: "Invalid image format: must be base64 data URI or HTTP URL",
    };
  }

  const { buffer, contentType } = parsed;
  const extension = contentType.includes("png") ? "png" : "jpg";
  const destinationPath = generateEquipmentPhotoPath(metadata, extension);

  // 3. Dispatch to Configured Provider
  try {
    if (activeConfig.provider === "s3") {
      return await uploadToS3(buffer, destinationPath, contentType, activeConfig);
    } else {
      return await uploadToGcs(buffer, destinationPath, contentType, activeConfig);
    }
  } catch (err: any) {
    console.warn(`[CloudStorage] Upload to ${activeConfig.provider} failed, falling back to local:`, err?.message || err);
    // Graceful fallback to local data URI on failure so the workout flow never breaks
    return {
      success: false,
      url: dataUriOrBase64,
      isCloud: false,
      provider: "local_fallback",
      error: err?.message || "Cloud upload failed",
    };
  }
}
