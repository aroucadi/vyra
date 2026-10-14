import { NextRequest, NextResponse } from 'next/server';
import { searchExercises } from '@/lib/rag/exercise-search';
import { loadExerciseCatalogue } from '@/lib/rag/catalogue-loader';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const muscle = searchParams.get('muscle') || '';
    const equipment = searchParams.get('equipment') || '';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    let results = q ? searchExercises(q, { limit: 100 }) : loadExerciseCatalogue().exercises;

    if (muscle && muscle !== 'all') {
      const m = muscle.toLowerCase();
      results = results.filter(
        (ex) =>
          ex.target.toLowerCase().includes(m) ||
          ex.bodyPart.toLowerCase().includes(m) ||
          (ex.secondaryMuscles && ex.secondaryMuscles.some((sm) => sm.toLowerCase().includes(m)))
      );
    }

    if (equipment && equipment !== 'all') {
      const eq = equipment.toLowerCase();
      results = results.filter((ex) => ex.equipment.toLowerCase().includes(eq));
    }

    if (category && category !== 'all') {
      const cat = category.toLowerCase();
      results = results.filter((ex) => (ex.category || '').toLowerCase().includes(cat));
    }

    return NextResponse.json(
      {
        total: results.length,
        exercises: results.slice(0, Math.min(limit, 100)),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to search exercise catalogue', message: error?.message },
      { status: 500 }
    );
  }
}
