// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerCrudTools } from "./crudFactory.js";
import { apiGet, handleApiError } from "../services/apiClient.js";
import { toolResult, errorResult } from "../format.js";
import type { GoTreeNodeDto } from "../types.js";

const customPropertyShape = z.object({ key: z.string().min(1), value: z.string() });

/** Registers the standard CRUD tools for `/api/gos` plus the tree/hierarchy read tools. */
export function registerGoTools(server: McpServer): void {
  registerCrudTools(server, {
    toolPrefix: "sipoc_go",
    pathSegment: "gos",
    displayName: "Go (Geschäftsobjekt)",
    createShape: {
      name: z.string().min(1).describe("Display name of the Go node"),
      description: z.string().max(2000).optional().describe("Free-text description"),
      category: z.string().optional().describe("Free-text category label"),
      parentId: z.string().optional().describe("Id of the parent Go node, omit for a top-level node"),
      type: z.enum(["PHYSICAL", "VIRTUAL"]).optional().describe("Whether the business object is physical or virtual"),
      importance: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional().describe("Business importance rating"),
      criticality: z.enum(["PUBLIC", "INTERNAL", "PRIVATE", "CONFIDENTIAL"]).optional().describe("Data classification level"),
      customProperties: z.array(customPropertyShape).optional().describe("Extra key/value properties, unique per key"),
    },
    updateShape: {
      name: z.string().min(1).optional().describe("Display name of the Go node"),
      description: z.string().max(2000).optional().describe("Free-text description"),
      category: z.string().optional().describe("Free-text category label"),
      parentId: z.string().optional().describe("Id of the parent Go node"),
      type: z.enum(["PHYSICAL", "VIRTUAL"]).optional().describe("Whether the business object is physical or virtual"),
      importance: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional().describe("Business importance rating"),
      criticality: z.enum(["PUBLIC", "INTERNAL", "PRIVATE", "CONFIDENTIAL"]).optional().describe("Data classification level"),
      customProperties: z.array(customPropertyShape).optional().describe("Extra key/value properties, unique per key"),
    },
  });

  server.registerTool(
    "sipoc_go_tree",
    {
      title: "Get full Go hierarchy",
      description: `Returns the complete Go ("Geschäftsobjekt") taxonomy as a nested tree, from all top-level nodes down through their descendants. Use this to understand the whole taxonomy at once; use sipoc_go_hierarchy for just one node's ancestor/descendant chain.`,
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      try {
        const tree = await apiGet<GoTreeNodeDto[]>("/gos/tree");
        return toolResult({ tree });
      } catch (error) {
        return errorResult(handleApiError(error, "Go tree"));
      }
    },
  );

  server.registerTool(
    "sipoc_go_hierarchy",
    {
      title: "Get a Go node's hierarchy",
      description: `Returns a single Go node along with its ancestor chain (up to the root) and its descendant subtree.`,
      inputSchema: { goId: z.string().min(1).describe("The Go node id") },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ goId }) => {
      try {
        const result = await apiGet<GoTreeNodeDto>(`/gos/${goId}/hierarchy`);
        return toolResult(result as unknown as Record<string, unknown>);
      } catch (error) {
        return errorResult(handleApiError(error, "Go node"));
      }
    },
  );
}
