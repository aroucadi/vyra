import crypto from "node:crypto";

export type ObservabilitySeverity = "INFO" | "WARNING" | "ERROR";

export interface StructuredAiEventInput {
  route: string;
  modelRequested: string;
  modelUsed: string;
  fallbackTriggered: boolean;
  authMode: string;
  latencyMs: number;
  status: number;
  tenantId?: string | null;
  severity?: ObservabilitySeverity;
  detail?: string;
}

export interface StructuredAiEventRecord {
  severity: ObservabilitySeverity;
  event: "vyra_ai_event";
  route: string;
  modelRequested: string;
  modelUsed: string;
  fallbackTriggered: boolean;
  authMode: string;
  latencyMs: number;
  status: number;
  tenantIdHash: string;
  timestamp: string;
  detail?: string;
}

/**
 * Produces a non-reversible 12-char hex digest of a tenant/user identifier
 * so Cloud Logging traces can correlate per-tenant behavior without exposing PII or emails.
 */
export function hashTenantIdentifier(tenantId?: string | null): string {
  const normalized = typeof tenantId === "string" ? tenantId.trim() : "";
  if (!normalized) return "anonymous";
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 12);
}

/**
 * Strips accidental base64 blobs, bearer tokens, or email-like strings from optional log detail strings.
 */
function sanitizeLogDetail(detail?: string): string | undefined {
  if (!detail) return undefined;
  const redacted = detail
    .replace(/data:[a-zA-Z0-9/+.-]+;base64,[A-Za-z0-9+/=]+/g, "[redacted_data_uri]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[redacted_email]")
    .replace(/[\r\n]+/g, " ")
    .trim();
  return redacted.slice(0, 160) || undefined;
}

/**
 * Emits a single-line JSON structured event compatible with Google Cloud Logging
 * on stdout at zero extra cost. Never logs PII, raw tokens, emails, or image bytes.
 */
export function logStructuredAiEvent(input: StructuredAiEventInput): StructuredAiEventRecord {
  const severity: ObservabilitySeverity =
    input.severity ||
    (input.status >= 500
      ? "ERROR"
      : input.status >= 400 || input.fallbackTriggered
      ? "WARNING"
      : "INFO");

  const record: StructuredAiEventRecord = {
    severity,
    event: "vyra_ai_event",
    route: input.route,
    modelRequested: input.modelRequested,
    modelUsed: input.modelUsed,
    fallbackTriggered: Boolean(input.fallbackTriggered),
    authMode: input.authMode,
    latencyMs: Math.max(0, Math.round(input.latencyMs)),
    status: input.status,
    tenantIdHash: hashTenantIdentifier(input.tenantId),
    timestamp: new Date().toISOString(),
  };

  const cleanDetail = sanitizeLogDetail(input.detail);
  if (cleanDetail) {
    record.detail = cleanDetail;
  }

  console.log(JSON.stringify(record));
  return record;
}
