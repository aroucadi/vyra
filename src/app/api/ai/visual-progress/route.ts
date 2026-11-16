import { NextRequest, NextResponse } from "next/server";
import { appStore } from "@/lib/store";
import { resolveRouteTenantContext } from "@/lib/auth/server-session";
import {
  ensureFirestoreCoachBridgeRegistered,
  loadBootstrapForUser,
} from "@/lib/firebase/firestore-repository";
import {
  STANDARDIZED_POSE_GUIDES,
  VisualPoseId,
  VisualProgressSnapshot,
  visualProgressStore,
  anonymizeProgressPhoto,
  verifySnapshotPrivacyCompliance,
  analyzeVisualProgressEvolution,
  extractPhotoCaptureDateMetadata,
  resolveHistoricalPhotoPrefill,
  canTraineeUploadProgressPhotos,
} from "@/lib/ai/visual-progress";
import { WorkoutSession, BodyMetricEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUser = appStore.getCurrentUser();
    const requestedTraineeId = searchParams.get("traineeId");
    const tenant = await resolveRouteTenantContext(req, requestedTraineeId, {
      allowUnauthenticatedAnon: true,
      fallbackTraineeId: currentUser.id,
    });
    if (!tenant.isAllowed) {
      return NextResponse.json(
        { ok: false, error: tenant.error || "Unauthorized" },
        { status: tenant.statusCode || 401 }
      );
    }
    ensureFirestoreCoachBridgeRegistered();
    const traineeId = tenant.effectiveTraineeId;
    const poseParam = (searchParams.get("poseId") || "front_relaxed") as VisualPoseId;
    const poseId: VisualPoseId = STANDARDIZED_POSE_GUIDES[poseParam]
      ? poseParam
      : "front_relaxed";

    const snapshots = visualProgressStore.getSnapshots(traineeId, poseId);
    let sessions = appStore.getSessions(traineeId);
    let metrics = appStore.getMetrics(traineeId);
    let traineeGoals = currentUser.goals;

    if (tenant.session && sessions.length === 0 && metrics.length === 0) {
      try {
        const boot = await loadBootstrapForUser({
          uid: tenant.session.uid,
          email: tenant.session.email,
          displayName: tenant.session.name,
        });
        sessions = boot.sessions;
        metrics = boot.metrics;
        traineeGoals = boot.user.goals || traineeGoals;
      } catch {
        // Non-fatal fallback
      }
    }

    let comparisonReport = null;
    if (snapshots.length >= 2) {
      comparisonReport = await analyzeVisualProgressEvolution({
        traineeId,
        snapshotA: snapshots[0],
        snapshotB: snapshots[snapshots.length - 1],
        sessions,
        metrics,
        traineeGoals,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        traineeId,
        poseId,
        cadence: visualProgressStore.getCadence(),
        poseGuides: STANDARDIZED_POSE_GUIDES,
        snapshots,
        comparisonReport,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to load visual progress timeline.",
      },
      { status: 500 }
    );
  }
}

export interface VisualProgressPostRequestBody {
  action?: "compare" | "capture" | "extract_metadata" | "delete";
  traineeId?: string;
  poseId?: VisualPoseId;
  snapshotId?: string;
  snapshotAId?: string;
  snapshotBId?: string;
  snapshotA?: VisualProgressSnapshot;
  snapshotB?: VisualProgressSnapshot;
  /** Used when action === "capture" or "extract_metadata" */
  rawImageDataUri?: string;
  fileName?: string;
  fileLastModifiedMs?: number;
  milestoneLabel?: string;
  weekIndex?: number;
  date?: string;
  weightKg?: number;
  traineeNote?: string;
  programStartDate?: string;
  /** Explicit user confirmation when poseId === "back_relaxed" has no visible face */
  confirmNoFaceVisible?: boolean;
  /** Explicit user consent required before sending any image bytes to a cloud vision model */
  cloudVisionConsentGranted?: boolean;
  /** Optional explicit workout sessions & metrics override for testing/custom evaluation */
  sessions?: WorkoutSession[];
  metrics?: BodyMetricEntry[];
  /** Strict flag: if true and an un-anonymized snapshot is passed to compare, reject with 400 */
  enforceStrictPrivacyRejection?: boolean;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<VisualProgressPostRequestBody>;
    const currentUser = appStore.getCurrentUser();
    const tenant = await resolveRouteTenantContext(req, body.traineeId, {
      allowUnauthenticatedAnon: true,
      fallbackTraineeId: currentUser.id,
    });
    if (!tenant.isAllowed) {
      return NextResponse.json(
        { ok: false, error: tenant.error || "Unauthorized" },
        { status: tenant.statusCode || 401 }
      );
    }
    ensureFirestoreCoachBridgeRegistered();
    const traineeId = tenant.effectiveTraineeId;
    const poseParam = (body.poseId || "front_relaxed") as VisualPoseId;
    const poseId: VisualPoseId = STANDARDIZED_POSE_GUIDES[poseParam]
      ? poseParam
      : "front_relaxed";

