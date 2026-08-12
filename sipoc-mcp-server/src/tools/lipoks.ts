import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerCrudTools } from "./crudFactory.js";
import { registerAttachDetachTools } from "./linkFactory.js";
import { apiPost, apiPatch, apiDelete, apiGetBinary, handleApiError } from "../services/apiClient.js";
import { toolResult, errorResult } from "../format.js";
import type { LipokDto } from "../types.js";

/** Writes a downloaded export zip to a temp file and returns its path, since MCP tool results are text/JSON, not binary. */
async function saveZip(buffer: ArrayBuffer, filenameHint: string): Promise<string> {
  const path = join(tmpdir(), `${filenameHint}-${Date.now()}.zip`);
  await writeFile(path, Buffer.from(buffer));
  return path;
}

/**
 * Registers the standard CRUD tools for `/api/lipoks` plus the full SIPOC-specific surface:
 * attach/detach/reorder the five columns, Go tagging, the fine-grained links, comments, and
 * Markdown export.
 */
export function registerLipokTools(server: McpServer): void {
  registerCrudTools(server, {
    toolPrefix: "sipoc_lipok",
    pathSegment: "lipoks",
    displayName: "Lipok",
    createShape: {
      name: z.string().min(1).describe("Display name of the Lipok (SIPOC instance)"),
      description: z.string().max(2000).optional().describe("Free-text description"),
    },
    updateShape: {
      name: z.string().min(1).optional().describe("Display name of the Lipok"),
      description: z.string().max(2000).optional().describe("Free-text description"),
    },
  });

  for (const { subResource, noun, displayName } of [
    { subResource: "suppliers", noun: "supplier", displayName: "supplier" },
    { subResource: "inputs", noun: "input", displayName: "input" },
    { subResource: "process-steps", noun: "process_step", displayName: "process step" },
    { subResource: "outputs", noun: "output", displayName: "output" },
    { subResource: "customers", noun: "customer", displayName: "customer" },
  ] as const) {
    registerAttachDetachTools(server, { subResource, noun, displayName });
  }

  // --- Go attachment (unordered, no position) ---

  server.registerTool(
    "sipoc_lipok_attach_go",
    {
      title: "Attach existing Go to Lipok",
      description: `Links an existing Go ("Geschäftsobjekt") node to a Lipok. Unlike suppliers/inputs/process-steps/outputs/customers, this join is unordered. Returns the full updated Lipok.`,
      inputSchema: {
        lipokId: z.string().min(1).describe("The Lipok id"),
        goId: z.string().min(1).describe("The Go node id to attach"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ lipokId, goId }) => {
      try {
        const result = await apiPost<LipokDto>(`/lipoks/${lipokId}/gos/${goId}`);
        return toolResult(result as unknown as Record<string, unknown>);
      } catch (error) {
        return errorResult(handleApiError(error, "Lipok or Go node"));
      }
    },
  );

  server.registerTool(
    "sipoc_lipok_create_and_attach_go",
    {
      title: "Create and attach a new Go to Lipok",
      description: `Creates a brand-new Go ("Geschäftsobjekt") node and links it to a Lipok in one call. Use sipoc_go_create + sipoc_lipok_attach_go instead if the Go node should also be reusable independently before you decide to attach it.`,
      inputSchema: {
        lipokId: z.string().min(1).describe("The Lipok id"),
        name: z.string().min(1).describe("Display name of the new Go node"),
        description: z.string().max(2000).optional().describe("Free-text description"),
        category: z.string().optional().describe("Free-text category label"),
        parentId: z.string().optional().describe("Id of the parent Go node, omit for a top-level node"),
        type: z.enum(["PHYSICAL", "VIRTUAL"]).optional().describe("Whether the business object is physical or virtual"),
        importance: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional().describe("Business importance rating"),
        criticality: z.enum(["PUBLIC", "INTERNAL", "PRIVATE", "CONFIDENTIAL"]).optional().describe("Data classification level"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ lipokId, ...goCreate }) => {
      try {
        const result = await apiPost<LipokDto>(`/lipoks/${lipokId}/gos`, goCreate);
        return toolResult(result as unknown as Record<string, unknown>);
      } catch (error) {
        return errorResult(handleApiError(error, "Lipok"));
      }
    },
  );

  server.registerTool(
    "sipoc_lipok_detach_go",
    {
      title: "Detach Go from Lipok",
      description: `Removes the link between a Go node and a Lipok. Returns the full updated Lipok.`,
      inputSchema: {
        lipokId: z.string().min(1).describe("The Lipok id"),
        goId: z.string().min(1).describe("The Go node id to detach"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ lipokId, goId }) => {
      try {
        const result = await apiDelete<LipokDto>(`/lipoks/${lipokId}/gos/${goId}`);
        return toolResult(result as unknown as Record<string, unknown>);
      } catch (error) {
        return errorResult(handleApiError(error, "Lipok or Go node"));
      }
    },
  );

  // --- Fine-grained links: which supplier/step an input belongs to, which step produced an output, process step order ---

  server.registerTool(
    "sipoc_lipok_link_input",
    {
      title: "Set an input's supplier/process-step link",
      description: `Sets which supplier delivers, and/or which process step consumes, a specific input already attached to a Lipok. Addressed by lipokInputId (the join row id, found in a LipokDto's inputs[].lipokInputId), not the raw input id. The referenced supplier/process-step must already be attached to the same Lipok.`,
      inputSchema: {
        lipokId: z.string().min(1).describe("The Lipok id"),
        lipokInputId: z.number().int().describe("The LipokInput join-row id (from LipokDto.inputs[].lipokInputId)"),
        supplierId: z.string().optional().describe("Business partner id of the supplier that delivers this input; must already be attached to this Lipok as a supplier"),
        processStepId: z.string().optional().describe("Process step id that consumes this input; must already be attached to this Lipok"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ lipokId, lipokInputId, ...link }) => {
      try {
        const result = await apiPatch<LipokDto>(`/lipoks/${lipokId}/inputs/${lipokInputId}/link`, link);
        return toolResult(result as unknown as Record<string, unknown>);
      } catch (error) {
        return errorResult(handleApiError(error, "Lipok input link"));
      }
    },
  );

  server.registerTool(
    "sipoc_lipok_link_output",
    {
      title: "Set an output's producing process-step link",
      description: `Sets which process step produced a specific output already attached to a Lipok. Addressed by lipokOutputId (from LipokDto.outputs[].lipokOutputId). The referenced process step must already be attached to the same Lipok.`,
      inputSchema: {
        lipokId: z.string().min(1).describe("The Lipok id"),
        lipokOutputId: z.number().int().describe("The LipokOutput join-row id (from LipokDto.outputs[].lipokOutputId)"),
        processStepId: z.string().optional().describe("Process step id that produced this output; must already be attached to this Lipok"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ lipokId, lipokOutputId, ...link }) => {
      try {
        const result = await apiPatch<LipokDto>(`/lipoks/${lipokId}/outputs/${lipokOutputId}/link`, link);
        return toolResult(result as unknown as Record<string, unknown>);
      } catch (error) {
        return errorResult(handleApiError(error, "Lipok output link"));
      }
    },
  );

  server.registerTool(
    "sipoc_lipok_link_process_step",
    {
      title: "Set a process step's predecessor",
      description: `Sets which other process step immediately precedes this one within the same Lipok, defining process order. Addressed by lipokProcessStepId (from LipokDto.processSteps[].lipokProcessStepId). Omit predecessorId to mark this step as the starting step.`,
      inputSchema: {
        lipokId: z.string().min(1).describe("The Lipok id"),
        lipokProcessStepId: z.number().int().describe("The LipokProcessStep join-row id (from LipokDto.processSteps[].lipokProcessStepId)"),
        predecessorId: z.number().int().optional().describe("The predecessor's LipokProcessStep join-row id within the same Lipok; omit to mark this as the starting step"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ lipokId, lipokProcessStepId, ...link }) => {
      try {
        const result = await apiPatch<LipokDto>(`/lipoks/${lipokId}/process-steps/${lipokProcessStepId}/link`, link);
        return toolResult(result as unknown as Record<string, unknown>);
      } catch (error) {
        return errorResult(handleApiError(error, "Lipok process step link"));
      }
    },
  );

  // --- Output <-> customer links (which customer(s) receive a specific output row) ---

  server.registerTool(
    "sipoc_lipok_add_output_customer",
    {
      title: "Add a customer recipient to a Lipok output",
      description: `Links a business partner as a recipient of a specific output row already attached to a Lipok. Addressed by lipokOutputId (from LipokDto.outputs[].lipokOutputId), not the raw output id. The customer must already be attached to this Lipok via sipoc_lipok_attach_customer.`,
      inputSchema: {
        lipokId: z.string().min(1).describe("The Lipok id"),
        lipokOutputId: z.number().int().describe("The LipokOutput join-row id (from LipokDto.outputs[].lipokOutputId)"),
        customerId: z.string().min(1).describe("Business partner id of the customer receiving this output; must already be attached to this Lipok as a customer"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ lipokId, lipokOutputId, customerId }) => {
      try {
        const result = await apiPost<LipokDto>(`/lipoks/${lipokId}/outputs/${lipokOutputId}/customers/${customerId}`);
        return toolResult(result as unknown as Record<string, unknown>);
      } catch (error) {
        return errorResult(handleApiError(error, "Lipok output or customer"));
      }
    },
  );

  server.registerTool(
    "sipoc_lipok_remove_output_customer",
    {
      title: "Remove a customer recipient from a Lipok output",
      description: `Removes a business partner as a recipient of a specific output row on a Lipok.`,
      inputSchema: {
        lipokId: z.string().min(1).describe("The Lipok id"),
        lipokOutputId: z.number().int().describe("The LipokOutput join-row id"),
        customerId: z.string().min(1).describe("Business partner id to remove as a recipient"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ lipokId, lipokOutputId, customerId }) => {
      try {
        const result = await apiDelete<LipokDto>(`/lipoks/${lipokId}/outputs/${lipokOutputId}/customers/${customerId}`);
        return toolResult(result as unknown as Record<string, unknown>);
      } catch (error) {
        return errorResult(handleApiError(error, "Lipok output or customer"));
      }
    },
  );

  // --- Comments ---

  server.registerTool(
    "sipoc_lipok_add_comment",
    {
      title: "Add a comment to a Lipok",
      description: `Adds a free-text comment (Markdown source) to a Lipok. The comment's sequential number is assigned server-side.`,
      inputSchema: {
        lipokId: z.string().min(1).describe("The Lipok id"),
        content: z.string().min(1).max(4000).describe("Markdown source of the comment"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ lipokId, content }) => {
      try {
        const result = await apiPost<LipokDto>(`/lipoks/${lipokId}/comments`, { content });
        return toolResult(result as unknown as Record<string, unknown>);
      } catch (error) {
        return errorResult(handleApiError(error, "Lipok"));
      }
    },
  );

  server.registerTool(
    "sipoc_lipok_update_comment",
    {
      title: "Update a Lipok comment",
      description: `Replaces the content of an existing Lipok comment.`,
      inputSchema: {
        lipokId: z.string().min(1).describe("The Lipok id"),
        commentId: z.number().int().describe("The comment id"),
        content: z.string().min(1).max(4000).describe("New Markdown source of the comment"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ lipokId, commentId, content }) => {
      try {
        const result = await apiPatch<LipokDto>(`/lipoks/${lipokId}/comments/${commentId}`, { content });
        return toolResult(result as unknown as Record<string, unknown>);
      } catch (error) {
        return errorResult(handleApiError(error, "Lipok comment"));
      }
    },
  );

  server.registerTool(
    "sipoc_lipok_delete_comment",
    {
      title: "Delete a Lipok comment",
      description: `Deletes a comment from a Lipok. This cannot be undone.`,
      inputSchema: {
        lipokId: z.string().min(1).describe("The Lipok id"),
        commentId: z.number().int().describe("The comment id"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ lipokId, commentId }) => {
      try {
        const result = await apiDelete<LipokDto>(`/lipoks/${lipokId}/comments/${commentId}`);
        return toolResult(result as unknown as Record<string, unknown>);
      } catch (error) {
        return errorResult(handleApiError(error, "Lipok comment"));
      }
    },
  );

  // --- Markdown export (zip files, saved to a local temp path since MCP text content isn't suited to binary) ---

  server.registerTool(
    "sipoc_lipok_export_all",
    {
      title: "Export all Lipoks as Markdown (zip)",
      description: `Downloads a zip archive containing a Markdown export of every Lipok, saves it to a local temp file, and returns its path and size. Use sipoc_lipok_export_one to export a single Lipok instead.`,
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      try {
        const buffer = await apiGetBinary("/lipoks/export");
        const path = await saveZip(buffer, "sipoc-export-all");
        return toolResult({ path, bytes: buffer.byteLength });
      } catch (error) {
        return errorResult(handleApiError(error, "Lipok export"));
      }
    },
  );

  server.registerTool(
    "sipoc_lipok_export_one",
    {
      title: "Export a single Lipok as Markdown (zip)",
      description: `Downloads a zip archive containing the Markdown export of one Lipok, saves it to a local temp file, and returns its path and size.`,
      inputSchema: { lipokId: z.string().min(1).describe("The Lipok id") },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ lipokId }) => {
      try {
        const buffer = await apiGetBinary(`/lipoks/${lipokId}/export`);
        const path = await saveZip(buffer, `sipoc-export-${lipokId}`);
        return toolResult({ path, bytes: buffer.byteLength });
      } catch (error) {
        return errorResult(handleApiError(error, "Lipok"));
      }
    },
  );
}
