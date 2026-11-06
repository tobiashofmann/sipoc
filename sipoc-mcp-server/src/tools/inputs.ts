// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerCrudTools } from "./crudFactory.js";

/** Registers the standard CRUD tools for `/api/inputs`. */
export function registerInputTools(server: McpServer): void {
  registerCrudTools(server, {
    toolPrefix: "sipoc_input",
    pathSegment: "inputs",
    displayName: "input",
    createShape: {
      name: z.string().min(1).describe("Display name of the input"),
      description: z.string().max(2000).optional().describe("Free-text description"),
      type: z.enum(["TEXT", "DOCUMENT"]).describe("Whether this input is free-text content or a linked document"),
      linkUrl: z.string().max(2000).optional().describe("URL to the document, when type is DOCUMENT"),
    },
    updateShape: {
      name: z.string().min(1).optional().describe("Display name of the input"),
      description: z.string().max(2000).optional().describe("Free-text description"),
      type: z.enum(["TEXT", "DOCUMENT"]).optional().describe("Whether this input is free-text content or a linked document"),
      linkUrl: z.string().max(2000).optional().describe("URL to the document, when type is DOCUMENT"),
    },
  });
}
