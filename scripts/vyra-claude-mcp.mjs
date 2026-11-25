#!/usr/bin/env node

/**
 * @file vyra-claude-mcp.mjs
 * @description Standalone Model Context Protocol (MCP) Stdio Bridge for Anthropic Claude Desktop.
 * 
 * Usage in claude_desktop_config.json:
 * {
 *   "mcpServers": {
 *     "vyra": {
 *       "command": "node",
 *       "args": ["<path-to-project>/scripts/vyra-claude-mcp.mjs"],
 *       "env": {
 *         "VYRA_API_URL": "https://vyra-app-592834219346.me-central1.run.app",
 *         "VYRA_API_KEY": "vyra_pat_alaa_live"
 *       }
 *     }
 *   }
 * }
 */

import readline from "node:readline";

const VYRA_API_URL = process.env.VYRA_API_URL || "https://vyra-app-592834219346.me-central1.run.app";
const VYRA_API_KEY = process.env.VYRA_API_KEY || "vyra_pat_alaa_live";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const rpcRequest = JSON.parse(trimmed);

    const res = await fetch(`${VYRA_API_URL.replace(/\/$/, "")}/api/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VYRA_API_KEY}`,
      },
      body: JSON.stringify(rpcRequest),
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: rpcRequest.id ?? null,
          error: { code: -32603, message: `HTTP ${res.status}: ${errorMsg}` },
        }) + "\n"
      );
      return;
    }

    const rpcResponse = await res.json();
    process.stdout.write(JSON.stringify(rpcResponse) + "\n");
  } catch (err) {
    process.stdout.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: err instanceof Error ? err.message : "Parse/Network Error" },
      }) + "\n"
    );
  }
});
