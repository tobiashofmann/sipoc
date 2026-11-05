# 2. Backend stack: Java, Spring Boot, Maven

## Status

Accepted

## Context

The backend needed to expose a REST API over a moderately relational domain model (SIPOC
instances with several ordered join entities — see [0005](0005-sipoc-data-model.md)) with minimal
custom infrastructure: request routing, JSON serialization, a persistence layer, and interactive
API documentation, without hand-rolling any of it.

## Decision

Build the backend as a Spring Boot 4 application (Java 25) using Spring Web for REST controllers,
Spring Data JPA for persistence, and Maven (via the Maven wrapper, `mvnw`) as the build tool.
`springdoc-openapi` generates the OpenAPI spec and Swagger UI directly from the controllers/DTOs,
so API docs stay in sync with the code without a separate spec-authoring step.

The codebase is layered as `model` (JPA entities) → `repository` (Spring Data JPA repositories) →
`service` (business logic and cross-entity constraints) → `mapper` (entity ⇄ DTO conversion) →
`controller` (thin REST handlers), one file/class per aggregate or entity in each layer.

## Consequences

- Spring Boot's auto-configuration and Spring Data JPA's repository derivation (e.g.
  `findDistinctBySuppliers_Supplier_Id`) remove most persistence boilerplate, at the cost of
  "magic" that's less explicit than hand-written SQL/DAO code.
- Swagger UI (`/swagger-ui/index.html`) and the OpenAPI JSON (`/v3/api-docs`) are available for
  free as soon as a controller/DTO exists — useful for manual exploration and for the
  `sipoc-mcp-server` integration (see [0008](0008-mcp-server-integration.md)) to reference the
  same contract.
- Controllers stay thin (routing + status codes only); all business logic and validation lives in
  `service/`, which is what `SCHEMA.md` and the ADRs describe, not the controllers.
