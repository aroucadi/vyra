import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, resolveRateLimitKey } from "@/lib/auth/rate-limit";
import { handleMcpJsonRpcRequest } from "@/lib/mcp/tools";
import { McpJsonRpcRequest, MCP_SERVER_INFO, MCP_PROTOCOL_VERSION } from "@/lib/mcp/protocol";

export const dynamic = "force-dynamic";

/**
 * GET /api/mcp - Health & Discovery endpoint for Anthropic Claude connectors.
 */
export async function GET() {
  return NextResponse.json({
    status: "online",
    server: MCP_SERVER_INFO,
    protocolVersion: MCP_PROTOCOL_VERSION,
    endpoint: "/api/mcp",
    transport: ["http-jsonrpc", "stdio-bridge"],
    documentation: "https://modelcontextprotocol.io",
  });
}

/**
 * POST /api/mcp - Standard JSON-RPC 2.0 Endpoint for Claude Desktop and MCP clients.
 */
export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(resolveRateLimitKey(req, "mcp-requests"), {
      maxRequests: 120,
      windowMs: 60_000,
    });

    if (!rl.allowed) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32000,
            message: "Rate limit exceeded. Please retry in a moment.",
          },
        },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    // Resolve Personal Access Token (PAT)
    const authHeader = req.headers.get("authorization") || "";
    const tokenParam = req.nextUrl.searchParams.get("token") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim() || tokenParam;

    // By default for sovereign single-tenant or authenticated athlete, maps to trainee_alaa
    let traineeId = "trainee_alaa";
    if (token.startsWith("vyra_pat_")) {
      const parts = token.split("_");
      if (parts.length >= 3 && parts[2]) {
        traineeId = `trainee_${parts[2]}`;
      }
    }

    let body: McpJsonRpcRequest;
    try {
      body = (await req.json()) as McpJsonRpcRequest;
    } catch {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: "Parse error: Invalid JSON" },
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || !body.method) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: { code: -32600, message: "Invalid Request: method is required" },
        },
        { status: 400 }
      );
    }

    const response = await handleMcpJsonRpcRequest(body, traineeId);
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal MCP Server error";
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message },
      },
      { status: 500 }
    );
  }
}
