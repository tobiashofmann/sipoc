// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBusinessPartnerTools } from "../src/tools/businessPartners.js";
import { registerInputTools } from "../src/tools/inputs.js";
import { registerProcessStepTools } from "../src/tools/processSteps.js";
import { registerOutputTools } from "../src/tools/outputs.js";
import { registerGoTools } from "../src/tools/gos.js";
import { registerLipokTools } from "../src/tools/lipoks.js";

export interface RecordedRequest {
  url: URL;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

type Responder = (req: RecordedRequest) => Response | Promise<Response>;

/** Replaces global fetch with a stub; returns the recorded requests and a restore function. */
export function mockFetch(responder: Responder) {
  const original = globalThis.fetch;
  const requests: RecordedRequest[] = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const req: RecordedRequest = {
      url: new URL(input instanceof Request ? input.url : String(input)),
      method: init?.method ?? "GET",
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
    };
    requests.push(req);
    return responder(req);
  }) as typeof fetch;
  return { requests, restore: () => (globalThis.fetch = original) };
}

export const jsonResponse = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });

/** Starts the full MCP server (all tools) connected to an in-memory MCP client. */
export async function connectClient() {
  const server = new McpServer({ name: "test-server", version: "0.0.0" });
  registerBusinessPartnerTools(server);
  registerInputTools(server);
  registerProcessStepTools(server);
  registerOutputTools(server);
  registerGoTools(server);
  registerLipokTools(server);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, close: () => client.close() };
}

export const textOf = (result: { content?: unknown }) =>
  ((result.content as Array<{ type: string; text: string }>)[0]).text;
