// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { CHARACTER_LIMIT } from "./constants.js";

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page index, 0-based
  size: number;
}

/** Normalizes a Spring Data `Page<T>` response into a compact, agent-friendly shape. */
export function formatPage<T>(page: SpringPage<T>) {
  return {
    items: page.content,
    page: page.number,
    pageSize: page.size,
    totalItems: page.totalElements,
    totalPages: page.totalPages,
    hasMore: page.number + 1 < page.totalPages,
  };
}

/** Serializes a value to JSON text, truncating the array under `arrayKey` if the result is too large. */
export function toBoundedJson(value: Record<string, unknown>, arrayKey: string): string {
  let text = JSON.stringify(value, null, 2);
  if (text.length <= CHARACTER_LIMIT) return text;

  const array = value[arrayKey];
  if (!Array.isArray(array)) return text.slice(0, CHARACTER_LIMIT);

  const truncated = array.slice(0, Math.max(1, Math.floor(array.length / 2)));
  const truncatedValue = {
    ...value,
    [arrayKey]: truncated,
    truncated: true,
    truncationMessage: `Response truncated from ${array.length} to ${truncated.length} items. Narrow your query (filters, smaller page size) to see the rest.`,
  };
  text = JSON.stringify(truncatedValue, null, 2);
  return text.length <= CHARACTER_LIMIT ? text : text.slice(0, CHARACTER_LIMIT);
}

export function toolResult(json: Record<string, unknown>, arrayKey = "items") {
  const text = toBoundedJson(json, arrayKey);
  return {
    content: [{ type: "text" as const, text }],
    structuredContent: json,
  };
}

export function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true as const };
}
