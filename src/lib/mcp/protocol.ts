/**
 * @file protocol.ts
 * @description Model Context Protocol (MCP) JSON-RPC 2.0 Router for Anthropic Claude.
 * Conforms to Anthropic's official open-standard MCP specification (2024-11-05).
 */

export interface McpJsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpToolCallResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}

export interface McpJsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export const MCP_SERVER_INFO = {
  name: "vyra-aerospace-mcp",
  version: "2.0.0",
};

export const MCP_PROTOCOL_VERSION = "2024-11-05";
