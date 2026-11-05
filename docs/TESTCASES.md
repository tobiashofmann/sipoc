# Test cases

Overview of the functional test cases for backend and frontend: what is tested and why, the test script that
implements it, the test technology, and whether it is covered yet.

## Legend

| Column | Meaning |
| --- | --- |
| **ID** | `BE-` = backend, `FE-` = frontend |
| **Test script** | Where the test lives (`Class#method` / `file › describe › it`). Entries marked *(planned)* do not exist yet; the name is a proposal |
| **Unit** | ✔ = isolated test of one class/function/component, no Spring context and no HTTP |
| **UI** | ✔ = renders a component/page and checks the DOM or user interaction (Karma/TestBed or browser) |
| **Integration** | ✔ = several layers together (controller → service → repository → H2 DB via MockMvc / real HTTP) |
| **Status** | ✔ = implemented, **X** = not covered yet |

Run: backend `cd backend/server && ./mvnw test`, frontend `cd frontend/sipoc-ui && npm test`.
Current coverage: 6 implemented tests, the rest of the list is open.

## Backend

Existing tests are in `backend/server/src/test/java/de/itsfullofstars/sipoc/server/`. Business rules live in
the services, not in the DB (ADR 0007), so they can only be verified through the service/API layer.

### Application and CRUD

| ID | Functional test | Description (why / what) | Test script | Unit | UI | Integration | Status |
| --- | --- | --- | --- | :-: | :-: | :-: | :-: |
| BE-001 | Application context starts | Safety net: wiring, JPA mapping and H2 profile are valid, the app boots. | `ServerApplicationTests#contextLoads` | | | ✔ | ✔ |
| BE-002 | Create and read master data | Business partners, inputs, process steps, outputs, Gos and Lipoks can be created (`201`) and read back by id. | `*ControllerIntegrationTest#create_andGetById` *(planned)* | | | ✔ | X |
| BE-003 | Partial update (PATCH) | On `*UpdateDto`, `null` means "leave unchanged", not "clear". Prevents accidentally wiping fields. | `*ControllerIntegrationTest#patch_nullFieldsStayUnchanged` *(planned)* | | | ✔ | X |
| BE-004 | Delete master data | `DELETE /{id}` removes the entity; a following `GET` returns `404`. | `*ControllerIntegrationTest#delete_removesEntity` *(planned)* | | | ✔ | X |
| BE-005 | Paginated list | `GET /` returns a page, `page`/`size` are respected. | `*ControllerIntegrationTest#list_isPaginated` *(planned)* | | | ✔ | X |
| BE-006 | Audit fields | `createdAt`/`updatedAt` are set on insert, `updatedAt` changes on update, `createdAt` does not; `createdBy`/`updatedBy` default to `system`. | `AuditIntegrationTest#audit_setOnCreateAndRefreshedOnUpdate` *(planned)* | | | ✔ | X |
| BE-007 | Unknown id returns 404 | `GET`/`PATCH`/`DELETE` with a non-existent id gives a clean error, not a 500. | `*ControllerIntegrationTest#unknownId_returns404` *(planned)* | | | ✔ | X |

### Business partners

| ID | Functional test | Description (why / what) | Test script | Unit | UI | Integration | Status |
| --- | --- | --- | --- | :-: | :-: | :-: | :-: |
| BE-010 | Link/unlink partner ↔ input | `POST/DELETE /business-partners/{p}/inputs/{i}` is idempotent: a second call changes nothing and does not fail. | `BusinessPartnerIntegrationTest#linkInput_isIdempotent` *(planned)* | | | ✔ | X |
| BE-011 | `lipokUsages` in partner detail | The partner detail lists each Lipok the partner is attached to, with `inputs` (as supplier) and/or `outputs` (as customer), both possible on the same entry. | `BusinessPartnerIntegrationTest#detail_returnsLipokUsages` *(planned)* | | | ✔ | X |
| BE-012 | Partner as supplier and customer in the same Lipok | There is no exclusivity between the roles (core data model decision). | `LipokIntegrationTest#partner_canBeSupplierAndCustomer` *(planned)* | | | ✔ | X |

