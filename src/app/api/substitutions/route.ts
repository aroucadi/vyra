import { NextRequest, NextResponse } from 'next/server';
import { loadExerciseCatalogue } from '@/lib/rag/catalogue-loader';
import { findBiomechanicalSubstitutes } from '@/lib/training-math/substitution-copilot';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name') || '';
    const target = searchParams.get('target') || '';
    const equipment = searchParams.get('equipment') || '';
    const category = searchParams.get('category') || undefined;
    const excludedParam = searchParams.get('excluded') || '';
    const preferredParam = searchParams.get('preferred') || '';
    const limit = Math.min(Number(searchParams.get('limit')) || 3, 10);

    if (!target && !name) {
      return NextResponse.json(
        { error: 'Missing required query parameters: "target" or "name"' },
        { status: 400 }
      );
    }

    const excludedEquipment = excludedParam
      ? excludedParam.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    const preferredEquipment = preferredParam
      ? preferredParam.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const catalogueResult = loadExerciseCatalogue();
    const substitutes = findBiomechanicalSubstitutes(
      { name, target, equipment, category },
      catalogueResult.exercises,
      { excludedEquipment, preferredEquipment, limit }
    );

    return NextResponse.json({
      success: true,
      source: { name, target, equipment },
      count: substitutes.length,
      substitutes,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal substitution copilot error',
      },
      { status: 500 }
    );
  }
}
