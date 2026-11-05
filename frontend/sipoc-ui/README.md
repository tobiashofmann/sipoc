# SIPOCs frontend (`frontend/sipoc-ui`)

Angular UI for the SIPOCs application — browsing/editing business partners, the Go taxonomy, and
SIPOC instances (Lieferant/Input/Prozess/Output/Kunde) against the [backend](../../backend/server)
REST API. Standalone components (no `NgModule`s), [SAP UI5 Web Components](https://ui5.sap.com/)
as the widget library, Tailwind CSS for layout, `@ngx-translate` for i18n. See the root
[`README.md`](../../README.md) for the project as a whole.

## Requirements

- Node.js 24+ and npm

## Running it

```sh
npm install
npm start   # ng serve
```

Opens on [http://localhost:4200](http://localhost:4200) and expects the backend to already be
running at `http://localhost:8080` — start it first (see
[`../../backend/server/README.md`](../../backend/server/README.md)). The backend base URL is
fixed at build time in `src/environments/environment.ts`, not configurable via an env var at
runtime.

### Running from the repo root

`../../sipoc.sh start` starts the frontend *and* backend together (plus mock-data seeding) in one
command — see the root README. There's no script for starting just the frontend on its own; use
`npm start` directly for that.

## Docker

Build and run the frontend as a standalone container (a static build served by nginx; no compose,
no backend):

```sh
docker build -t sipoc-frontend .
docker run -p 4200:80 sipoc-frontend
```

The backend base URL baked into this build is still `http://localhost:8080/api` (see above), so
this container expects a backend reachable at that address from the browser — for the frontend
*and* backend together, use `docker compose` from the repo root instead, see the root
[`README.md`](../../README.md#quick-start-docker).

## Special commands

```sh
npm run build            # production build -> dist/sipoc-ui/
npm run watch             # incremental dev build, no dev server
npm test                  # unit tests (Karma/Jasmine)
npm run docs               # generate component/service docs -> documentation/index.html (Compodoc)
npm run docs:serve         # same, then serve them on http://localhost:8080 (Compodoc's own server)
```

Scaffold a new component/service/etc. with the Angular CLI:

```sh
npx ng generate component some-feature/some-thing
npx ng generate --help   # full list of schematics
```

**Translations** — UI strings live in [`public/i18n/de.json`](public/i18n/de.json) and
[`public/i18n/en.json`](public/i18n/en.json) (German + English); add a new user-facing string to
both files rather than hardcoding it in a template.

## Code layout

Feature folders under `src/app/` mirror the backend aggregates: `business-partners/`, `gos/`,
`sipocs/` (Lipok UI), `home/` (dashboard), `shared/` (cross-cutting services like
`viewport.service.ts`). Each typically has a `*.model.ts`, `*.service.ts` (HTTP calls to the
backend), and list/detail components (`.component.ts` + `.component.html`). See `CLAUDE.md` at the
repo root for the full contributor workflow.