### Gos (business object hierarchy)

| ID | Functional test | Description (why / what) | Test script | Unit | UI | Integration | Status |
| --- | --- | --- | --- | :-: | :-: | :-: | :-: |
| BE-020 | Go tree | `GET /gos/tree` returns the full hierarchy as nested nodes. | `GoIntegrationTest#tree_returnsNestedNodes` *(planned)* | | | ✔ | X |
| BE-021 | Go hierarchy of a node | `GET /gos/{id}/hierarchy` returns the node with its ancestor and descendant chain. | `GoIntegrationTest#hierarchy_returnsAncestorsAndDescendants` *(planned)* | | | ✔ | X |
| BE-022 | Duplicate custom property key rejected | `(go_id, key)` must be unique; a duplicate key is refused (`GoService`, `IllegalArgumentException`). | `GoServiceTest#duplicateCustomPropertyKey_isRejected` *(planned)* | ✔ | | | X |
| BE-023 | Go enums | `type`, `importance` and `criticality` accept the documented values; invalid values are refused. | `GoIntegrationTest#invalidEnum_isRejected` *(planned)* | | | ✔ | X |

### Lipok: attach and detach

| ID | Functional test | Description (why / what) | Test script | Unit | UI | Integration | Status |
| --- | --- | --- | --- | :-: | :-: | :-: | :-: |
| BE-030 | Attach entity to Lipok | `POST /lipoks/{id}/{suppliers\|inputs\|process-steps\|outputs\|customers}/{entityId}` creates the ordered join row. | `LipokAttachIntegrationTest#attach_createsJoinRow` *(planned)*; attaching is only used as setup in `LipokReorderIntegrationTest` | | | ✔ | X |
| BE-031 | `position` on attach | Without `?position` the entity is appended; with `?position=n` it is inserted there. | `LipokAttachIntegrationTest#attach_respectsPosition` *(planned)* | | | ✔ | X |
| BE-032 | Detach entity | `DELETE` removes the join row by the referenced entity id; detaching something not attached is an error. | `LipokAttachIntegrationTest#detach_removesJoinRow` *(planned)* | | | ✔ | X |
| BE-033 | Detach cleans up links | Detaching a supplier/process step/customer manually removes the links that referenced it (input supplier, output customer links, predecessor). | `LipokAttachIntegrationTest#detach_cascadesLinkCleanup` *(planned)* | | | ✔ | X |
| BE-034 | Attach / detach Go | Link an existing Go, create and link a new Go in one call, detach a Go; detaching a Go that is not attached fails. | `LipokGoIntegrationTest#attachCreateDetach` *(planned)* | | | ✔ | X |

### Lipok: reorder

| ID | Functional test | Description (why / what) | Test script | Unit | UI | Integration | Status |
| --- | --- | --- | --- | :-: | :-: | :-: | :-: |
| BE-040 | Reorder suppliers | Backs drag and drop of supplier tiles; the order changes to the given `orderedIds`. | `LipokReorderIntegrationTest#reorderSuppliers_movesTileToNewPosition` | | | ✔ | ✔ |
| BE-041 | Reorder rejects invalid id lists | Unknown ids or duplicates in `orderedIds` give `400`, the order stays unchanged. | `LipokReorderIntegrationTest#reorderSuppliers_rejectsIdsNotMatchingCurrentAttachment` | | | ✔ | ✔ |
| BE-042 | Reorder inputs, outputs, customers | Same behavior for the other three flat columns. | `LipokReorderIntegrationTest#reorderInputsOutputsCustomers_movesTilesToNewPosition` | | | ✔ | ✔ |
| BE-043 | Reorder rejects incomplete list | `orderedIds` must contain exactly the attached ids; a missing id is `400`. | `LipokReorderIntegrationTest#reorder_rejectsMissingId` *(planned)* | | | ✔ | X |
| BE-044 | Reorder on empty column | Reordering an empty list on an empty column succeeds without error. | `LipokReorderIntegrationTest#reorder_emptyColumn` *(planned)* | | | ✔ | X |

