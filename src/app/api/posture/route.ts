import { NextRequest, NextResponse } from 'next/server';
import { appStore } from '@/lib/store';
import {
  TEMPLATES,
  computeBalance,
  TemplateDefinition,
} from '@/lib/training-math/structural-balance';

import { searchExercises } from '@/lib/rag/exercise-search';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templateKey = searchParams.get('template') || 'poliquin';
    const activeTemplate: TemplateDefinition =
      TEMPLATES[templateKey] || TEMPLATES.poliquin;

    const currentUser = appStore.getCurrentUser();
    const sessions = appStore.getSessions(currentUser.id);
    const metrics = appStore.getMetrics(currentUser.id);
    const latestBw = metrics.length ? metrics[metrics.length - 1].weightKg : 80;

    const mappedWorkouts = sessions.map((s) => ({
      d: s.date,
      start: new Date(s.startedAt).getTime(),
      bw: latestBw,
      entries: s.setLogs.map((log) => {
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
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to compute structural balance', message: error?.message },
      { status: 500 }
    );
  }
}
