// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { AuditDto, Page } from '../business-partners/business-partner.model';

export interface SipocListItem {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedItemDto {
  id: string;
  name: string;
}

export interface SipocGoDto extends LinkedItemDto {
  description: string | null;
}

export interface OrderedItemDto {
  id: string;
  name: string;
  position: number;
}

export interface SipocInputDto extends OrderedItemDto {
  lipokInputId: number;
  supplierId: string | null;
  processStepId: string | null;
}

export interface SipocOutputDto extends OrderedItemDto {
  lipokOutputId: number;
  processStepId: string | null;
  customerIds: string[];
}

export interface SipocProcessStepDto extends OrderedItemDto {
  lipokProcessStepId: number;
  predecessorId: number | null;
}

export interface SipocCommentDto {
  id: number;
  number: number;
  content: string;
  createdAt: string;
}

/**
 * Mirrors the backend's `LipokDto` (see SCHEMA.md). `lipokInputId`/`lipokOutputId`/
 * `lipokProcessStepId` are the join row's own id, needed to address the `.../link` and
 * `.../customers` endpoints — not the referenced master data's id.
 */
export interface Sipoc {
  id: string;
  name: string;
  description: string | null;
  gos: SipocGoDto[];
  suppliers: OrderedItemDto[];
  inputs: SipocInputDto[];
  processSteps: SipocProcessStepDto[];
  outputs: SipocOutputDto[];
  customers: OrderedItemDto[];
  comments: SipocCommentDto[];
  audit: AuditDto | null;
}

export interface SipocCreate {
  name: string;
  description?: string | null;
}

export interface SipocUpdate {
  name: string;
  description?: string | null;
}

export type SipocPage = Page<SipocListItem>;

/** The SIPOC entry kinds that can be attached to a Lipok. */
export type EntryKind = 'supplier' | 'input' | 'processStep' | 'output' | 'customer' | 'go';

/**
 * The subset of EntryKind whose column order can be changed by drag & drop. Process steps are
 * ordered via `predecessorId` instead (see sipoc-detail.component's predecessor dropdown), not by
 * raw position, so they're excluded here.
 */
export type ReorderableKind = 'supplier' | 'input' | 'output' | 'customer';
