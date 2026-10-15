import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Anonymous install UUID & event record validation
    const { eventName, installId, properties, timestamp } = body || {};

    if (!eventName || typeof eventName !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid eventName' }, { status: 400 });
    }

    // Scrub health, PII, and prototype injection before logging to stdout
    const sanitizedProps: Record<string, unknown> = Object.create(null);
    if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
      for (const [key, value] of Object.entries(properties)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        if (/password|email|token|secret|credit|weight|bmi|condition|injury|bodyweight/i.test(key)) {
          continue;
        }
        sanitizedProps[key] = value;
      }
    }

    const payload = {
      type: 'vyra_telemetry_event',
      eventName,
      installId: typeof installId === 'string' ? installId : 'anonymous',
      properties: sanitizedProps,
      timestamp: timestamp || new Date().toISOString(),
    };

    // Log one clean JSON line to stdout (Cloud Logging captures this automatically)
    console.log(JSON.stringify(payload));

    return NextResponse.json({ status: 'recorded' }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process telemetry event' }, { status: 400 });
  }
}
