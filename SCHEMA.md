# Backend schema

Reference for the domain model and REST API exposed by `backend/server`. All entity IDs are
`String` UUIDs (server-generated on create), except join-table surrogate keys, which are `Long`
auto-increment identities, and the two pure many-to-many joins (`Go`↔`Lipok`, `BusinessPartner`↔`Input`),
which use a composite key of the two related IDs.

## Shared audit fields

Every top-level entity (`BusinessPartner`, `Input`, `ProcessStep`, `Output`, `Go`, `Lipok`)
carries these columns, exposed in API responses as `audit: { createdAt, createdBy, updatedAt, updatedBy }`:

| Field | Type | Notes |
| --- | --- | --- |
| createdAt | Instant | set on insert, never updated afterward |
| createdBy | String | defaults to `"system"` |
| updatedAt | Instant | refreshed on insert and update |
| updatedBy | String | defaults to `"system"` |

None of the entities have Bean Validation annotations — "required" below reflects DB column
nullability only, not API-level input validation.

## Master-data entities

### BusinessPartner (`business_partners`)

A real-world business partner (company, department, etc.). There is **no fixed "customer" or
"supplier" type** on the entity itself — a single `BusinessPartner` can be attached to any Lipok as
the supplier, the customer, or **both at once** (e.g. a purchasing department is the supplier of a
purchase request and the customer of its confirmation, within the very same Lipok). The role is
purely a property of the per-Lipok attachment (`LipokSupplier`/`LipokCustomer`), never of the
partner record.

| Field | Type | Required |
| --- | --- | --- |
| id | String | yes |
| name | String | yes |
| description | String (≤2000) | no |
| inputs | `BusinessPartnerInput[]` | — (via join table; general capability, independent of any Lipok) |

### Input (`inputs`)

| Field | Type | Required |
| --- | --- | --- |
| id | String | yes |
| name | String | yes |
| description | String (≤2000) | no |
| type | `DocumentableType` (`TEXT`\|`DOCUMENT`) | yes |
| linkUrl | String (≤2000) | no |
| partners | `BusinessPartnerInput[]` | — (via join table) |

### ProcessStep (`process_steps`)

| Field | Type | Required |
| --- | --- | --- |
| id | String | yes |
| name | String | yes |
| description | String (≤2000) | no |

### Output (`outputs`)

| Field | Type | Required |
| --- | --- | --- |
| id | String | yes |
| name | String | yes |
| description | String (≤2000) | no |
| type | `DocumentableType` (`TEXT`\|`DOCUMENT`) | yes |
| linkUrl | String (≤2000) | no |

### Go (`gos`) — hierarchical "Geschäftsobjekt" taxonomy, unrelated to `ProcessStep`

| Field | Type | Required |
| --- | --- | --- |
| id | String | yes |
| name | String | yes |
| description | String (≤2000) | no |
| category | String | no |
| parentId | String | no — self-referential, `null` for top-level nodes |
| type | `BoType` (`PHYSICAL`\|`VIRTUAL`) | no |
| importance | `Importance` (`LOW`\|`MEDIUM`\|`HIGH`\|`CRITICAL`) | no |
| criticality | `Criticality` (`PUBLIC`\|`INTERNAL`\|`PRIVATE`\|`CONFIDENTIAL`) | no |
| customProperties | `{ key, value }[]` | no — unique `(go_id, key)` pair |

### Lipok (`lipoks`) — a SIPOC instance

| Field | Type | Required |
| --- | --- | --- |
| id | String | yes |
| name | String | yes |
| description | String (≤2000) | no |
| gos / suppliers / inputs / processSteps / outputs / customers | see join entities below | — |
| comments | see `LipokComment` below | — |

### LipokComment (`lipok_comments`) — a free-text comment attached to a Lipok

Unlike the join entities below, `LipokComment` is an owned child entity (not a join) and carries
the standard audit fields (`createdAt`/`createdBy`/`updatedAt`/`updatedBy`).

| Field | Type | Required |
| --- | --- | --- |
| id | Long (auto-increment) | yes |
| lipok | Lipok (FK) | yes |
| number | Integer — 1-based, sequential **per Lipok** (1, 2, 3, …); assigned on creation as `max(existing) + 1`, never reused | yes |
| content | String (≤4000), Markdown source | yes |

The frontend renders `content` from Markdown to sanitized HTML for display; simple formatting
(bold, lists, links) is supported.

## Join entities

Join entities carry no audit fields.

| Entity | Table | Cardinality | Fields beyond the two FKs |
| --- | --- | --- | --- |
| BusinessPartnerInput | `business_partner_inputs` | BusinessPartner ↔ Input, M:N | — |
| LipokGo | `lipok_gos` | Lipok ↔ Go, M:N | — |
| LipokSupplier | `lipok_suppliers` | Lipok → BusinessPartner (supplier role), ordered | `position: Integer` |
| LipokProcessStep | `lipok_process_steps` | Lipok → ProcessStep, ordered | `position: Integer`, optional self-referential `predecessor` (another `LipokProcessStep` row in the same Lipok, `null` for the starting step) |
| LipokCustomer | `lipok_customers` | Lipok → BusinessPartner (customer role), ordered | `position: Integer` |
| LipokInput | `lipok_inputs` | Lipok → Input, ordered | `position: Integer`, optional `supplier` (a `BusinessPartner`), optional `processStep` (which supplier delivers / which step consumes this input, **within this Lipok**) |
| LipokOutput | `lipok_outputs` | Lipok → Output, ordered | `position: Integer`, optional `processStep` (which step produced this output), plus `customerLinks: LipokOutputCustomer[]` |
| LipokOutputCustomer | `lipok_output_customers` | LipokOutput ↔ BusinessPartner (customer role) | links a specific `LipokOutput` row (not the raw `Output`) to a `BusinessPartner` |

