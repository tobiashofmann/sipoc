# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SIPOC (a.k.a. "LIPOK" in code/German: Lieferant, Input, Prozess, Output, Kunde) diagram manager. Monorepo with four parts that talk over HTTP:

- `backend/server` — Java 25 / Spring Boot 4.1 / Spring Data JPA REST API (package `de.itsfullofstars.sipoc.server`)
- `frontend/sipoc-ui` — Angular 22 (standalone components, no NgModules) + SAP UI5 Web Components + Tailwind 4 + `@ngx-translate` (DE/EN)
- `sipoc-mcp-server` — Node/TypeScript MCP server (stdio) wrapping the backend REST API as tools
- `tests/` — CSV mock data + `seed-mock-data.ts` loader (not unit tests); `*-en.csv` variants are the English data

Domain model and every REST endpoint are in `SCHEMA.md` — read it before changing models/API. Design rationale is in `docs/adr/` (ADRs 0002–0009).

## Commands

Whole stack (backend + frontend + seed mock data): `./sipoc.sh start|status|stop` (also `sipoc.bat`/`sipoc.ps1`). `SIPOC_LANG=EN ./sipoc.sh start` seeds English data. Docker: `docker compose up --build` (`COMPOSE_PROFILES=mysql|postgresql` to pick DB).

Backend (`cd backend/server`, uses bundled Maven wrapper):
```sh
./mvnw checkstyle:check                 # lint (checkstyle.xml)
./mvnw verify                           # tests + JaCoCo coverage (target/site/jacoco)
./mvnw spring-boot:run                  # http://localhost:8080, Swagger at /swagger-ui/index.html
./mvnw test                             # all tests
./mvnw test -Dtest=ClassName#method     # single test
SPRING_PROFILES_ACTIVE=postgresql DB_HOST=... DB_PASSWORD=... ./mvnw spring-boot:run
```

Frontend (`cd frontend/sipoc-ui`): `npm install`, `npm start` (http://localhost:4200), `npm run build`, `npm test` (`ng test`), `npm run lint`, `npm run test:ci` (headless + Cobertura coverage in `coverage/`), `npm run docs` (Compodoc).

MCP server (`cd sipoc-mcp-server`): `npm run build`, `npm start`, `npm run dev`, `npm test` (node:test + tsx, mocked backend, specs in `test/`), `npm run lint` (Biome), `npm run test:coverage` (c8, Cobertura). Backend URL via `SIPOC_API_BASE_URL` (default `http://localhost:8080/api`). Must rebuild before `dist/` reflects changes.

Seeding against a running backend: `cd tests && npm install && npm run seed`.

## CI

`.github/workflows/ci.yml` lints, tests and measures coverage for backend, frontend and MCP server on pushes/PRs to `main`. Coverage is written as Cobertura XML, summarized in the job summary (`.github/scripts/coverage_summary.py`) and kept as a workflow artifact; JaCoCo output is converted by `.github/scripts/jacoco_to_cobertura.py`. GitHub Code Quality's coverage upload is not used (it needs GitHub Team/Enterprise). `main` is protected: work on feature branches and open PRs (see `.claude/skills/feature-branch-workflow`).

## Architecture notes

- **Database**: Spring profile `h2` (default, in-memory — data is lost on restart, by design), `mysql`, or `postgresql`. Schema comes from JPA entities (`ddl-auto=update`); there are **no migration files**, so entity changes take effect on restart.
- **Layering**: `controller` → `service` → `repository` (JPA entities in `model/`). Controllers only take/return DTOs (`dto/<Entity>Dtos.java`, public fields, nested classes); `mapper/` converts at the boundary. On `*UpdateDto`, `null` means "leave unchanged" (partial update), not "clear".
- **Constraints live in services, not the DB** (ADR 0007): e.g. a `LipokInput.supplier` must already be attached to the same Lipok, process step predecessors must not form cycles, detaching cascades link cleanup manually. These are enforced in `LipokService`/`GoService` — direct DB writes bypass them. Respect and extend this when adding link logic.
- **Data model quirk**: `BusinessPartner` has no supplier/customer type; the role is a property of the per-Lipok attachment (`LipokSupplier`/`LipokCustomer`), so one partner can be both in the same Lipok. IDs are String UUIDs; join tables use Long ids or composite keys.
- **Markdown export** (`LipokExportService.buildMarkdown()`) always uses fixed German headers (`Metadaten`, `Geschäftsobjekt`, `LIPOK`, `Lieferant`…). The SIPOC table aligns columns by row position only, and comments are not exported.
- **Frontend** feature folders under `src/app/` mirror backend aggregates (`business-partners/`, `gos/`, `sipocs/`, `home/`, `shared/`). UI strings go through ngx-translate (German + English).
- **MCP server** has one tool group per backend controller (`sipoc_<entity>_*`); when adding/changing backend endpoints, update the corresponding tools and `sipoc-mcp-server/README.md`.
- The API has no authentication.
