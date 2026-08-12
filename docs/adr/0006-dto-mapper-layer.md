# 6. DTO/mapper layer decoupled from JPA entities

## Status

Accepted

## Context

JPA entities (`model/`) carry Hibernate-specific concerns — lazy-loaded collections, bidirectional
associations, `@PrePersist` lifecycle callbacks — that don't translate cleanly to JSON. Serializing
entities directly would risk `LazyInitializationException`s outside a transaction, leak internal
association shape (e.g. `LipokGo`/`LipokSupplier` join rows instead of a flat `{id, name}`), and
tightly couple the wire format to the persistence model, so a schema refactor would also be an API
break.

## Decision

Keep a dedicated `dto/` layer (one `<Entity>Dtos.java` grouping class per aggregate, nested DTO
classes/records for list items, detail views, create/update payloads) and a dedicated `mapper/`
layer (one `<Entity>Mapper.java` per aggregate) that converts between entities and DTOs. Controllers
only ever receive/return DTOs; services operate on entities internally and call into the mapper at
the boundary. DTO fields are plain public fields (no getters/setters) since they're pure data
carriers with no behavior.

On `*UpdateDto` types, a `null` field means "leave this field unchanged" (a partial-update/PATCH
semantic), not "clear the field" — enforced by the service methods doing
`if (dto.field != null) entity.setField(dto.field)` rather than unconditional assignment. The one
documented exception is `Go`'s `customProperties`, where a non-null list fully replaces the
existing set rather than merging.

## Consequences

- Every entity requires a parallel set of DTOs and mapper methods to stay in sync by hand — a new
  entity field needs a deliberate decision about whether/where it's exposed, rather than shipping
  automatically.
- The API surface is decoupled from the persistence model, so internal refactors of the JPA
  entities (renaming an association, splitting a table) don't automatically become breaking API
  changes.
- The `null`-means-unchanged PATCH convention means a client cannot use `PATCH` to explicitly clear
  a nullable field back to `null` for most fields — that would require either a sentinel value or a
  dedicated endpoint, neither of which exists today.