### Lipok: links and constraints (ADR 0007)

| ID | Functional test | Description (why / what) | Test script | Unit | UI | Integration | Status |
| --- | --- | --- | --- | :-: | :-: | :-: | :-: |
| BE-050 | Input supplier must be part of the Lipok | `PATCH .../inputs/{id}/link` with a supplier that is not attached to this Lipok is refused. | `LipokLinkIntegrationTest#inputLink_rejectsForeignSupplier` *(planned)* | | | ✔ | X |
| BE-051 | Input and output process step must be part of the Lipok | Same rule for `processStepId` on inputs and outputs. | `LipokLinkIntegrationTest#link_rejectsForeignProcessStep` *(planned)* | | | ✔ | X |
| BE-052 | Link set and cleared | `supplierId`/`processStepId` can be set and cleared again; the `LipokDto` shows the result. | `LipokLinkIntegrationTest#inputLink_setAndClear` *(planned)* | | | ✔ | X |
| BE-053 | Output customer must be part of the Lipok | `POST .../outputs/{id}/customers/{customerId}` only for partners attached as customer. | `LipokLinkIntegrationTest#outputCustomer_rejectsForeignPartner` *(planned)* | | | ✔ | X |
| BE-054 | Add and remove output customer | A customer link can be added and removed; `customerIds` in the DTO follows. | `LipokLinkIntegrationTest#outputCustomer_addAndRemove` *(planned)* | | | ✔ | X |
| BE-055 | Process step cannot be its own predecessor | `predecessorId` pointing at itself is refused. | `LipokServiceTest#predecessor_self_isRejected` *(planned)* | ✔ | | ✔ | X |
| BE-056 | Predecessor cycle detection | A predecessor that would form a cycle (A→B→C→A) is refused. | `LipokServiceTest#predecessor_cycle_isRejected` *(planned)* | ✔ | | ✔ | X |
| BE-057 | Predecessor chain valid | A valid chain can be built and changed; `null` makes a step the start step. | `LipokLinkIntegrationTest#predecessor_validChain` *(planned)* | | | ✔ | X |

### Lipok: comments

| ID | Functional test | Description (why / what) | Test script | Unit | UI | Integration | Status |
| --- | --- | --- | --- | :-: | :-: | :-: | :-: |
| BE-060 | Comment numbers are sequential | `number` is `max(existing)+1` per Lipok, starts at 1. | `LipokCommentIntegrationTest#create_assignsSequentialNumbers` *(planned)* | | | ✔ | X |
| BE-061 | Numbers are never reused | After deleting comment 2 of 3, the next comment is 4. | `LipokCommentIntegrationTest#delete_doesNotReuseNumber` *(planned)* | | | ✔ | X |
| BE-062 | Edit and delete comment | `PATCH` changes `content`; `DELETE` of a comment from another Lipok fails. | `LipokCommentIntegrationTest#updateAndDelete` *(planned)* | | | ✔ | X |

### Export

| ID | Functional test | Description (why / what) | Test script | Unit | UI | Integration | Status |
| --- | --- | --- | --- | :-: | :-: | :-: | :-: |
| BE-070 | Markdown has fixed German headers | `buildMarkdown()` always uses `Metadaten`, `Geschäftsobjekt`, `LIPOK`, `Lieferant` …, regardless of UI language. | `LipokExportServiceTest#buildMarkdown_usesGermanHeaders` *(planned)* | ✔ | | | X |
| BE-071 | SIPOC table aligns by row position | Columns are aligned only by row index; shorter columns get empty cells. | `LipokExportServiceTest#buildMarkdown_alignsColumnsByRow` *(planned)* | ✔ | | | X |
| BE-072 | Comments are not exported | Comments must not appear in the markdown. | `LipokExportServiceTest#buildMarkdown_omitsComments` *(planned)* | ✔ | | | X |
| BE-073 | Export endpoints return a zip | `GET /lipoks/{id}/export` and `GET /lipoks/export` return a zip with the expected file(s) and content type. | `LipokExportIntegrationTest#export_returnsZip` *(planned)* | | | ✔ | X |
| BE-074 | Export matches the sample | The export of the mock data matches `docs/example-export.md`. | `LipokExportIntegrationTest#export_matchesExample` *(planned)* | | | ✔ | X |

