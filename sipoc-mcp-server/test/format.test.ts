// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_LIMIT } from "../src/constants.js";
import { errorResult, formatPage, toBoundedJson, toolResult } from "../src/format.js";

describe("formatPage", () => {
  it("maps a Spring page and computes hasMore", () => {
    const page = { content: ["a", "b"], totalElements: 5, totalPages: 3, number: 0, size: 2 };
    assert.deepEqual(formatPage(page), { items: ["a", "b"], page: 0, pageSize: 2, totalItems: 5, totalPages: 3, hasMore: true });
    assert.equal(formatPage({ ...page, number: 2 }).hasMore, false);
  });
});

describe("toBoundedJson", () => {
  it("returns small values unchanged", () => {
    assert.equal(toBoundedJson({ items: [1] }, "items"), JSON.stringify({ items: [1] }, null, 2));
  });

  it("truncates the named array when too large and flags it", () => {
    const items = Array.from({ length: 400 }, (_, i) => ({ i, pad: "x".repeat(50) }));
    const parsed = JSON.parse(toBoundedJson({ items }, "items"));
    assert.equal(parsed.truncated, true);
    assert.ok(parsed.items.length < items.length);
    assert.match(parsed.truncationMessage, /truncated from 400/);
  });

  it("hard-cuts oversized values without an array", () => {
    const text = toBoundedJson({ big: "x".repeat(CHARACTER_LIMIT * 2) }, "items");
    assert.equal(text.length, CHARACTER_LIMIT);
  });
});

describe("toolResult / errorResult", () => {
  it("toolResult carries text and structured content", () => {
    const r = toolResult({ a: 1 });
    assert.equal(r.structuredContent.a, 1);
    assert.equal(JSON.parse(r.content[0].text).a, 1);
  });

  it("errorResult flags isError", () => {
    assert.deepEqual(errorResult("nope"), { content: [{ type: "text", text: "nope" }], isError: true });
  });
});
