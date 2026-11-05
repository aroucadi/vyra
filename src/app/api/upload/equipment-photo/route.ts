import { NextRequest, NextResponse } from "next/server";
import {
  uploadEquipmentPhoto,
  isCloudStorageEnabled,
  getCloudStorageConfig,
} from "@/lib/cloud-storage";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    cloudStorageEnabled: isCloudStorageEnabled(),
    config: {
      provider: getCloudStorageConfig().provider,
      bucketName: getCloudStorageConfig().bucketName,
      region: getCloudStorageConfig().region,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, traineeId, exerciseName, sessionId } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    const result = await uploadEquipmentPhoto(imageBase64, {
      traineeId: traineeId || "anonymous",
      exerciseName: exerciseName || "machine",
      sessionId,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
