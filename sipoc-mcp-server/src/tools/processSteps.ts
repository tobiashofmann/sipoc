import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerCrudTools } from "./crudFactory.js";

/** Registers the standard CRUD tools for `/api/process-steps`. */
export function registerProcessStepTools(server: McpServer): void {
  registerCrudTools(server, {
    toolPrefix: "sipoc_process_step",
    pathSegment: "process-steps",
    displayName: "process step",
    createShape: {
      name: z.string().min(1).describe("Display name of the process step"),
      description: z.string().max(2000).optional().describe("Free-text description"),
    },
    updateShape: {
      name: z.string().min(1).optional().describe("Display name of the process step"),
      description: z.string().max(2000).optional().describe("Free-text description"),
    },
  });
}
