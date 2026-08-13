import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { parseCsv } from "./csv.ts";

const BASE_URL = process.env.SIPOC_BASE_URL ?? "http://localhost:8080";
const DIR = dirname(fileURLToPath(import.meta.url));

async function postJson(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function post(path: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function patchJson(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`PATCH ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function csv(name: string): Record<string, string>[] {
  const lang = getLanguage();
  const suffix = lang && lang.toLowerCase() !== "de" ? `-${lang.toLowerCase()}` : "";
  const candidate = join(DIR, `${name}${suffix}.csv`);
  if (suffix && existsSync(candidate)) {
    console.log(`Using mock file: ${name}${suffix}.csv (lang=${lang.toUpperCase()})`);
    return parseCsv(candidate);
  }
  // Fallback to default (German) file
  const fallback = join(DIR, `${name}.csv`);
  console.log(`Using mock file: ${name}.csv (default)`);
  return parseCsv(fallback);
}

function getLanguage(): string {
  // Priority: CLI --lang=, positional first arg, environment SIPOC_LANG, default 'de'
  const env = process.env.SIPOC_LANG;
  if (env && env.trim() !== "") return env.trim();
  const arg = process.argv.slice(2).find((a) => a.startsWith("--lang="));
  if (arg) return arg.split("=")[1];
  const pos = process.argv[2];
  if (pos && /^[A-Za-z]{2}$/.test(pos)) return pos;
  return "de";
}

function orNull(value: string | undefined): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

/** key -> id maps, filled while seeding */
const partnerIds = new Map<string, string>();
const inputIds = new Map<string, string>();
const processStepIds = new Map<string, string>();
const outputIds = new Map<string, string>();
const goIds = new Map<string, string>();
const lipokIds = new Map<string, string>();
/** (lipokKey, inputKey/outputKey/processStepKey) -> join-row id, needed for /link and /customers endpoints */
const lipokInputIds = new Map<string, number>();
const lipokOutputIds = new Map<string, number>();
const lipokProcessStepIds = new Map<string, number>();

async function seedBusinessPartners() {
  for (const row of csv("business-partners")) {
    const dto = await postJson("/api/business-partners", {
      name: row.name,
      description: orNull(row.description),
    });
    partnerIds.set(row.key, dto.id);
  }
  console.log(`Seeded ${partnerIds.size} business partners`);
}

async function seedInputs() {
  for (const row of csv("inputs")) {
    const dto = await postJson("/api/inputs", {
      name: row.name,
      description: orNull(row.description),
      type: row.type,
      linkUrl: orNull(row.linkUrl),
    });
    inputIds.set(row.key, dto.id);
  }
  console.log(`Seeded ${inputIds.size} inputs`);
}

async function seedProcessSteps() {
  for (const row of csv("process-steps")) {
    const dto = await postJson("/api/process-steps", {
      name: row.name,
      description: orNull(row.description),
    });
    processStepIds.set(row.key, dto.id);
  }
  console.log(`Seeded ${processStepIds.size} process steps`);
}

async function seedOutputs() {
  for (const row of csv("outputs")) {
    const dto = await postJson("/api/outputs", {
      name: row.name,
      description: orNull(row.description),
      type: row.type,
      linkUrl: orNull(row.linkUrl),
    });
    outputIds.set(row.key, dto.id);
  }
  console.log(`Seeded ${outputIds.size} outputs`);
}

/** Gos form a tree (parentKey); create parents before children. */
async function seedGos() {
  const rows = csv("gos");
  const pending = new Map(rows.map((row) => [row.key, row]));

  while (pending.size > 0) {
    const ready = [...pending.values()].filter((row) => {
      const parentKey = orNull(row.parentKey);
      return parentKey === null || goIds.has(parentKey);
    });
    if (ready.length === 0) {
      throw new Error(
        `Cannot resolve go parents, check for cycles or missing keys: ${[...pending.keys()].join(", ")}`
      );
    }
    for (const row of ready) {
      const parentKey = orNull(row.parentKey);
      const dto = await postJson("/api/gos", {
        name: row.name,
        description: orNull(row.description),
        category: orNull(row.category),
        parentId: parentKey ? goIds.get(parentKey) : null,
        type: orNull(row.type),
        importance: orNull(row.importance),
        criticality: orNull(row.criticality),
      });
      goIds.set(row.key, dto.id);
      pending.delete(row.key);
    }
  }
  console.log(`Seeded ${goIds.size} gos`);
}

async function seedLipoks() {
  for (const row of csv("lipoks")) {
    const dto = await postJson("/api/lipoks", {
      name: row.name,
      description: orNull(row.description),
    });
    lipokIds.set(row.key, dto.id);
  }
  console.log(`Seeded ${lipokIds.size} lipoks`);
}

async function seedBusinessPartnerInputs() {
  const rows = csv("business-partner-inputs");
  for (const row of rows) {
    const partnerId = partnerIds.get(row.partnerKey);
    const inputId = inputIds.get(row.inputKey);
    await post(`/api/business-partners/${partnerId}/inputs/${inputId}`);
  }
  console.log(`Linked ${rows.length} business-partner-input pairs`);
}

async function seedLipokSuppliers() {
  const rows = csv("lipok-suppliers");
  for (const row of rows) {
    const lipokId = lipokIds.get(row.lipokKey);
    const supplierId = partnerIds.get(row.supplierKey);
    await post(`/api/lipoks/${lipokId}/suppliers/${supplierId}?position=${row.position}`);
  }
  console.log(`Attached ${rows.length} lipok suppliers`);
}

async function seedLipokProcessSteps() {
  const rows = csv("lipok-process-steps");
  for (const row of rows) {
    const lipokId = lipokIds.get(row.lipokKey);
    const processStepId = processStepIds.get(row.processStepKey);
    const position = Number(row.position);
    const lipok = await post(`/api/lipoks/${lipokId}/process-steps/${processStepId}?position=${position}`);
    const entry = lipok.processSteps.find((p: any) => p.id === processStepId && p.position === position);
    lipokProcessStepIds.set(`${row.lipokKey}:${row.processStepKey}`, entry.lipokProcessStepId);
  }
  console.log(`Attached ${rows.length} lipok process steps`);

  for (const row of rows) {
    const predecessorKey = orNull(row.predecessorKey);
    if (!predecessorKey) continue;
    const lipokId = lipokIds.get(row.lipokKey);
    const lipokProcessStepId = lipokProcessStepIds.get(`${row.lipokKey}:${row.processStepKey}`);
    const predecessorId = lipokProcessStepIds.get(`${row.lipokKey}:${predecessorKey}`);
    await patchJson(`/api/lipoks/${lipokId}/process-steps/${lipokProcessStepId}/link`, { predecessorId });
  }
}

async function seedLipokInputs() {
  const rows = csv("lipok-inputs");
  for (const row of rows) {
    const lipokId = lipokIds.get(row.lipokKey);
    const inputId = inputIds.get(row.inputKey);
    const position = Number(row.position);
    const lipok = await post(`/api/lipoks/${lipokId}/inputs/${inputId}?position=${position}`);
    const entry = lipok.inputs.find((i: any) => i.id === inputId && i.position === position);
    lipokInputIds.set(`${row.lipokKey}:${row.inputKey}`, entry.lipokInputId);

    const supplierKey = orNull(row.supplierKey);
    const processStepKey = orNull(row.processStepKey);
    if (supplierKey || processStepKey) {
      await patchJson(`/api/lipoks/${lipokId}/inputs/${entry.lipokInputId}/link`, {
        supplierId: supplierKey ? partnerIds.get(supplierKey) : null,
        processStepId: processStepKey ? processStepIds.get(processStepKey) : null,
      });
    }
  }
  console.log(`Attached ${rows.length} lipok inputs`);
}

async function seedLipokOutputs() {
  const rows = csv("lipok-outputs");
  for (const row of rows) {
    const lipokId = lipokIds.get(row.lipokKey);
    const outputId = outputIds.get(row.outputKey);
    const position = Number(row.position);
    const lipok = await post(`/api/lipoks/${lipokId}/outputs/${outputId}?position=${position}`);
    const entry = lipok.outputs.find((o: any) => o.id === outputId && o.position === position);
    lipokOutputIds.set(`${row.lipokKey}:${row.outputKey}`, entry.lipokOutputId);

    const processStepKey = orNull(row.processStepKey);
    if (processStepKey) {
      await patchJson(`/api/lipoks/${lipokId}/outputs/${entry.lipokOutputId}/link`, {
        processStepId: processStepIds.get(processStepKey),
      });
    }
  }
  console.log(`Attached ${rows.length} lipok outputs`);
}

async function seedLipokCustomers() {
  const rows = csv("lipok-customers");
  for (const row of rows) {
    const lipokId = lipokIds.get(row.lipokKey);
    const customerId = partnerIds.get(row.customerKey);
    await post(`/api/lipoks/${lipokId}/customers/${customerId}?position=${row.position}`);
  }
  console.log(`Attached ${rows.length} lipok customers`);
}

async function seedLipokGos() {
  const rows = csv("lipok-gos");
  for (const row of rows) {
    const lipokId = lipokIds.get(row.lipokKey);
    const goId = goIds.get(row.goKey);
    await post(`/api/lipoks/${lipokId}/gos/${goId}`);
  }
  console.log(`Attached ${rows.length} lipok gos`);
}

async function seedLipokOutputCustomers() {
  const rows = csv("lipok-output-customers");
  for (const row of rows) {
    const lipokId = lipokIds.get(row.lipokKey);
    const customerId = partnerIds.get(row.customerKey);
    const lipokOutputId = lipokOutputIds.get(`${row.lipokKey}:${row.outputKey}`);
    await post(`/api/lipoks/${lipokId}/outputs/${lipokOutputId}/customers/${customerId}`);
  }
  console.log(`Linked ${rows.length} lipok output-customer pairs`);
}

async function main() {
  console.log(`Seeding mock data into ${BASE_URL} ...`);

  // Master data first (no dependencies between these).
  await seedBusinessPartners();
  await seedInputs();
  await seedProcessSteps();
  await seedOutputs();
  await seedGos();
  await seedLipoks();

  // Master-data-to-master-data links.
  await seedBusinessPartnerInputs();

  // Attach master data to lipoks in dependency order: suppliers/process-steps
  // before inputs/outputs (so the optional supplier/processStep link on a
  // lipok-input/output can reference an already-attached row).
  await seedLipokSuppliers();
  await seedLipokProcessSteps();
  await seedLipokInputs();
  await seedLipokOutputs();
  await seedLipokCustomers();
  await seedLipokGos();

  // Per-output customer links (need the lipok-output join-row ids from above).
  await seedLipokOutputCustomers();

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