### Other

| ID | Functional test | Description (why / what) | Test script | Unit | UI | Integration | Status |
| --- | --- | --- | --- | :-: | :-: | :-: | :-: |
| BE-080 | CORS configuration | The frontend origin (`localhost:4200`) may call the API (`WebConfig`). | `WebConfigIntegrationTest#cors_allowsFrontendOrigin` *(planned)* | | | ✔ | X |
| BE-081 | Mapper conversion | Mappers convert entity ↔ DTO correctly, including `audit` and ordered lists. | `LipokMapperTest#toDto_mapsOrderedColumns` *(planned)* | ✔ | | | X |
| BE-082 | MySQL and PostgreSQL profiles | The schema is created on both DBs (`ddl-auto=update`, no migrations). | `ProfilesIT` with Testcontainers *(planned)* | | | ✔ | X |

## Frontend

Existing tests are in `frontend/sipoc-ui/src/app/` (Karma + Jasmine, `ng test`). All UI strings go through
ngx-translate (DE/EN); the API calls go to `http://localhost:8080/api`.

### Application shell

| ID | Functional test | Description (why / what) | Test script | Unit | UI | Integration | Status |
| --- | --- | --- | --- | :-: | :-: | :-: | :-: |
| FE-001 | App component is created | Smoke test: the root component can be instantiated. | `app.component.spec.ts › AppComponent › should create the app` | ✔ | | | ✔ |
| FE-002 | Shellbar branding | The shellbar shows the "SIPOCs" branding. | `app.component.spec.ts › AppComponent › should render the shellbar branding` | | ✔ | | ✔ |
| FE-003 | Navigation and routes | The routes `''`, `business-partners`, `sipocs`, `gos` open the matching list component. | `app.routes.spec.ts › routes resolve to components` *(planned)* | ✔ | | | X |
| FE-004 | Language switch DE/EN | Switching the language changes labels and is remembered. | `app.component.spec.ts › language switch` *(planned)* | | ✔ | | X |
| FE-005 | Responsive layout | `ViewportService` reports phone/desktop; the shell adapts. | `viewport.service.spec.ts` *(planned)* | ✔ | | | X |

### Services (HTTP)

| ID | Functional test | Description (why / what) | Test script | Unit | UI | Integration | Status |
| --- | --- | --- | --- | :-: | :-: | :-: | :-: |
| FE-010 | Services call the right endpoints | `BusinessPartnerService`, `GoService`, `SipocService` use the right method, URL and body (`HttpTestingController`). | `*.service.spec.ts › calls <METHOD> /api/...` *(planned)* | ✔ | | | X |
| FE-011 | Download helper | `download.util.ts` triggers a file download with the correct name for the export zip. | `download.util.spec.ts` *(planned)* | ✔ | | | X |
| FE-012 | Home statistics | `HomeStatsService` counts partners, Gos and SIPOCs from the API. | `home-stats.service.spec.ts` *(planned)* | ✔ | | | X |
| FE-013 | Entry catalog | `EntryCatalogService` provides the master data for the attach dialogs. | `entry-catalog.service.spec.ts` *(planned)* | ✔ | | | X |

### Business partner pages

| ID | Functional test | Description (why / what) | Test script | Unit | UI | Integration | Status |
| --- | --- | --- | --- | :-: | :-: | :-: | :-: |
| FE-020 | List, search and sort | The list shows all partners; filtering narrows it. | `business-partner-list.component.spec.ts › list and filter` *(planned)* | | ✔ | | X |
| FE-021 | Create, edit, delete with confirm | The delete dialog asks for confirmation with the partner name. | `business-partner-list.component.spec.ts › delete confirm` *(planned)* | | ✔ | | X |
| FE-022 | Detail shows usage | The detail shows linked inputs and the Lipoks where the partner is supplier/customer. | `business-partner-detail.component.spec.ts › lipokUsages` *(planned)* | | ✔ | | X |

