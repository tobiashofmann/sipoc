#!/usr/bin/env node
// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

/**
 * MCP server exposing the SIPOC backend REST API (see ../../SCHEMA.md) as tools over stdio, so an
 * MCP-aware LLM client can browse/edit SIPOCs and their master data.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerBusinessPartnerTools } from "./tools/businessPartners.js";
import { registerInputTools } from "./tools/inputs.js";
import { registerProcessStepTools } from "./tools/processSteps.js";
import { registerOutputTools } from "./tools/outputs.js";
import { registerGoTools } from "./tools/gos.js";
import { registerLipokTools } from "./tools/lipoks.js";
import { API_BASE_URL } from "./constants.js";

const server = new McpServer({
  name: "sipoc-mcp-server",
  version: "1.0.0",
});

registerBusinessPartnerTools(server);
registerInputTools(server);
registerProcessStepTools(server);
registerOutputTools(server);
registerGoTools(server);
registerLipokTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`sipoc-mcp-server running via stdio, targeting ${API_BASE_URL}`);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
