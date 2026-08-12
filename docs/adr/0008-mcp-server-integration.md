# 8. MCP server as a separate, optional integration

## Status

Accepted

## Context

There was a desire to let LLM clients (Claude Code, Claude Desktop, VS Code) browse and edit SIPOC
data directly, without a human driving the Angular UI for every read/write. Building that as
another consumer of a bespoke API, or embedding LLM-specific concerns into the main backend, would
couple the core application to a specific integration that not every deployment needs.

## Decision

Ship a standalone `sipoc-mcp-server` package (Node/TypeScript) implementing the
[Model Context Protocol](https://modelcontextprotocol.io) over stdio. It talks to the existing
backend purely over the same public REST API the Angular frontend uses (`SIPOC_API_BASE_URL`,
defaulting to `http://localhost:8080/api`) — no shared code, database access, or special backend
endpoints. Tools are grouped one-to-one with backend controllers (business partners, inputs,
process steps, outputs, gos, lipoks), and most follow a generic CRUD factory
(`tools/crudFactory.ts`) that takes untyped `Record<string, unknown>` responses, since the backend
already validates/shapes the data — a second, parallel type system per entity would just be another
place for the two to drift apart. `tools/linkFactory.ts` similarly factors out the shared
attach/detach-with-position pattern used by four of the five SIPOC columns.

## Consequences

- The backend has zero knowledge of, or dependency on, the MCP server — it can be deleted, or a
  second alternative integration added, without touching `backend/server` at all.
- Because it calls the public REST API, the MCP server is automatically kept honest against the
  same constraints the backend enforces (see [0007](0007-service-layer-constraints.md)); it cannot
  bypass them the way a direct-DB integration could.
- The generic CRUD/link factories mean adding a new plain-CRUD entity to the backend only needs a
  small new `tools/<entity>.ts` registering shapes, not a new bespoke tool implementation — but it
  also means entity-specific validation quirks are only visible via the Zod shapes passed in, not
  through dedicated per-entity types.
