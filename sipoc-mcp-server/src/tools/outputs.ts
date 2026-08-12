import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerCrudTools } from "./crudFactory.js";

/** Registers the standard CRUD tools for `/api/outputs`. */
export function registerOutputTools(server: McpServer): void {
  registerCrudTools(server, {
    toolPrefix: "sipoc_output",
    pathSegment: "outputs",
    displayName: "output",
    createShape: {
      name: z.string().min(1).describe("Display name of the output"),
      description: z.string().max(2000).optional().describe("Free-text description"),
      type: z.enum(["TEXT", "DOCUMENT"]).describe("Whether this output is free-text content or a linked document"),
      linkUrl: z.string().max(2000).optional().describe("URL to the document, when type is DOCUMENT"),
    },
    updateShape: {
      name: z.string().min(1).optional().describe("Display name of the output"),
      description: z.string().max(2000).optional().describe("Free-text description"),
      type: z.enum(["TEXT", "DOCUMENT"]).optional().describe("Whether this output is free-text content or a linked document"),
      linkUrl: z.string().max(2000).optional().describe("URL to the document, when type is DOCUMENT"),
    },
  });
}
