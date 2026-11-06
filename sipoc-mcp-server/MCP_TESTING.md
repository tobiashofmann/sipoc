# Testing the MCP Server

This guide explains how to test the SIPOC MCP server with the official [MCP Inspector](https://github.com/modelcontextprotocol/inspector). The Inspector starts the server over stdio and provides a UI (and a CLI mode) for listing and calling its tools.

## Prerequisites

The MCP tools wrap the backend REST API, so the backend must be running.

From the repository root:

```sh
./sipoc.sh start     # starts backend + frontend and seeds mock data
./sipoc.sh status    # verify it is up
```

Then build the MCP server. `dist/` only reflects changes after a rebuild.

```sh
cd sipoc-mcp-server
npm install
npm run build
```

## Run the Inspector (UI)

```sh
npx @modelcontextprotocol/inspector node dist/index.js
```

To use a backend other than the default (`http://localhost:8080/api`), set `SIPOC_API_BASE_URL`:

```sh
SIPOC_API_BASE_URL=http://localhost:8080/api npx @modelcontextprotocol/inspector node dist/index.js
```

Open the URL printed in the terminal (usually `http://localhost:6274`). If the URL contains a proxy session token, use it as printed.

1. Click **Connect**.
2. Open the **Tools** tab and click **List Tools**. The `sipoc_<entity>_*` tools should appear.
3. Select a tool, fill in its parameters and click **Run Tool**.

A good first smoke test is a read-only list tool (for example `sipoc_lipoks_list`; use whatever name the tool list shows).

## Iterating without rebuilding

Run the TypeScript sources directly via `tsx`:

```sh
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

## CLI mode (scriptable, no UI)

```sh
# List all tools
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/list

# Call a tool with arguments
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call --tool-name <tool> --tool-arg key=value
```

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| **List Tools** works, but calls fail with connection errors | Backend not reachable at `SIPOC_API_BASE_URL`. Check `./sipoc.sh status`. |
| `Cannot find module '.../dist/index.js'` on connect | The Inspector was started from the wrong directory. Run it from `sipoc-mcp-server/`, or pass an absolute path to `dist/index.js`. |
| `http://localhost:8080/api` returns 404 | Expected. Only sub-paths exist (e.g. `/api/lipoks`). Keep the base URL as `.../api` and test with `http://localhost:8080/api/lipoks`. |
| Tools or behavior don't reflect code changes | `dist/` is stale. Run `npm run build`, or use the `tsx` variant above. |
| Tool calls return empty lists | Backend runs on in-memory H2, so data is lost on restart. Re-seed with `cd tests && npm run seed`. |
| `npm run dev` fails to start `tsx` | npm blocked the `esbuild` install script. Run `npm install-scripts approve`. |