The same `BusinessPartner` can appear in both `LipokSupplier` and `LipokCustomer` for the same
Lipok — there is no exclusivity constraint between the two roles.

Constraints enforced by the service layer (not the DB): a `LipokInput.supplier`/`processStep` or
`LipokOutput.processStep` may only reference an entity that is **already attached to the same
Lipok** via `LipokSupplier`/`LipokProcessStep`. Likewise, a `LipokOutputCustomer` may only
reference a business partner already attached via `LipokCustomer`.

## REST API

Base path `/api`. Plain CRUD controllers (`business-partners`, `inputs`, `process-steps`,
`outputs`, `gos`, `lipoks`) all follow: `GET /` (paginated list), `POST /`, `GET /{id}`,
`PATCH /{id}`, `DELETE /{id}`.

Entity-specific extras:

- `POST /api/business-partners/{partnerId}/inputs/{inputId}` / `DELETE ...` — link/unlink `BusinessPartnerInput` (idempotent, no body).
- `GET /api/gos/tree` — full Go hierarchy as nested nodes.
- `GET /api/gos/{goId}/hierarchy` — a single Go node with its ancestor/descendant chain.
- `GET /api/lipoks/export` / `GET /api/lipoks/{id}/export` — markdown export (zip of all / one Lipok).

`GET /api/business-partners/{id}` additionally returns `lipokUsages: LipokUsageDto[]` — one entry
per Lipok this partner is attached to, with `inputs` populated when attached as the supplier there
and/or `outputs` populated when attached as the customer there (both can be set on the same entry):

```json
{
  id, name, description,
  inputs: [{ id, name }],
  lipokUsages: [
    { lipokId, lipokName, inputs: [{ id, name }], outputs: [{ id, name }] }
  ],
  audit
}
```

Attaching master data to a Lipok (creates the ordered join row; `position` is an optional query
param, defaults to append) and detaching it again (removes the join row, by the referenced
entity's own id, not the join row's id):

```rest
POST   /api/lipoks/{lipokId}/suppliers/{supplierId}?position={n}
POST   /api/lipoks/{lipokId}/inputs/{inputId}?position={n}
POST   /api/lipoks/{lipokId}/process-steps/{processStepId}?position={n}
POST   /api/lipoks/{lipokId}/outputs/{outputId}?position={n}
POST   /api/lipoks/{lipokId}/customers/{customerId}?position={n}

DELETE /api/lipoks/{lipokId}/suppliers/{supplierId}
DELETE /api/lipoks/{lipokId}/inputs/{inputId}
DELETE /api/lipoks/{lipokId}/process-steps/{processStepId}
DELETE /api/lipoks/{lipokId}/outputs/{outputId}
DELETE /api/lipoks/{lipokId}/customers/{customerId}
```

Reordering the already-attached entities within one of the four flat columns (not process steps,
which are ordered via `predecessorId` instead — see below), body `{ orderedIds: string[] }` where
`orderedIds` must be exactly the currently-attached entity ids in the desired new order (same set,
no duplicates, no foreign ids — otherwise 400):

```rest
PATCH /api/lipoks/{lipokId}/suppliers/reorder  body: { orderedIds }
PATCH /api/lipoks/{lipokId}/inputs/reorder     body: { orderedIds }
PATCH /api/lipoks/{lipokId}/outputs/reorder    body: { orderedIds }
PATCH /api/lipoks/{lipokId}/customers/reorder  body: { orderedIds }
```

Go attachment/detachment (no ordering):

```rest
POST   /api/lipoks/{lipokId}/gos/{goId}          # link existing Go
POST   /api/lipoks/{lipokId}/gos                 # create + link a new Go in one call, body = GoCreateDto
DELETE /api/lipoks/{lipokId}/gos/{goId}
```

Fine-grained links, addressed by the join-row's `lipokInputId`/`lipokOutputId`/`lipokProcessStepId`
(returned in the `LipokDto.inputs[]`/`outputs[]`/`processSteps[]` arrays after attaching):

```rest
PATCH /api/lipoks/{lipokId}/inputs/{lipokInputId}/link              body: { supplierId?, processStepId? }
PATCH /api/lipoks/{lipokId}/outputs/{lipokOutputId}/link            body: { processStepId? }
PATCH /api/lipoks/{lipokId}/process-steps/{lipokProcessStepId}/link body: { predecessorId? }

POST /api/lipoks/{lipokId}/outputs/{lipokOutputId}/customers/{customerId}
DELETE /api/lipoks/{lipokId}/outputs/{lipokOutputId}/customers/{customerId}
```

Comments (Markdown source in, `number` assigned server-side):

```rest
POST /api/lipoks/{lipokId}/comments               body: { content }
PATCH /api/lipoks/{lipokId}/comments/{commentId}  body: { content }
DELETE /api/lipoks/{lipokId}/comments/{commentId}
```

The full `LipokDto` returned by every Lipok endpoint:

```json
{
  id, name, description,
  gos:          [{ id, name }],
  suppliers:    [{ id, name, position }],
  inputs:       [{ lipokInputId, id, name, position, supplierId, processStepId }],
  processSteps: [{ lipokProcessStepId, id, name, position, predecessorId }],
  outputs:      [{ lipokOutputId, id, name, position, processStepId, customerIds }],
  customers:    [{ id, name, position }],
  comments:     [{ id, number, content, createdAt }],
  audit
}
```

Mock data matching this schema lives in [`tests/`](tests/) — see [`tests/README.md`](tests/README.md).
