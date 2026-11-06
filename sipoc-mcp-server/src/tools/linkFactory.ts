// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiPost, apiDelete, handleApiError } from "../services/apiClient.js";
import { toolResult, errorResult } from "../format.js";
import type { LipokDto } from "../types.js";

interface AttachDetachConfig {
  /** e.g. "suppliers" -> POST/DELETE /lipoks/{lipokId}/suppliers/{entityId} */
  subResource: "suppliers" | "inputs" | "process-steps" | "outputs" | "customers";
  /** e.g. "supplier" -> sipoc_lipok_attach_supplier / sipoc_lipok_detach_supplier */
  noun: string;
  /** Human-readable, e.g. "supplier" */
  displayName: string;
}

/**
 * Registers the attach/detach pair shared by all five ordered Lipok "columns"
 * (suppliers, inputs, process-steps, outputs, customers) documented in SCHEMA.md —
 * they all follow the identical POST .../{entityId}?position=n / DELETE .../{entityId} shape.
 */
export function registerAttachDetachTools(server: McpServer, config: AttachDetachConfig): void {
  const { subResource, noun, displayName } = config;

  server.registerTool(
    `sipoc_lipok_attach_${noun}`,
    {
      title: `Attach ${displayName} to Lipok`,
      description: `Attaches an existing ${displayName} to a Lipok's ordered ${subResource} column, creating the join row. Returns the full updated Lipok. Position defaults to append (last).`,
      inputSchema: {
        lipokId: z.string().min(1).describe("The Lipok id"),
        entityId: z.string().min(1).describe(`The ${displayName} id to attach`),
        position: z.number().int().min(0).optional().describe("Zero-based position in the column; omit to append at the end"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ lipokId, entityId, position }) => {
      try {
        const result = await apiPost<LipokDto>(`/lipoks/${lipokId}/${subResource}/${entityId}`, undefined, { position });
        return toolResult(result as unknown as Record<string, unknown>);
      } catch (error) {
        return errorResult(handleApiError(error, `Lipok or ${displayName}`));
      }
    },
  );

  server.registerTool(
    `sipoc_lipok_detach_${noun}`,
    {
      title: `Detach ${displayName} from Lipok`,
      description: `Removes a ${displayName} from a Lipok's ${subResource} column (deletes the join row, addressed by the ${displayName}'s own id). Returns the full updated Lipok.`,
      inputSchema: {
        lipokId: z.string().min(1).describe("The Lipok id"),
        entityId: z.string().min(1).describe(`The ${displayName} id to detach`),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ lipokId, entityId }) => {
      try {
        const result = await apiDelete<LipokDto>(`/lipoks/${lipokId}/${subResource}/${entityId}`);
        return toolResult(result as unknown as Record<string, unknown>);
      } catch (error) {
        return errorResult(handleApiError(error, `Lipok or ${displayName}`));
      }
    },
  );
}
