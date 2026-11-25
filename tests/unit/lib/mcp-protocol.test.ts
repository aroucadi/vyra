import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { handleMcpJsonRpcRequest, VYRA_MCP_TOOLS } from "@/lib/mcp/tools";
import { MCP_SERVER_INFO, MCP_PROTOCOL_VERSION } from "@/lib/mcp/protocol";

describe("Anthropic Claude Model Context Protocol (MCP) Suite", () => {
  it("exposes all 6 required Vyra MCP tools", () => {
    assert.equal(VYRA_MCP_TOOLS.length, 6);
    const names = VYRA_MCP_TOOLS.map((t) => t.name);
    assert.ok(names.includes("vyra_get_athlete_dossier"));
    assert.ok(names.includes("vyra_get_flight_logs"));
    assert.ok(names.includes("vyra_get_active_mesocycle"));
    assert.ok(names.includes("vyra_get_biometric_curve"));
    assert.ok(names.includes("vyra_query_exercise_catalogue"));
    assert.ok(names.includes("vyra_propose_coaching_intervention"));
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
    assert.equal(result.tools.length, 6);
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
    assert.equal(typeof parsed.totalRecordedSessions, "number");
    assert.ok(Array.isArray(parsed.flightLogs));
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
});
