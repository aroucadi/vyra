import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hashTenantIdentifier,
  logStructuredAiEvent,
  StructuredAiEventInput,
} from "../../../src/lib/observability";

describe("Structured AI Observability Suite ($0 Cost Cloud Logging)", () => {
  it("generates deterministic non-reversible SHA-256 hash for tenant identifiers", () => {
    const hash1 = hashTenantIdentifier("trainee_alaa");
    const hash2 = hashTenantIdentifier("trainee_alaa");
    const hashAnon = hashTenantIdentifier(null);
    const hashEmpty = hashTenantIdentifier("   ");

    assert.equal(hash1, hash2, "Identical tenantId must produce identical hash");
    assert.equal(hash1.length, 12, "Hash must be truncated to 12 hex characters");
    assert.equal(hashAnon, "anonymous");
    assert.equal(hashEmpty, "anonymous");
    assert.notEqual(hash1, hashAnon);
  });

  it("emits structured single-line JSON log record and calculates accurate severity", () => {
    const originalConsoleLog = console.log;
    const capturedLogs: string[] = [];
    console.log = (msg: unknown) => {
      capturedLogs.push(String(msg));
    };

    try {
      const input: StructuredAiEventInput = {
        route: "/api/ai/coach",
        modelRequested: "gemini-4-argon",
        modelUsed: "gemini-4-argon",
        fallbackTriggered: false,
        authMode: "vertex_ai_service_account",
        latencyMs: 345,
        status: 200,
        tenantId: "trainee_123",
        detail: "User email user@example.com with token Bearer secret_123 and data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      };

      const record = logStructuredAiEvent(input);

      assert.equal(record.event, "vyra_ai_event");
      assert.equal(record.severity, "INFO");
      assert.equal(record.route, "/api/ai/coach");
      assert.equal(record.modelRequested, "gemini-4-argon");
      assert.equal(record.modelUsed, "gemini-4-argon");
      assert.equal(record.fallbackTriggered, false);
      assert.equal(record.authMode, "vertex_ai_service_account");
      assert.equal(record.latencyMs, 345);
      assert.equal(record.status, 200);
      assert.equal(record.tenantIdHash, hashTenantIdentifier("trainee_123"));
      assert.ok(record.timestamp);

      // Verify PII & credential scrubbing
      assert.ok(record.detail);
      assert.ok(!record.detail.includes("user@example.com"), "Email must be redacted");
      assert.ok(!record.detail.includes("secret_123"), "Bearer token must be redacted");
      assert.ok(!record.detail.includes("iVBORw0KGgo"), "Base64 data URI must be redacted");
      assert.ok(record.detail.includes("[redacted_email]"));
      assert.ok(record.detail.includes("[redacted_data_uri]"));

      assert.equal(capturedLogs.length, 1);
      const parsedOutput = JSON.parse(capturedLogs[0]);
      assert.equal(parsedOutput.event, "vyra_ai_event");
    } finally {
      console.log = originalConsoleLog;
    }
  });

  it("sets WARNING for client error/fallback and ERROR for 500 status", () => {
    const originalConsoleLog = console.log;
    console.log = () => {};

    try {
      const fallbackRec = logStructuredAiEvent({
        route: "/api/ai/adapt-day",
        modelRequested: "gemini-4-argon",
        modelUsed: "gemini-3.8-flash",
        fallbackTriggered: true,
        authMode: "gemini_live",
        latencyMs: 210,
        status: 200,
      });
      assert.equal(fallbackRec.severity, "WARNING");

      const errRec = logStructuredAiEvent({
        route: "/api/ai/evolve",
        modelRequested: "gemini-4-argon",
        modelUsed: "gemini-4-argon",
        fallbackTriggered: true,
        authMode: "error",
        latencyMs: 99,
        status: 500,
        detail: "Internal crash",
      });
      assert.equal(errRec.severity, "ERROR");
    } finally {
      console.log = originalConsoleLog;
    }
  });
});
