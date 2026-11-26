import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { handleMcpJsonRpcRequest, VYRA_MCP_TOOLS } from "@/lib/mcp/tools";
import { MCP_SERVER_INFO, MCP_PROTOCOL_VERSION } from "@/lib/mcp/protocol";

describe("Anthropic Claude Model Context Protocol (MCP) Suite", () => {
  it("exposes all 11 required Vyra MCP tools", () => {
    assert.ok(VYRA_MCP_TOOLS.length >= 11);
    const names = VYRA_MCP_TOOLS.map((t) => t.name);
    assert.ok(names.includes("vyra_get_athlete_dossier"));
    assert.ok(names.includes("vyra_get_flight_logs"));
    assert.ok(names.includes("vyra_get_today_workout"));
    assert.ok(names.includes("vyra_get_active_mesocycle"));
    assert.ok(names.includes("vyra_get_biometric_curve"));
    assert.ok(names.includes("vyra_get_shadow_angel_audit"));
    assert.ok(names.includes("vyra_query_exercise_catalogue"));
    assert.ok(names.includes("vyra_propose_coaching_intervention"));
    assert.ok(names.includes("vyra_query_knowledge_rag"));
    assert.ok(names.includes("vyra_get_scientific_deep_insights"));
    assert.ok(names.includes("vyra_get_exercise_substitutions"));
  });

  it("handles 'initialize' method according to MCP specification", async () => {
    const res = await handleMcpJsonRpcRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: MCP_PROTOCOL_VERSION },
    });

    assert.equal(res.jsonrpc, "2.0");
    assert.equal(res.id, 1);
    const result = res.result as { protocolVersion: string; serverInfo: { name: string } };
    assert.equal(result.protocolVersion, MCP_PROTOCOL_VERSION);
    assert.equal(result.serverInfo.name, MCP_SERVER_INFO.name);
  });

  it("handles 'tools/list' and returns tool definitions", async () => {
    const res = await handleMcpJsonRpcRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    });

    assert.equal(res.jsonrpc, "2.0");
    assert.equal(res.id, 2);
    const result = res.result as { tools: unknown[] };
    assert.ok(result.tools.length >= 8);
  });

  it("executes 'vyra_get_athlete_dossier' and returns InBody bio-impedance data for Alaa", async () => {
    const res = await handleMcpJsonRpcRequest(
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "vyra_get_athlete_dossier",
          arguments: { traineeId: "trainee_alaa" },
        },
      },
      "trainee_alaa"
    );

    assert.equal(res.jsonrpc, "2.0");
    assert.equal(res.id, 3);
    const result = res.result as { content: Array<{ type: string; text: string }> };
    assert.equal(result.content[0].type, "text");
    const parsed = JSON.parse(result.content[0].text);
    assert.equal(parsed.inBodySegmentalTelemetry.skeletalMuscleMassKg, 24.9);
    assert.equal(parsed.inBodySegmentalTelemetry.bodyFatPercent, 10.0);
    assert.equal(parsed.inBodySegmentalTelemetry.bilateralSymmetry.arms.symmetry, "100% Equilibrium");
  });

  it("executes 'vyra_get_flight_logs' and formats workout telemetry", async () => {
    const res = await handleMcpJsonRpcRequest(
      {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "vyra_get_flight_logs",
          arguments: { limit: 5 },
        },
      },
      "trainee_alaa"
    );

    assert.equal(res.jsonrpc, "2.0");
    const result = res.result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(result.content[0].text);
    assert.equal(typeof parsed.totalSessionsRecorded, "number");
    assert.ok(parsed.totalSessionsRecorded >= 3);
    assert.ok(parsed.cumulativeTonnageKg > 20000);
    assert.ok(Array.isArray(parsed.flightLogs));
  });

  it("executes 'vyra_get_biometric_curve' and returns 14-day weigh-ins and pacing", async () => {
    const res = await handleMcpJsonRpcRequest(
      {
        jsonrpc: "2.0",
        id: 41,
        method: "tools/call",
        params: {
          name: "vyra_get_biometric_curve",
          arguments: { traineeId: "trainee_alaa", days: 14 },
        },
      },
      "trainee_alaa"
    );

    assert.equal(res.jsonrpc, "2.0");
    const result = res.result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.totalWeighInsLogged >= 14);
    assert.ok(parsed.weeklyRateOfGainKg > 0);
    assert.equal(parsed.surplusEvaluation.status, "OPTIMAL_LEAN_SURPLUS");
    assert.ok(Array.isArray(parsed.weighIns));
  });

  it("executes 'vyra_get_today_workout' and returns scheduled session and cues", async () => {
    const res = await handleMcpJsonRpcRequest(
      {
        jsonrpc: "2.0",
        id: 42,
        method: "tools/call",
        params: {
          name: "vyra_get_today_workout",
          arguments: { traineeId: "trainee_alaa" },
        },
      },
      "trainee_alaa"
    );

    assert.equal(res.jsonrpc, "2.0");
    const result = res.result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.todaySession.sessionLabel);
    assert.ok(parsed.todaySession.blocks.length > 0);
    assert.ok(parsed.todaySession.technicalIntentions.length > 0);
  });

  it("executes 'vyra_get_shadow_angel_audit' for 360-degree audit", async () => {
    const res = await handleMcpJsonRpcRequest(
      {
        jsonrpc: "2.0",
        id: 43,
        method: "tools/call",
        params: {
          name: "vyra_get_shadow_angel_audit",
          arguments: { traineeId: "trainee_alaa" },
        },
      },
      "trainee_alaa"
    );

    assert.equal(res.jsonrpc, "2.0");
    const result = res.result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(result.content[0].text);
    assert.equal(parsed.shadowAngelVerdict.overallStatus, "HIGH_FIDELITY_PROGRESSION");
    assert.ok(parsed.dossier);
    assert.ok(parsed.biometricCurve);
    assert.ok(parsed.flightLogs);
    assert.ok(parsed.todayWorkout);
  });

  it("executes 'vyra_query_exercise_catalogue' with filters", async () => {
    const res = await handleMcpJsonRpcRequest({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "vyra_query_exercise_catalogue",
        arguments: { targetMuscle: "lats", equipment: "cable" },
      },
    });

    assert.equal(res.jsonrpc, "2.0");
    const result = res.result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.returnedMatches > 0);
    assert.ok(parsed.exercises.length > 0);
  });

  it("executes 'vyra_propose_coaching_intervention' and registers proposal", async () => {
    const res = await handleMcpJsonRpcRequest({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "vyra_propose_coaching_intervention",
        arguments: {
          traineeId: "trainee_alaa",
          title: "Incline Cable Fly Swap",
          rationale: "Optimizes clavicular pectoral recruitment and minimizes anterior deltoid sheer.",
          actionType: "EXERCISE_SWAP",
        },
      },
    });

    assert.equal(res.jsonrpc, "2.0");
    const result = res.result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(result.content[0].text);
    assert.equal(parsed.success, true);
    assert.equal(parsed.proposition.actionType, "EXERCISE_SWAP");
  });

  it("executes 'vyra_query_knowledge_rag' and returns multimodal synthesized evidence", async () => {
    const res = await handleMcpJsonRpcRequest({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "vyra_query_knowledge_rag",
        arguments: {
          traineeId: "trainee_alaa",
          query: "Incline Dumbbell Press shoulder fatigue",
          focusArea: "biomechanics",
        },
      },
    });

    assert.equal(res.jsonrpc, "2.0");
    const result = res.result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(result.content[0].text);
    assert.equal(parsed.traineeId, "trainee_alaa");
    assert.ok(parsed.synthesizedReasoningSummary);
    assert.ok(Array.isArray(parsed.ragEvidenceBundle.biomechanicalMatches));
    assert.ok(parsed.ragEvidenceBundle.workoutLogSummary.recentBallastVolumeKg > 0);
    assert.ok(parsed.scientificRecommendations.length > 0);
  });

  it("executes 'vyra_get_scientific_deep_insights' and delivers pre-computed gems", async () => {
    const res = await handleMcpJsonRpcRequest({
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "vyra_get_scientific_deep_insights",
        arguments: { traineeId: "trainee_alaa" },
      },
    });

    assert.equal(res.jsonrpc, "2.0");
    const result = res.result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(result.content[0].text);
    assert.equal(parsed.athleteName, "Alaa");
    assert.equal(parsed.pacingAndSurplusAudit.currentWeightKg, 52.05);
    assert.equal(parsed.pacingAndSurplusAudit.macroBreakdown.bufferCaloriesKcal, 185);
    assert.ok(parsed.progressiveOverloadAudit.structuralPushPullRatio.ratio > 0.9);
    assert.ok(parsed.jointSafetyAndSensoryGuardrails.supraspinatusShoulderRule.includes("Lever lateral raise"));
    assert.ok(parsed.jointSafetyAndSensoryGuardrails.inclinePressBenchAngleCorrection.includes("30°"));
  });

  it("executes 'vyra_get_exercise_substitutions' with biomechanical match and justification", async () => {
    const res = await handleMcpJsonRpcRequest({
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "vyra_get_exercise_substitutions",
        arguments: {
          exerciseName: "Incline Dumbbell Press",
          reason: "shoulder_pain",
          limit: 3,
        },
      },
    });

    assert.equal(res.jsonrpc, "2.0");
    const result = res.result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(result.content[0].text);
    assert.equal(parsed.sourceExercise, "Incline Dumbbell Press");
    assert.equal(parsed.detectedSubdivision, "pec_clavicular");
    assert.ok(parsed.substitutions.length > 0);
    assert.ok(parsed.substitutions[0].biomechanicalJustification.includes("anterior glide"));
  });

  it("returns error for unknown method", async () => {
    const res = await handleMcpJsonRpcRequest({
      jsonrpc: "2.0",
      id: 99,
      method: "unknown/method",
    });

    assert.equal(res.jsonrpc, "2.0");
    assert.ok(res.error);
    assert.equal(res.error.code, -32601);
  });

  it("exposes GET and OPTIONS endpoints with CORS headers for Claude Web", async () => {
    const { GET, OPTIONS } = await import("@/app/api/mcp/route");
    const optRes = await OPTIONS();
    assert.equal(optRes.status, 204);
    assert.equal(optRes.headers.get("Access-Control-Allow-Origin"), "*");
    assert.ok(optRes.headers.get("Access-Control-Allow-Methods")?.includes("POST"));

    const getRes = await GET();
    assert.equal(getRes.status, 200);
    const body = await getRes.json();
    assert.equal(body.status, "online");
    assert.equal(body.server.name, "vyra-aerospace-mcp");
  });
});
