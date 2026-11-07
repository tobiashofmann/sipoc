# Contributing

Thanks for your interest in improving SIPOC Management App! Please also read our
[Code of Conduct](CODE_OF_CONDUCT.md).

## Bugs & ideas

Please open an [issue](https://github.com/tobiashofmann/sipoc/issues) first —
for bugs, feature ideas, or questions about a rule. It's recommended (not required) to have
an issue for every pull request, so the "why" behind a change is captured.

## Making a change

- Work on a feature branch (`feature/...`, `fix/...`, `chore/...`) — `main` is protected,
  no direct commits.
- Keep pull requests small and focused on one logical change. Several small PRs are
  preferred over one large one.
- Open the pull request against `main`.

## Getting started

The repository has three modules that talk over HTTP: the backend REST API, the Angular frontend and the MCP server. You only need the toolchain of the module you work on. See the [README](README.md) for the overall architecture.

### Whole stack (quickest way to try it out)

Requires Java 25 and Node.js 24 (or just Docker, see the [README](README.md#quick-start-docker)):

```bash
./sipoc.sh start    # starts backend + frontend and seeds mock data
./sipoc.sh status
./sipoc.sh stop
```

### Backend (`backend/server`)

Java 25, Spring Boot, Maven (use the bundled wrapper). Start it with the default in-memory H2 database:

```bash
cd backend/server
./mvnw spring-boot:run            # http://localhost:8080, Swagger UI at /swagger-ui/index.html
./mvnw test                       # unit and integration tests
./mvnw checkstyle:check           # lint
./mvnw verify                     # tests + JaCoCo coverage (target/site/jacoco)
```

Read [`SCHEMA.md`](SCHEMA.md) before changing the model or the API.

### Frontend (`frontend/sipoc-ui`)

Angular, Node.js 24. Needs the backend running on `http://localhost:8080` (for example via `./sipoc.sh start`).

```bash
cd frontend/sipoc-ui
npm install
npm start                         # http://localhost:4200
npm run lint
npm test                          # Karma + Jasmine, opens Chrome
npm run test:ci                   # headless, with coverage
```

UI strings go through ngx-translate: add them in German and English.

### MCP server (`sipoc-mcp-server`)

Node.js 24 / TypeScript. Needs the backend running (override the URL with `SIPOC_API_BASE_URL`).

```bash
cd sipoc-mcp-server
npm install
npm run build                     # dist/ only reflects changes after a rebuild
npm run dev                       # run from source with tsx
npm run lint
npm test                          # unit tests with a mocked backend
npm run test:coverage
```

When you add or change backend endpoints, update the matching MCP tools and [`sipoc-mcp-server/README.md`](sipoc-mcp-server/README.md). See [`sipoc-mcp-server/MCP_TESTING.md`](sipoc-mcp-server/MCP_TESTING.md) for testing with the MCP Inspector.

## Before opening a PR

- Code should be documented where the *why* isn't obvious.
- New or changed behavior needs tests.
- The CI pipeline must pass.

## Architecture

See /docs and the ADRs. Also look at [`CLAUDE.md`](CLAUDE.md) for details on the project's architecture and conventions
