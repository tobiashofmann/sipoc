# sipoc-mcp-server

An MCP (Model Context Protocol) server that exposes the SIPOC/LIPOK backend's REST API
(`backend/server`) as tools for LLM clients — see `../SCHEMA.md` for the underlying domain
model and endpoints this wraps.

## Setup

```sh
npm install
npm run build
```

## Running

Requires the backend to be running (`../sipoc.sh start`, or `./mvnw spring-boot:run` from
`backend/server`), reachable by default at `http://localhost:8080/api`. Override with
`SIPOC_API_BASE_URL` if it runs elsewhere.

```sh
npm start                 # stdio transport, for MCP clients (Claude Desktop, Claude Code, etc.)
npm run dev                # tsx watch mode for development
```

## Tools

One tool group per backend controller in `SCHEMA.md`:

- `sipoc_business_partner_*` — CRUD + input linking
- `sipoc_input_*`, `sipoc_process_step_*`, `sipoc_output_*` — CRUD
- `sipoc_go_*` — CRUD + `sipoc_go_tree` / `sipoc_go_hierarchy`
- `sipoc_lipok_*` — CRUD, attach/detach of suppliers/inputs/process-steps/outputs/customers/gos,
  fine-grained links (`sipoc_lipok_link_input` / `_link_output` / `_link_process_step`), output
  customer links, comments, and Markdown export (`sipoc_lipok_export_all` / `_export_one`, which
  save the returned zip to a local temp file and return its path)

## MCP client configuration

Add to `.vscode/mcp.json` (or your client's equivalent):

```json
{
  "sipoc-mcp-server": {
    "type": "stdio",
    "command": "node",
    "args": ["sipoc-mcp-server/dist/index.js"]
  }
}
```
