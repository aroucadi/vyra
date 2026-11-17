import { NextRequest, NextResponse } from 'next/server';
import { appStore } from '@/lib/store';
import { getAuthenticatedSession } from '@/lib/auth/server-session';
import { checkRateLimit, resolveRateLimitKey } from '@/lib/auth/rate-limit';
import { loadBootstrapForUser } from '@/lib/firebase/firestore-repository';
import {
  TEMPLATES,
  computeBalance,
  TemplateDefinition,
} from '@/lib/training-math/structural-balance';
import { searchExercises } from '@/lib/rag/exercise-search';
import type { BodyMetricEntry, WorkoutSession } from '@/lib/types';

export const dynamic = 'force-dynamic';

function buildPostureResponse(params: {
  rawTemplateKey: string;
  sessions: WorkoutSession[];
  metrics: BodyMetricEntry[];
}) {
  const key = params.rawTemplateKey.toLowerCase().trim();
  const activeTemplate: TemplateDefinition =
    Object.prototype.hasOwnProperty.call(TEMPLATES, key)
      ? TEMPLATES[key]
      : TEMPLATES.poliquin;

  const latestBw = params.metrics.length
    ? params.metrics[params.metrics.length - 1].weightKg
    : 80;

  const mappedWorkouts = params.sessions.map((s) => ({
    d: s.date,
    start: new Date(s.startedAt).getTime(),
    bw: latestBw,
    entries: (s.setLogs || []).map((log) => {
      let canonicalId = log.exercisePrescriptionId;
      if (log.exerciseName) {
        const match = searchExercises(log.exerciseName, { limit: 1 });
        if (match && match.length > 0) {
          canonicalId = match[0].id;
        }
      }
      return {
        id: canonicalId,
        prescriptionId: log.exercisePrescriptionId,
        sets: [
          {
            done: true,
            w: log.weightKg,
            r: log.reps,
          },
        ],
      };
    }),
  }));

  const evaluationContext = {
    unit: 'kg',
    bodyweight: [{ d: new Date().toISOString().split('T')[0], w: latestBw }],
    workouts: mappedWorkouts,
  };

  const results = computeBalance(evaluationContext, activeTemplate);

  const labels: Record<string, string> = {};
  activeTemplate.roles.forEach((r) => {
    labels[r.id] = r.label;
  });

  return NextResponse.json(
    {
      template: activeTemplate.id,
      templateLabel: activeTemplate.label,
      results,
      labels,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawTemplateKey = searchParams.get('template') || 'poliquin';

    const authSession = await getAuthenticatedSession(req);
    const fallbackUid = authSession
      ? authSession.uid
      : appStore.isTestEnvironment()
        ? appStore.getCurrentUser().id
        : 'anon_visitor';
    let sessions = appStore.getSessions(fallbackUid);
    let metrics = appStore.getMetrics(fallbackUid);

    if (authSession) {
      try {
        const boot = await loadBootstrapForUser({
          uid: authSession.uid,
          email: authSession.email,
          displayName: authSession.name,
        });
        sessions = boot.sessions;
        metrics = boot.metrics;
      } catch {
        // Fallback to tenant-scoped store metrics/sessions
      }
    }

    return buildPostureResponse({ rawTemplateKey, sessions, metrics });
  } catch {
    return NextResponse.json(
      { error: 'Failed to compute structural balance' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(resolveRateLimitKey(req, 'posture-balance'), {
      maxRequests: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many posture balance requests' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    let body: {
      template?: unknown;
      sessions?: unknown;
      metrics?: unknown;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    const rawTemplateKey =
      typeof body?.template === 'string' ? body.template : 'poliquin';
    const authSession = await getAuthenticatedSession(req);
    const fallbackUid = authSession
      ? authSession.uid
      : appStore.isTestEnvironment()
        ? appStore.getCurrentUser().id
        : 'anon_visitor';

    let sessions = Array.isArray(body?.sessions)
      ? (body.sessions.slice(-100) as WorkoutSession[])
      : appStore.getSessions(fallbackUid);
    let metrics = Array.isArray(body?.metrics)
      ? (body.metrics.slice(-100) as BodyMetricEntry[])
      : appStore.getMetrics(fallbackUid);

    if (
      authSession &&
      !Array.isArray(body?.sessions) &&
      !Array.isArray(body?.metrics)
    ) {
      try {
        const boot = await loadBootstrapForUser({
          uid: authSession.uid,
          email: authSession.email,
          displayName: authSession.name,
        });
        sessions = boot.sessions;
        metrics = boot.metrics;
      } catch {
        // Fallback cleanly to store data
      }
    }

    return buildPostureResponse({ rawTemplateKey, sessions, metrics });
  } catch {
    return NextResponse.json(
      { error: 'Failed to compute structural balance' },
      { status: 500 }
    );
  }
}
