# 7. Cross-entity constraints enforced in the service layer, not the database

## Status

Accepted

## Context

The SIPOC data model (see [0005](0005-sipoc-data-model.md)) has relationships that a plain foreign
key can't express: "this `LipokInput.supplier` must already be attached to *this same* Lipok as a
`LipokSupplier`", "a `LipokProcessStep.predecessor` must not create a cycle", "removing a supplier
must also clear it from any input that referenced it." Modeling these in the database would mean
either check constraints H2/Postgres can't express relationally, or triggers — both outside
Hibernate's model and invisible to `ddl-auto=update` (see [0003](0003-in-memory-database-no-migrations.md)).

## Decision

Enforce these constraints in `LipokService` (and, for simpler cases, `GoService`) at the point of
mutation, throwing on violation (e.g. "Supplier is not part of this Lipok", "This predecessor would
create a cycle") rather than relying on the database to reject an invalid write. Cascading cleanup
(clearing a link when its target is detached) is likewise done explicitly in the service method
that performs the detach, not via `ON DELETE` behavior.

## Consequences

- All of this logic only runs when data is written through the service layer / REST API. A
  hypothetical direct-DB write (a script against H2, a future admin tool) would bypass every one of
  these constraints and could leave the data in a state the API itself would never produce.
- The constraints are explicit, readable Java (see the Javadoc on `LipokService`'s `link*`/
  `remove*` methods) rather than opaque SQL trigger logic — easier to reason about and test, at the
  cost of being invisible to anyone only looking at the DDL or an ER diagram.
- Because none of this is enforced at the DB level, `SCHEMA.md`'s "Constraints enforced by the
  service layer (not the DB)" section is the source of truth for these rules, not the schema.
