# Mock data

CSV-based mock data for the SIPOC backend, one file per entity/relation (see [`../SCHEMA.md`](../SCHEMA.md)
for the underlying data model). Loaded into a running backend via a small TypeScript script.

Each CSV row is identified by a human-readable `key` column instead of a real database id. The
loader creates each row through the REST API, remembers the id the backend assigned, and uses that
mapping to resolve `*Key` references in the relation CSVs (e.g. `lipok-inputs.csv`'s `supplierKey`).

## Files

- `business-partners.csv`, `inputs.csv`, `process-steps.csv`, `outputs.csv`, `gos.csv`, `lipoks.csv` — master data, one row per entity. A business partner has no fixed "customer" or "supplier" type — the same partner can be attached as supplier and/or customer to any Lipok (see `abteilung-einkauf` in the sample data, which is both in the same Lipok).
- `business-partner-inputs.csv` — which business partner delivers which input (`BusinessPartnerInput`, master-data-level, independent of any Lipok).
- `lipok-suppliers.csv`, `lipok-customers.csv` — attaches business partners to a Lipok, in the supplier or customer role respectively, with a `position`.
- `lipok-process-steps.csv` — attaches process steps to a Lipok with a `position`, plus an optional `predecessorKey` (another row's `processStepKey` within the same `lipokKey`) defining the step's predecessor in the process chain; empty means it's the starting step.
- `lipok-inputs.csv`, `lipok-outputs.csv` — attaches inputs/outputs to a Lipok with a `position`, plus the optional within-Lipok link (`supplierKey`/`processStepKey` for inputs, `processStepKey` for outputs).
- `lipok-gos.csv` — attaches Gos to a Lipok (unordered).
- `lipok-output-customers.csv` — which customer(s) receive a given Lipok output.

## Usage

Requires Node.js. The backend must already be running (see the root [`README.md`](../README.md)).

```sh
cd tests
npm install
npm run seed
```

By default the script targets `http://localhost:8080`; override with `SIPOC_BASE_URL`.
