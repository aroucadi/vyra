import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, resolveRateLimitKey } from "@/lib/auth/rate-limit";
import { handleMcpJsonRpcRequest } from "@/lib/mcp/tools";
import { McpJsonRpcRequest, MCP_SERVER_INFO, MCP_PROTOCOL_VERSION } from "@/lib/mcp/protocol";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-requested-with, mcp-version",
  "Access-Control-Max-Age": "86400",
};

/**
 * OPTIONS /api/mcp - CORS Preflight for Claude Web (claude.ai) and remote browsers.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * GET /api/mcp - Health & Discovery endpoint for Anthropic Claude connectors.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "online",
      server: MCP_SERVER_INFO,
      protocolVersion: MCP_PROTOCOL_VERSION,
      endpoint: "/api/mcp",
      transport: ["http-jsonrpc", "streamable-http", "stdio-bridge"],
      documentation: "https://modelcontextprotocol.io",
      instructions: "Claude.ai Custom Connector: Add this endpoint URL into Settings > Connectors.",
    },
    { headers: CORS_HEADERS }
  );
}

/**
 * POST /api/mcp - Standard JSON-RPC 2.0 Endpoint for Claude Web, Claude Desktop, and MCP clients.
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
        {
          status: 429,
          headers: {
            ...CORS_HEADERS,
            "Retry-After": String(rl.retryAfterSeconds),
          },
        }
      );
    }

    // Resolve Personal Access Token (PAT) or User ID from Headers or URL Query Parameters
    const authHeader = req.headers.get("authorization") || "";
    const tokenParam = req.nextUrl.searchParams.get("token") || "";
    const userParam = req.nextUrl.searchParams.get("userId") || req.nextUrl.searchParams.get("athleteId") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim() || tokenParam;

    let traineeId = userParam || "trainee_alaa";
    if (token.startsWith("vyra_pat_")) {
      const cleanTokenId = token.replace(/^vyra_pat_/, "").replace(/_live$/, "");
      if (cleanTokenId) {
        traineeId = cleanTokenId;
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
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!body || typeof body !== "object" || !body.method) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: { code: -32600, message: "Invalid Request: method is required" },
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const response = await handleMcpJsonRpcRequest(body, traineeId);
    return NextResponse.json(response, { headers: CORS_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal MCP Server error";
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message },
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
