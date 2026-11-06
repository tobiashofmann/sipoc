// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { AuditDto, Page } from '../business-partners/business-partner.model';

export type BoType = 'PHYSICAL' | 'VIRTUAL';
export type Importance = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Criticality = 'PUBLIC' | 'INTERNAL' | 'PRIVATE' | 'CONFIDENTIAL';

export interface CustomProperty {
  key: string;
  value: string | null;
}

export interface GoListItem {
  id: string;
  name: string;
  category: string | null;
  parentId: string | null;
  updatedAt: string;
}

export interface GoLipokUsage {
  lipokId: string;
  lipokName: string;
}

export interface GoTreeNode {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  children: GoTreeNode[];
}

/** Mirrors the backend's `GoDetailDto`; unrelated to a SIPOC process step despite the similar domain vocabulary. */
export interface Go {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  parentId: string | null;
  type: BoType | null;
  importance: Importance | null;
  criticality: Criticality | null;
  customProperties: CustomProperty[];
  lipokUsages: GoLipokUsage[];
  audit: AuditDto | null;
}

export interface GoCreate {
  name: string;
  description?: string | null;
  category?: string | null;
  parentId?: string | null;
  type?: BoType | null;
  importance?: Importance | null;
  criticality?: Criticality | null;
  customProperties?: CustomProperty[];
}

export type GoUpdate = GoCreate;

export type GoPage = Page<GoListItem>;