    let sessions = Array.isArray(body.sessions)
      ? body.sessions
      : appStore.getSessions(traineeId);
    let metrics = Array.isArray(body.metrics)
      ? body.metrics
      : appStore.getMetrics(traineeId);
    let traineeGoals = currentUser.goals;

    if (
      tenant.session &&
      !Array.isArray(body.sessions) &&
      !Array.isArray(body.metrics) &&
      sessions.length === 0 &&
      metrics.length === 0
    ) {
      try {
        const boot = await loadBootstrapForUser({
          uid: tenant.session.uid,
          email: tenant.session.email,
          displayName: tenant.session.name,
        });
        sessions = boot.sessions;
        metrics = boot.metrics;
        traineeGoals = boot.user.goals || traineeGoals;
      } catch {
        // Non-fatal fallback
      }
    }

    // 0. Handle Photo Metadata Extraction & Historical Context Prefill (Before Anonymization)
    if (body.action === "extract_metadata") {
      const metadata = extractPhotoCaptureDateMetadata({
        rawImageDataUri: body.rawImageDataUri,
        fileName: body.fileName,
        fileLastModifiedMs: body.fileLastModifiedMs,
      });

      const resolvedDate =
        body.date ||
        metadata.detectedDate ||
        new Date().toISOString().split("T")[0];

      const prefill = resolveHistoricalPhotoPrefill({
        captureDate: resolvedDate,
        programStartDate: body.programStartDate,
        metrics,
        sessions,
      });

      return NextResponse.json(
        {
          ok: true,
          action: "extract_metadata",
          metadata,
          prefill,
        },
        { status: 200 }
      );
    }

    // 0A. Handle Snapshot Deletion (removes from store, localStorage, storage bucket, cached reports, and shadow logs)
    if (body.action === "delete") {
      if (!body.snapshotId) {
        return NextResponse.json(
          { ok: false, error: "snapshotId is required for deletion." },
          { status: 400 }
        );
      }
      const delResult = visualProgressStore.deleteSnapshot(body.snapshotId, traineeId);
      return NextResponse.json(
        {
          ok: true,
          action: "delete",
          snapshotId: body.snapshotId,
          deleted: delResult.deleted,
          remainingCount: delResult.remainingCount,
          receipt: delResult,
        },
        { status: 200 }
      );
    }

    // 1. Handle Photo Capture / Historical Import + Mandatory Fail-Closed Face Detection & Anonymization
    if (body.action === "capture") {
      const uploadGate = canTraineeUploadProgressPhotos(tenant.session?.email || traineeId);
      if (!uploadGate.allowed) {
        return NextResponse.json(
          {
            ok: false,
            error: uploadGate.reason,
          },
          { status: 403 }
        );
      }

      if (!body.rawImageDataUri) {
        return NextResponse.json(
          { ok: false, error: "rawImageDataUri is required for photo capture." },
          { status: 400 }
        );
      }

      let capturedSnapshot: VisualProgressSnapshot;
      try {
        capturedSnapshot = await visualProgressStore.addAnonymizedSnapshot({
          traineeId,
          poseId,
          rawImageDataUri: body.rawImageDataUri,
          milestoneLabel: body.milestoneLabel,
          weekIndex: body.weekIndex,
          date: body.date,
          weightKg: body.weightKg,
          traineeNote: body.traineeNote,
          fileName: body.fileName,
          fileLastModifiedMs: body.fileLastModifiedMs,
          programStartDate: body.programStartDate,
          metrics,
          sessions,
          confirmNoFaceVisible: body.confirmNoFaceVisible,
        });
      } catch (captureErr: any) {
        return NextResponse.json(
          {
            ok: false,
            error:
              captureErr?.message ||
              "Face detection failed closed. Please retake the photo.",
          },
          { status: 400 }
        );
      }

      const allPoseSnapshots = visualProgressStore.getSnapshots(traineeId, poseId);
      const baselineSnapshot = allPoseSnapshots[0] || capturedSnapshot;

      const report = await analyzeVisualProgressEvolution({
        traineeId,
        snapshotA: baselineSnapshot,
        snapshotB: capturedSnapshot,
        sessions,
        metrics,
        traineeGoals,
        cloudVisionConsentGranted: body.cloudVisionConsentGranted,
      });

      return NextResponse.json(
        {
          ok: true,
          action: "capture",
          capturedSnapshot,
          snapshots: allPoseSnapshots,
          comparisonReport: report,
        },
        { status: 200 }
      );
    }

