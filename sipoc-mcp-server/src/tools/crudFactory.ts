// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z, ZodRawShape } from "zod";
import { apiGet, apiPost, apiPatch, apiDelete, handleApiError } from "../services/apiClient.js";
import { formatPage, toolResult, errorResult, SpringPage } from "../format.js";
import { DEFAULT_PAGE_SIZE } from "../constants.js";

interface CrudEntityConfig {
  /** e.g. "sipoc_business_partner" -> produces sipoc_business_partner_list/get/create/update/delete */
  toolPrefix: string;
  /** REST path segment, e.g. "business-partners" */
  pathSegment: string;
  /** Human-readable singular name used in titles/descriptions/errors, e.g. "business partner" */
  displayName: string;
  createShape: ZodRawShape;
  updateShape: ZodRawShape;
}

/**
 * Registers the five standard CRUD tools (list/get/create/update/delete) shared by every
 * plain master-data controller in SCHEMA.md (business-partners, inputs, process-steps,
 * outputs, gos). Entity-specific extras are registered separately alongside this call.
 */
export function registerCrudTools(server: McpServer, config: CrudEntityConfig): void {
  const { toolPrefix, pathSegment, displayName, createShape, updateShape } = config;

  server.registerTool(
    `${toolPrefix}_list`,
    {
      title: `List ${displayName}s`,
      description: `Lists ${displayName}s, paginated. Returns { items, page, pageSize, totalItems, totalPages, hasMore }.`,
      inputSchema: {
        page: z.number().int().min(0).default(0).describe("Zero-based page index"),
        size: z.number().int().min(1).max(200).default(DEFAULT_PAGE_SIZE).describe("Number of items per page"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ page, size }) => {
      try {
        const result = await apiGet<SpringPage<Record<string, unknown>>>(`/${pathSegment}`, { page, size });
        return toolResult(formatPage(result), "items");
      } catch (error) {
        return errorResult(handleApiError(error, displayName));
      }
    },
  );

  server.registerTool(
    `${toolPrefix}_get`,
    {
      title: `Get ${displayName}`,
      description: `Fetches a single ${displayName} by id, including all its fields.`,
      inputSchema: { id: z.string().min(1).describe(`The ${displayName} id`) },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      try {
        const result = await apiGet<Record<string, unknown>>(`/${pathSegment}/${id}`);
        return toolResult(result);
      } catch (error) {
        return errorResult(handleApiError(error, displayName));
      }
    },
  );

  server.registerTool(
    `${toolPrefix}_create`,
    {
      title: `Create ${displayName}`,
      description: `Creates a new ${displayName} and returns the created record.`,
      inputSchema: createShape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (input) => {
      try {
        const result = await apiPost<Record<string, unknown>>(`/${pathSegment}`, input);
        return toolResult(result);
      } catch (error) {
        return errorResult(handleApiError(error, displayName));
      }
    },
  );

  server.registerTool(
    `${toolPrefix}_update`,
    {
      title: `Update ${displayName}`,
      description: `Partially updates an existing ${displayName} — only the fields you pass are changed.`,
      inputSchema: { id: z.string().min(1).describe(`The ${displayName} id`), ...updateShape },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id, ...patch }) => {
      try {
        const result = await apiPatch<Record<string, unknown>>(`/${pathSegment}/${id}`, patch);
        return toolResult(result);
      } catch (error) {
        return errorResult(handleApiError(error, displayName));
      }
    },
  );

  server.registerTool(
    `${toolPrefix}_delete`,
    {
      title: `Delete ${displayName}`,
      description: `Deletes a ${displayName} by id. This cannot be undone — any Lipok attachments referencing it may also be affected.`,
      inputSchema: { id: z.string().min(1).describe(`The ${displayName} id`) },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      try {
        await apiDelete(`/${pathSegment}/${id}`);
        return toolResult({ deleted: true, id });
      } catch (error) {
        return errorResult(handleApiError(error, displayName));
      }
    },
  );
}
