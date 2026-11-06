// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerCrudTools } from "./crudFactory.js";
import { apiPost, apiDelete, handleApiError } from "../services/apiClient.js";
import { toolResult, errorResult } from "../format.js";

/** Registers the standard CRUD tools plus link/unlink-Input tools for `/api/business-partners`. */
export function registerBusinessPartnerTools(server: McpServer): void {
  registerCrudTools(server, {
    toolPrefix: "sipoc_business_partner",
    pathSegment: "business-partners",
    displayName: "business partner",
    createShape: {
      name: z.string().min(1).describe("Display name of the business partner (company, department, etc.)"),
      description: z.string().max(2000).optional().describe("Free-text description"),
    },
    updateShape: {
      name: z.string().min(1).optional().describe("Display name of the business partner"),
      description: z.string().max(2000).optional().describe("Free-text description"),
    },
  });

  server.registerTool(
    "sipoc_business_partner_link_input",
    {
      title: "Link Business Partner to Input",
      description: `Links a business partner to an input (BusinessPartnerInput join), independent of any Lipok. This is a general capability link, not a per-Lipok attachment — idempotent, no body.`,
      inputSchema: {
        partnerId: z.string().min(1).describe("The business partner id"),
        inputId: z.string().min(1).describe("The input id"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ partnerId, inputId }) => {
      try {
        await apiPost(`/business-partners/${partnerId}/inputs/${inputId}`);
        return toolResult({ linked: true, partnerId, inputId });
      } catch (error) {
        return errorResult(handleApiError(error, "business partner or input"));
      }
    },
  );

  server.registerTool(
    "sipoc_business_partner_unlink_input",
    {
      title: "Unlink Business Partner from Input",
      description: `Removes the BusinessPartnerInput link between a business partner and an input.`,
      inputSchema: {
        partnerId: z.string().min(1).describe("The business partner id"),
        inputId: z.string().min(1).describe("The input id"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ partnerId, inputId }) => {
      try {
        await apiDelete(`/business-partners/${partnerId}/inputs/${inputId}`);
        return toolResult({ unlinked: true, partnerId, inputId });
      } catch (error) {
        return errorResult(handleApiError(error, "business partner or input"));
      }
    },
  );
}
