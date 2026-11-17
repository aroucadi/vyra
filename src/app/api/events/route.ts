import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, resolveRateLimitKey } from '@/lib/auth/rate-limit';

export const dynamic = 'force-dynamic';

const VALID_EVENT_NAME_RE = /^[a-zA-Z0-9_.:-]{1,64}$/;
const MAX_PROPERTIES_BYTES = 8192;

export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(resolveRateLimitKey(request, 'telemetry-events'), {
      maxRequests: 120,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many telemetry events' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    let body: {
      eventName?: unknown;
      installId?: unknown;
      properties?: unknown;
      timestamp?: unknown;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    // Anonymous install UUID & event record validation
    const { eventName, installId, properties, timestamp } = body || {};

    if (!eventName || typeof eventName !== 'string' || !VALID_EVENT_NAME_RE.test(eventName.trim())) {
      return NextResponse.json({ error: 'Missing or invalid eventName' }, { status: 400 });
    }

    // Scrub health, PII, and prototype injection before logging to stdout
    const sanitizedProps: Record<string, unknown> = Object.create(null);
    if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
      const propEntries = Object.entries(properties).slice(0, 32);
      for (const [key, value] of propEntries) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        if (/password|email|token|secret|credit|bmi|condition|injury|bodyweight|user_weight|trainee_weight/i.test(key)) {
          continue;
        }
        sanitizedProps[key.slice(0, 64)] =
          typeof value === 'string' ? value.slice(0, 256) : value;
      }
    }

    if (JSON.stringify(sanitizedProps).length > MAX_PROPERTIES_BYTES) {
      return NextResponse.json({ error: 'Telemetry properties exceed size limit' }, { status: 413 });
    }

    const payload = {
      type: 'vyra_telemetry_event',
      eventName: eventName.trim().slice(0, 64),
      installId:
        typeof installId === 'string' && installId.trim()
          ? installId.trim().slice(0, 128)
          : 'anonymous',
      properties: sanitizedProps,
      timestamp:
        typeof timestamp === 'string' && timestamp.length <= 40
          ? timestamp
          : new Date().toISOString(),
    };

    // Log one clean JSON line to stdout (Cloud Logging captures this automatically)
    console.log(JSON.stringify(payload));

    return NextResponse.json({ status: 'recorded' }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to process telemetry event' }, { status: 400 });
  }
}
