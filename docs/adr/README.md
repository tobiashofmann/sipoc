# Architecture Decision Records

This directory records the architectural decisions behind the SIPOCs application: what was
decided, the context that led to it, and the consequences the codebase now lives with. Each ADR
is a lightweight, immutable snapshot — if a decision changes later, add a new ADR that supersedes
the old one rather than editing history away.

| # | Title | Status |
| --- | --- | --- |
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-backend-stack.md) | Backend stack: Java, Spring Boot, Maven | Accepted |
| [0003](0003-in-memory-database-no-migrations.md) | In-memory H2 database, schema derived from entities | Accepted |
| [0004](0004-frontend-stack.md) | Frontend stack: Angular standalone components, SAP UI5 Web Components, Tailwind CSS | Accepted |
| [0005](0005-sipoc-data-model.md) | SIPOC data model: flat ordered join lists plus optional fine-grained links | Accepted |
| [0006](0006-dto-mapper-layer.md) | DTO/mapper layer decoupled from JPA entities | Accepted |
| [0007](0007-service-layer-constraints.md) | Cross-entity constraints enforced in the service layer, not the database | Accepted |
| [0008](0008-mcp-server-integration.md) | MCP server as a separate, optional integration | Accepted |
| [0009](0009-i18n-ngx-translate.md) | i18n via ngx-translate, German-first domain content | Accepted |

## Template

New ADRs should follow the same shape: **Status**, **Context**, **Decision**, **Consequences**.
Keep each one focused on a single decision.
