// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

/**
 * Type shapes actually used across the generic-typed API calls (`apiGet<T>`/`apiPost<T>`/...).
 * Most CRUD tools go through the generic factory (see crudFactory.ts) and pass responses through
 * as `Record<string, unknown>` instead, so only the entities with bespoke tool logic are typed
 * here — see SCHEMA.md for the full backend DTO shapes.
 */
export interface Audit {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type BoType = "PHYSICAL" | "VIRTUAL";
export type Importance = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Criticality = "PUBLIC" | "INTERNAL" | "PRIVATE" | "CONFIDENTIAL";

export interface CustomPropertyDto {
  key: string;
  value: string;
}

export interface GoDto {
  id: string;
  name: string;
  description?: string;
  category?: string;
  parentId?: string;
  type?: BoType;
  importance?: Importance;
  criticality?: Criticality;
  customProperties?: CustomPropertyDto[];
  audit: Audit;
}

export interface GoTreeNodeDto extends GoDto {
  children: GoTreeNodeDto[];
}

export interface LipokCommentDto {
  id: number;
  number: number;
  content: string;
  createdAt: string;
}

/** Mirrors the backend's `LipokDto`; the `lipok*Id` fields are join-row ids, needed to address the `.../link` and `.../customers` tools. */
export interface LipokDto {
  id: string;
  name: string;
  description?: string;
  gos: { id: string; name: string }[];
  suppliers: { id: string; name: string; position: number }[];
  inputs: { lipokInputId: number; id: string; name: string; position: number; supplierId?: string; processStepId?: string }[];
  processSteps: { lipokProcessStepId: number; id: string; name: string; position: number; predecessorId?: number }[];
  outputs: { lipokOutputId: number; id: string; name: string; position: number; processStepId?: string; customerIds: string[] }[];
  customers: { id: string; name: string; position: number }[];
  comments: LipokCommentDto[];
  audit: Audit;
}
