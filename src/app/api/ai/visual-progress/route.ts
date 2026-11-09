import { NextRequest, NextResponse } from "next/server";
import { appStore } from "@/lib/store";
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
} from "@/lib/ai/visual-progress";
import { WorkoutSession, BodyMetricEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUser = appStore.getCurrentUser();
    const traineeId = searchParams.get("traineeId") || currentUser.id;
    const poseParam = (searchParams.get("poseId") || "front_relaxed") as VisualPoseId;
    const poseId: VisualPoseId = STANDARDIZED_POSE_GUIDES[poseParam]
      ? poseParam
      : "front_relaxed";

    const snapshots = visualProgressStore.getSnapshots(traineeId, poseId);
    const sessions = appStore.getSessions(traineeId);
    const metrics = appStore.getMetrics(traineeId);

    let comparisonReport = null;
    if (snapshots.length >= 2) {
      comparisonReport = await analyzeVisualProgressEvolution({
        traineeId,
        snapshotA: snapshots[0],
        snapshotB: snapshots[snapshots.length - 1],
        sessions,
        metrics,
        traineeGoals: currentUser.goals,
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
  action?: "compare" | "capture" | "extract_metadata";
  traineeId?: string;
  poseId?: VisualPoseId;
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
    const traineeId = body.traineeId || currentUser.id;
    const poseParam = (body.poseId || "front_relaxed") as VisualPoseId;
    const poseId: VisualPoseId = STANDARDIZED_POSE_GUIDES[poseParam]
      ? poseParam
      : "front_relaxed";

    const sessions = Array.isArray(body.sessions)
      ? body.sessions
      : appStore.getSessions(traineeId);
    const metrics = Array.isArray(body.metrics)
      ? body.metrics
      : appStore.getMetrics(traineeId);

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

    // 1. Handle Photo Capture / Historical Import + Mandatory Privacy-First Face Anonymization
    if (body.action === "capture") {
      if (!body.rawImageDataUri) {
        return NextResponse.json(
          { ok: false, error: "rawImageDataUri is required for photo capture." },
          { status: 400 }
        );
      }

      const capturedSnapshot = await visualProgressStore.addAnonymizedSnapshot({
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
      });

      const allPoseSnapshots = visualProgressStore.getSnapshots(traineeId, poseId);
      const baselineSnapshot = allPoseSnapshots[0] || capturedSnapshot;

      const report = await analyzeVisualProgressEvolution({
        traineeId,
        snapshotA: baselineSnapshot,
        snapshotB: capturedSnapshot,
        sessions,
        metrics,
        traineeGoals: currentUser.goals,
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