### Gos

| ID | Functional test | Description (why / what) | Test script | Unit | UI | Integration | Status |
| --- | --- | --- | --- | :-: | :-: | :-: | :-: |
| FE-030 | Go tree display | The hierarchy is rendered as a tree with parent/child nesting. | `go-list.component.spec.ts › renders tree` *(planned)* | | ✔ | | X |
| FE-031 | Go create/edit with properties | Create and edit a Go including parent, enums and custom properties (key/value). | `go-detail.component.spec.ts › edit properties` *(planned)* | | ✔ | | X |
| FE-032 | Go delete confirm | The delete dialog shows the Go name and deletes only after confirm. | `go-list.component.spec.ts › delete confirm` *(planned)* | | ✔ | | X |

### SIPOCs (Lipok)

| ID | Functional test | Description (why / what) | Test script | Unit | UI | Integration | Status |
| --- | --- | --- | --- | :-: | :-: | :-: | :-: |
| FE-040 | List and create SIPOC | The list shows SIPOCs; a new one can be created and opened. | `sipoc-list.component.spec.ts › list and create` *(planned)* | | ✔ | | X |
| FE-041 | Five columns (S-I-P-O-C) | The detail renders suppliers, inputs, process steps, outputs, customers in order. | `sipoc-detail.component.spec.ts › renders five columns` *(planned)* | | ✔ | | X |
| FE-042 | Attach and detach tiles | Selecting an entry in the dialog attaches it; removing a tile detaches it. | `sipoc-detail.component.spec.ts › attach and detach` *(planned)* | | ✔ | | X |
| FE-043 | Drag-and-drop reorder | Dragging a tile calls the reorder endpoint with the new `orderedIds`. | `sipoc-detail.component.spec.ts › drag reorder sends orderedIds` *(planned)* | | ✔ | | X |
| FE-044 | Link input to supplier/step | An input can be linked to a supplier and a process step; the link is shown. | `sipoc-detail.component.spec.ts › link input` *(planned)* | | ✔ | | X |
| FE-045 | Process-step predecessor | Setting a predecessor works; a rejected cycle (backend error) is shown to the user. | `sipoc-detail.component.spec.ts › predecessor error` *(planned)* | | ✔ | | X |
| FE-046 | Comments with Markdown | Comments are rendered from Markdown as sanitized HTML (no script/event handlers from content). | `sipoc-detail.component.spec.ts › comment markdown is sanitized` *(planned)* | | ✔ | | X |
| FE-047 | Markdown export download | The export button downloads the zip of the SIPOC. | `sipoc-detail.component.spec.ts › export download` *(planned)* | | ✔ | | X |
| FE-048 | Backend error handling | A `400`/`500` from the API shows an error message instead of a blank page. | `sipoc-detail.component.spec.ts › api error` *(planned)* | | ✔ | | X |

### End to end

| ID | Functional test | Description (why / what) | Test script | Unit | UI | Integration | Status |
| --- | --- | --- | --- | :-: | :-: | :-: | :-: |
| FE-050 | Build a SIPOC end to end | Create partner, input, step, output; attach all to a SIPOC, link, reorder, export — against a real backend with seeded data. | `e2e/sipoc-flow.spec.ts` (Playwright) *(planned)* | | ✔ | ✔ | X |
| FE-051 | Seed script loads mock data | `tests/seed-mock-data.ts` loads DE and EN data without errors against a fresh backend. | `tests/seed-mock-data.ts` run in CI *(planned)* | | | ✔ | X |
| FE-052 | MCP server tools | The `sipoc_<entity>_*` tools match the backend endpoints. | `sipoc-mcp-server` smoke test *(planned)* | | | ✔ | X |
