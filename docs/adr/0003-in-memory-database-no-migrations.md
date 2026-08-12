# 3. In-memory H2 database, schema derived from entities

## Status

Accepted

## Context

The application is a business-analysis tool for building and iterating on SIPOC diagrams — a
demo/working-session tool rather than a system of record with long-term data retention
requirements. The domain model (see [0005](0005-sipoc-data-model.md)) was also still actively
changing during development, which makes hand-written schema migrations expensive relative to the
value they'd provide at this stage.

## Decision

Use an in-memory H2 database (`jdbc:h2:mem:lipokdb`, `MODE=PostgreSQL`) with
`spring.jpa.hibernate.ddl-auto=update`, so the schema is derived directly from the JPA entity
annotations and there are no migration files (Flyway/Liquibase) to maintain. Mock data is loaded
on demand via the `tests/` CSV + `seed-mock-data.ts` script (or `./sipoc.sh start`) rather than
being baked into the database.

A direct, practical consequence of this choice: **data does not survive a backend restart**. This
is stated up front in `CLAUDE.md`, the root `README.md`, and `SCHEMA.md` so it's not mistaken for
a bug.

## Consequences

- Zero migration-authoring overhead while the model is still evolving — an entity field change is
  immediately reflected in the schema on the next restart.
- No durable persistence: this stack is unsuitable for anything beyond local development, demos,
  or ephemeral sessions without a follow-up decision to swap in a real database and introduce
  proper migrations (at which point `ddl-auto=update` should be replaced, not layered on top of a
  migration tool).
- `ddl-auto=update` can only additively evolve a schema (add tables/columns); it does not handle
  renames or destructive changes safely. This is acceptable today because the database is always
  rebuilt from scratch on restart, but would need to change before this database survives restarts.
- The H2 console (`/h2-console`) gives direct SQL access for debugging without any extra tooling.
