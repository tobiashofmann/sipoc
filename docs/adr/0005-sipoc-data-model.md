# 5. SIPOC data model: flat ordered join lists plus optional fine-grained links

## Status

Accepted

## Context

A SIPOC diagram has two things to represent at once: the classic five-column table (Suppliers,
Inputs, Process steps, Outputs, Customers) as simple ordered lists a user fills in top-to-bottom,
and the actual relationships between entries — which supplier delivers which input, which step
produced which output, which customer(s) receive it, and the process step order (a chain, not
just positions in a column). Modeling only the rich relationships would make the simple "just add
an entry to a column" flow (the common case while building a SIPOC) awkward; modeling only the flat
columns would lose real information the tool is meant to capture.

Similarly, a real-world business partner (a company, a department) does not have one fixed role.
The same partner can be a Lipok's supplier, its customer, or both at once within the very same
Lipok (e.g. a purchasing department is the supplier of a purchase request and the customer of its
confirmation) — modeling "customer" and "supplier" as fixed types on `BusinessPartner` would make
that impossible to express without duplicate partner records.

## Decision

- `BusinessPartner` carries no supplier/customer flag. The role is a property of the *attachment*
  to a specific Lipok, expressed via separate join entities (`LipokSupplier`, `LipokCustomer`); the
  same partner id can appear in both for the same Lipok.
- Each of a Lipok's five SIPOC columns is a flat, `position`-ordered list of join rows
  (`LipokSupplier`, `LipokInput`, `LipokProcessStep`, `LipokOutput`, `LipokCustomer`), added via
  simple `POST /api/lipoks/{id}/{column}/{entityId}?position=`. This is the only thing a user has
  to interact with to build a basic SIPOC.
- Layered on top, **optional** fine-grained links capture the richer relationships without being
  required: `LipokInput.supplier`/`processStep`, `LipokOutput.processStep` plus
  `LipokOutputCustomer` (a join keyed off the `LipokOutput` row, not the raw `Output`, so the same
  output attached to two different Lipoks can have different customers), and
  `LipokProcessStep.predecessor` — a self-referential pointer forming the actual process chain,
  independent of `position`. All of these fields are nullable, so the flat add-only flow keeps
  working unchanged if a user never sets them.
- The service layer (not the database) enforces that a fine-grained link may only reference an
  entity already attached to the *same* Lipok (e.g. `LipokInput.supplier` must already exist as a
  `LipokSupplier` row on that Lipok), and cascades cleanup when the referenced attachment is
  removed (e.g. removing a supplier clears it from any input that referenced it).

## Consequences

- Two ways to represent the same domain concept (flat position vs. fine-grained link) means two
  things can disagree — e.g. a supplier and an input can sit on the same table row by `position`
  in the Markdown export without actually being linked via `LipokInput.supplier`. The export's
  "Known limitations" section in the root `README.md` calls this out explicitly.
- The link constraints living in `LipokService` rather than DB foreign keys/triggers means they're
  only enforced through the REST API — any future direct-DB write path would bypass them.
- Adding a business partner to a Lipok twice in different roles is a first-class, well-supported
  case rather than a workaround, matching how these processes actually work in practice.
