import { NextRequest, NextResponse } from "next/server";
import { resolveRouteTenantContext } from "@/lib/auth/server-session";
import { checkRateLimit, resolveRateLimitKey } from "@/lib/auth/rate-limit";
import {
  uploadEquipmentPhoto,
  isCloudStorageEnabled,
  getCloudStorageConfig,
} from "@/lib/cloud-storage";

const MAX_IMAGE_CHARS = 14 * 1024 * 1024;
const ALLOWED_UPLOAD_PREFIX =
  /^(https?:\/\/|data:image\/(jpeg|jpg|png|webp);base64,)/i;

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
    const rl = checkRateLimit(resolveRateLimitKey(req, "upload-equipment-photo"), {
      maxRequests: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many upload requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    let body: {
      imageBase64?: unknown;
      traineeId?: string;
      exerciseName?: string;
      sessionId?: string;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { imageBase64, traineeId, exerciseName, sessionId } = body || {};

    if (typeof imageBase64 !== "string" || imageBase64.trim().length === 0) {
      return NextResponse.json(
        { error: "imageBase64 must be a non-empty string" },
        { status: 400 }
      );
    }

    if (imageBase64.length > MAX_IMAGE_CHARS) {
      return NextResponse.json(
        { error: "Image payload exceeds maximum 10MB limit" },
        { status: 413 }
      );
    }

    if (!ALLOWED_UPLOAD_PREFIX.test(imageBase64)) {
      return NextResponse.json(
        {
          error:
            "Unsupported image format: expected data:image/(jpeg|jpg|png|webp);base64 or HTTP(S) URL",
        },
        { status: 400 }
      );
    }

    const tenant = await resolveRouteTenantContext(req, traineeId, {
      allowUnauthenticatedAnon: true,
      fallbackTraineeId: "anonymous",
    });
    if (!tenant.isAllowed) {
      return NextResponse.json(
        { error: tenant.error || "Unauthorized" },
        { status: tenant.statusCode || 401 }
      );
    }

    const result = await uploadEquipmentPhoto(imageBase64, {
      traineeId: tenant.effectiveTraineeId,
      exerciseName:
        typeof exerciseName === "string" && exerciseName.trim()
          ? exerciseName.slice(0, 120)
          : "machine",
      sessionId:
        typeof sessionId === "string" ? sessionId.slice(0, 120) : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to store equipment photo" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