    // 2. Handle Side-by-Side Milestone Comparison
    const allPoseSnapshots = visualProgressStore.getSnapshots(traineeId, poseId);
    let snapA: VisualProgressSnapshot | undefined = body.snapshotA;
    let snapB: VisualProgressSnapshot | undefined = body.snapshotB;

    if (!snapA && body.snapshotAId) {
      snapA = allPoseSnapshots.find((s) => s.id === body.snapshotAId);
    }
    if (!snapB && body.snapshotBId) {
      snapB = allPoseSnapshots.find((s) => s.id === body.snapshotBId);
    }

    if (!snapA) snapA = allPoseSnapshots[0];
    if (!snapB) snapB = allPoseSnapshots[allPoseSnapshots.length - 1];

    if (!snapA || !snapB) {
      return NextResponse.json(
        { ok: false, error: "Two valid snapshots are required for visual comparison." },
        { status: 400 }
      );
    }

    // Privacy Gate Check: Ensure faces are anonymized before AI analysis
    const checkA = verifySnapshotPrivacyCompliance(snapA);
    const checkB = verifySnapshotPrivacyCompliance(snapB);

    if (!checkA.compliant || !checkB.compliant) {
      if (body.enforceStrictPrivacyRejection) {
        return NextResponse.json(
          {
            ok: false,
            error: `Privacy Gate Blocked Request: ${checkA.reason || checkB.reason}`,
          },
          { status: 400 }
        );
      }

      // Auto-anonymize any un-anonymized snapshot before analysis
      if (!checkA.compliant) {
        const anonA = await anonymizeProgressPhoto({
          rawImageDataUri: snapA.anonymizedImageUrl,
          poseId: snapA.poseId,
          milestoneLabel: snapA.milestoneLabel,
          weightKg: snapA.weightKg,
        });
        snapA = {
          ...snapA,
          anonymizedImageUrl: anonA.anonymizedImageUrl,
          anonymization: anonA.proof,
        };
      }
      if (!checkB.compliant) {
        const anonB = await anonymizeProgressPhoto({
          rawImageDataUri: snapB.anonymizedImageUrl,
          poseId: snapB.poseId,
          milestoneLabel: snapB.milestoneLabel,
          weightKg: snapB.weightKg,
        });
        snapB = {
          ...snapB,
          anonymizedImageUrl: anonB.anonymizedImageUrl,
          anonymization: anonB.proof,
        };
      }
    }

    const comparisonReport = await analyzeVisualProgressEvolution({
      traineeId,
      snapshotA: snapA,
      snapshotB: snapB,
      sessions,
      metrics,
      traineeGoals: currentUser.goals,
      cloudVisionConsentGranted: body.cloudVisionConsentGranted,
    });

    return NextResponse.json(
      {
        ok: true,
        action: "compare",
        comparisonReport,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to analyze visual progress comparison.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const snapshotId = searchParams.get("snapshotId");
    const currentUser = appStore.getCurrentUser();
    const tenant = await resolveRouteTenantContext(req, searchParams.get("traineeId"), {
      allowUnauthenticatedAnon: true,
      fallbackTraineeId: currentUser.id,
    });
    if (!tenant.isAllowed) {
      return NextResponse.json(
        { ok: false, error: tenant.error || "Unauthorized" },
        { status: tenant.statusCode || 401 }
      );
    }
    ensureFirestoreCoachBridgeRegistered();
    const traineeId = tenant.effectiveTraineeId;

    if (!snapshotId) {
      return NextResponse.json(
        { ok: false, error: "snapshotId query parameter is required." },
        { status: 400 }
      );
    }

    const delResult = visualProgressStore.deleteSnapshot(snapshotId, traineeId);
    return NextResponse.json(
      {
        ok: true,
        snapshotId,
        deleted: delResult.deleted,
        remainingCount: delResult.remainingCount,
        receipt: delResult,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to delete snapshot." },
      { status: 500 }
    );
  }
}
