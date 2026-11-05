"use server";

import {
  uploadEquipmentPhoto,
  isCloudStorageEnabled,
  getCloudStorageConfig,
  StorageUploadResult,
  UploadPhotoMetadata,
} from "@/lib/cloud-storage";

/**
 * Server Action for uploading equipment and machine photos.
 * 
 * When the cloud storage feature flag is OFF, it safely returns
 * { success: true, url: dataUri, isCloud: false, provider: "local_fallback" }.
 */
export async function uploadEquipmentPhotoAction(payload: {
  dataUri: string;
  traineeId: string;
  exerciseName: string;
  sessionId?: string;
}): Promise<StorageUploadResult> {
  const metadata: UploadPhotoMetadata = {
    traineeId: payload.traineeId,
    exerciseName: payload.exerciseName,
    sessionId: payload.sessionId,
  };

  return uploadEquipmentPhoto(payload.dataUri, metadata);
}

/**
 * Query cloud storage status and active provider (for client UI diagnostics or settings).
 */
export async function getCloudStorageStatusAction() {
  return {
    enabled: isCloudStorageEnabled(),
    config: getCloudStorageConfig(),
  };
}
