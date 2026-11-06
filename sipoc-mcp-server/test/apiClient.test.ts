// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { ApiError, apiDelete, apiGet, apiGetBinary, apiPatch, apiPost, handleApiError } from "../src/services/apiClient.js";
import { jsonResponse, mockFetch } from "./helpers.js";

let restore: (() => void) | undefined;
afterEach(() => restore?.());

describe("apiClient requests", () => {
  it("GET builds the URL with query params and skips undefined values", async () => {
    const m = mockFetch(() => jsonResponse({ ok: true }));
    restore = m.restore;
    const result = await apiGet<{ ok: boolean }>("/lipoks", { page: 1, size: 20, filter: undefined });
    assert.deepEqual(result, { ok: true });
    assert.equal(m.requests[0].url.pathname, "/api/lipoks");
    assert.equal(m.requests[0].url.searchParams.get("page"), "1");
    assert.equal(m.requests[0].url.searchParams.get("size"), "20");
    assert.equal(m.requests[0].url.searchParams.has("filter"), false);
    assert.equal(m.requests[0].method, "GET");
  });

  it("POST/PATCH send the body as JSON", async () => {
    const m = mockFetch(() => jsonResponse({ id: "1" }));
    restore = m.restore;
    await apiPost("/inputs", { name: "x" });
    await apiPatch("/inputs/1", { name: "y" });
    assert.equal(m.requests[0].method, "POST");
    assert.deepEqual(m.requests[0].body, { name: "x" });
    assert.equal(m.requests[1].method, "PATCH");
    assert.deepEqual(m.requests[1].body, { name: "y" });
    assert.equal(m.requests[0].headers["Content-Type"], "application/json");
  });

  it("returns undefined for 204 and for empty bodies", async () => {
    const m = mockFetch((req) => (req.method === "DELETE" ? new Response(null, { status: 204 }) : new Response("", { status: 200 })));
    restore = m.restore;
    assert.equal(await apiDelete("/inputs/1"), undefined);
    assert.equal(await apiGet("/inputs/1"), undefined);
  });

  it("throws ApiError with status and response text on HTTP errors", async () => {
    const m = mockFetch(() => new Response("bad input", { status: 400 }));
    restore = m.restore;
    await assert.rejects(apiGet("/inputs"), (e: unknown) => e instanceof ApiError && e.status === 400 && e.message === "bad input");
  });

  it("wraps network failures as ApiError with status 0", async () => {
    const m = mockFetch(() => {
      throw new Error("ECONNREFUSED");
    });
    restore = m.restore;
    await assert.rejects(apiGet("/inputs"), (e: unknown) => e instanceof ApiError && e.status === 0 && /ECONNREFUSED/.test(e.message));
  });

  it("apiGetBinary returns the raw bytes and asks for a zip", async () => {
    const m = mockFetch(() => new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    restore = m.restore;
    const buf = await apiGetBinary("/lipoks/1/export");
    assert.deepEqual([...new Uint8Array(buf)], [1, 2, 3]);
    assert.equal(m.requests[0].headers["Accept"], "application/zip");
  });
});

describe("handleApiError", () => {
  it("maps known statuses to actionable messages", () => {
    assert.match(handleApiError(new ApiError(0, "down")), /backend running/);
    assert.match(handleApiError(new ApiError(404, ""), "input"), /input not found/);
    assert.match(handleApiError(new ApiError(400, "oops")), /invalid request — oops/);
    assert.match(handleApiError(new ApiError(409, "dup")), /conflict — dup/);
    assert.match(handleApiError(new ApiError(500, "boom")), /status 500/);
  });

  it("handles non-ApiError values", () => {
    assert.match(handleApiError(new Error("x")), /unexpected error occurred: x/);
    assert.match(handleApiError("str"), /unexpected error occurred: str/);
  });
});
