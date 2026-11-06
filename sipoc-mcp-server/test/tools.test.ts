// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { connectClient, jsonResponse, mockFetch, textOf } from "./helpers.js";

let restore: (() => void) | undefined;
afterEach(() => restore?.());

describe("tool registration", () => {
  it("registers CRUD and Lipok attach/detach tools for every entity", async () => {
    const { client, close } = await connectClient();
    const names = (await client.listTools()).tools.map((t) => t.name);
    await close();

    for (const prefix of ["sipoc_business_partner", "sipoc_input", "sipoc_process_step", "sipoc_output", "sipoc_go"]) {
      for (const op of ["list", "get", "create", "update", "delete"]) {
        assert.ok(names.includes(`${prefix}_${op}`), `missing ${prefix}_${op}`);
      }
    }
    for (const noun of ["supplier", "input", "process_step", "output", "customer"]) {
      assert.ok(names.includes(`sipoc_lipok_attach_${noun}`), `missing attach ${noun}`);
      assert.ok(names.includes(`sipoc_lipok_detach_${noun}`), `missing detach ${noun}`);
    }
    assert.equal(new Set(names).size, names.length, "tool names must be unique");
    assert.ok(names.every((n) => n.startsWith("sipoc_")));
  });
});

describe("CRUD tools", () => {
  it("list calls the paginated endpoint and normalizes the Spring page", async () => {
    const m = mockFetch(() => jsonResponse({ content: [{ id: "1", name: "A" }], totalElements: 1, totalPages: 1, number: 0, size: 20 }));
    restore = m.restore;
    const { client, close } = await connectClient();
    const res = await client.callTool({ name: "sipoc_input_list", arguments: { page: 0, size: 5 } });
    await close();

    assert.equal(m.requests[0].url.pathname, "/api/inputs");
    assert.equal(m.requests[0].url.searchParams.get("size"), "5");
    const body = JSON.parse(textOf(res));
    assert.equal(body.totalItems, 1);
    assert.equal(body.hasMore, false);
    assert.deepEqual(body.items, [{ id: "1", name: "A" }]);
  });

  it("create POSTs the arguments", async () => {
    const m = mockFetch(() => jsonResponse({ id: "9", name: "In", type: "TEXT" }));
    restore = m.restore;
    const { client, close } = await connectClient();
    const res = await client.callTool({ name: "sipoc_input_create", arguments: { name: "In", type: "TEXT" } });
    await close();

    assert.equal(m.requests[0].method, "POST");
    assert.deepEqual(m.requests[0].body, { name: "In", type: "TEXT" });
    assert.equal(JSON.parse(textOf(res)).id, "9");
  });

  it("update PATCHes only the fields besides id", async () => {
    const m = mockFetch(() => jsonResponse({ id: "9" }));
    restore = m.restore;
    const { client, close } = await connectClient();
    await client.callTool({ name: "sipoc_input_update", arguments: { id: "9", name: "New" } });
    await close();

    assert.equal(m.requests[0].method, "PATCH");
    assert.equal(m.requests[0].url.pathname, "/api/inputs/9");
    assert.deepEqual(m.requests[0].body, { name: "New" });
  });

  it("delete returns a confirmation", async () => {
    const m = mockFetch(() => new Response(null, { status: 204 }));
    restore = m.restore;
    const { client, close } = await connectClient();
    const res = await client.callTool({ name: "sipoc_input_delete", arguments: { id: "9" } });
    await close();

    assert.equal(m.requests[0].method, "DELETE");
    assert.deepEqual(JSON.parse(textOf(res)), { deleted: true, id: "9" });
  });

  it("maps a 404 to an error result instead of throwing", async () => {
    const m = mockFetch(() => new Response("", { status: 404 }));
    restore = m.restore;
    const { client, close } = await connectClient();
    const res = await client.callTool({ name: "sipoc_input_get", arguments: { id: "nope" } });
    await close();

    assert.equal(res.isError, true);
    assert.match(textOf(res), /input not found/);
  });

  it("reports an unreachable backend with a hint", async () => {
    const m = mockFetch(() => {
      throw new Error("ECONNREFUSED");
    });
    restore = m.restore;
    const { client, close } = await connectClient();
    const res = await client.callTool({ name: "sipoc_input_list", arguments: {} });
    await close();

    assert.equal(res.isError, true);
    assert.match(textOf(res), /sipoc\.sh start/);
  });

  it("rejects invalid arguments before calling the backend", async () => {
    const m = mockFetch(() => jsonResponse({}));
    restore = m.restore;
    const { client, close } = await connectClient();
    const res = await client.callTool({ name: "sipoc_input_create", arguments: { name: "", type: "BOGUS" } }).catch((e) => e);
    await close();

    assert.equal(m.requests.length, 0);
    assert.ok(res instanceof Error || res.isError === true);
  });
});

describe("Lipok attach/detach tools", () => {
  it("attach POSTs with the position query param", async () => {
    const m = mockFetch(() => jsonResponse({ id: "L1" }));
    restore = m.restore;
    const { client, close } = await connectClient();
    await client.callTool({ name: "sipoc_lipok_attach_supplier", arguments: { lipokId: "L1", entityId: "S1", position: 2 } });
    await close();

    assert.equal(m.requests[0].method, "POST");
    assert.equal(m.requests[0].url.pathname, "/api/lipoks/L1/suppliers/S1");
    assert.equal(m.requests[0].url.searchParams.get("position"), "2");
  });

  it("attach without position appends (no query param)", async () => {
    const m = mockFetch(() => jsonResponse({ id: "L1" }));
    restore = m.restore;
    const { client, close } = await connectClient();
    await client.callTool({ name: "sipoc_lipok_attach_process_step", arguments: { lipokId: "L1", entityId: "P1" } });
    await close();

    assert.equal(m.requests[0].url.pathname, "/api/lipoks/L1/process-steps/P1");
    assert.equal(m.requests[0].url.searchParams.has("position"), false);
  });

  it("detach issues a DELETE and surfaces conflicts", async () => {
    const m = mockFetch(() => new Response("still referenced", { status: 409 }));
    restore = m.restore;
    const { client, close } = await connectClient();
    const res = await client.callTool({ name: "sipoc_lipok_detach_customer", arguments: { lipokId: "L1", entityId: "C1" } });
    await close();

    assert.equal(m.requests[0].method, "DELETE");
    assert.equal(m.requests[0].url.pathname, "/api/lipoks/L1/customers/C1");
    assert.equal(res.isError, true);
    assert.match(textOf(res), /conflict — still referenced/);
  });
});
