// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

/** Base URL of the SIPOC backend's REST API; override via the `SIPOC_API_BASE_URL` env var. */
export const API_BASE_URL = process.env.SIPOC_API_BASE_URL ?? "http://localhost:8080/api";

/** Guardrail so a single tool response can't blow out an agent's context window (see {@link toBoundedJson}). */
export const CHARACTER_LIMIT = 25000;

/** Default `size` for list tools when the caller doesn't specify one. */
export const DEFAULT_PAGE_SIZE = 20;
