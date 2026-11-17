"use server";

import {
  uploadEquipmentPhoto,
  isCloudStorageEnabled,
  getCloudStorageConfig,
  StorageUploadResult,
  UploadPhotoMetadata,
} from "@/lib/cloud-storage";
import { appStore } from "@/lib/store";
import { getAuthenticatedSession, isAnonymousTraineeId } from "@/lib/auth/server-session";

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
  const session = await getAuthenticatedSession();
  if (!session && !appStore.isTestEnvironment() && !isAnonymousTraineeId(payload.traineeId)) {
    return {
      success: false,
      url: "",
      isCloud: false,
      provider: "local_fallback",
      error: "Authentication required to upload under a registered trainee profile.",
    };
  }

  const effectiveTraineeId = session ? session.uid : payload.traineeId;
  const metadata: UploadPhotoMetadata = {
    traineeId: effectiveTraineeId,
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
