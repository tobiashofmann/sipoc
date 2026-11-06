// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Page } from '../business-partners/business-partner.model';

export type CatalogKind = 'input' | 'output' | 'processStep';

const ENDPOINT_SEGMENT: Record<CatalogKind, string> = {
  input: 'inputs',
  output: 'outputs',
  processStep: 'process-steps',
};

export interface CatalogListItem {
  id: string;
  name: string;
  updatedAt: string;
}

export interface CatalogCreate {
  name: string;
  description?: string | null;
  type?: 'TEXT' | 'DOCUMENT';
  linkUrl?: string | null;
}

export interface CatalogEntry {
  id: string;
  name: string;
}

/** Master-data catalog for Input/Output/ProcessStep — the entity kinds not already covered by BusinessPartnerService. */
@Injectable({ providedIn: 'root' })
export class EntryCatalogService {
  constructor(private http: HttpClient) {}

  private baseUrl(kind: CatalogKind): string {
    return `${environment.apiBaseUrl}/${ENDPOINT_SEGMENT[kind]}`;
  }

  list(kind: CatalogKind, page = 0, size = 100): Observable<Page<CatalogListItem>> {
    return this.http.get<Page<CatalogListItem>>(this.baseUrl(kind), { params: { page, size } });
  }

  create(kind: CatalogKind, dto: CatalogCreate): Observable<CatalogEntry> {
    return this.http.post<CatalogEntry>(this.baseUrl(kind), dto);
  }
}
