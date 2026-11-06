// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BusinessPartner, BusinessPartnerCreate, BusinessPartnerListItem, BusinessPartnerUpdate, Page } from './business-partner.model';

/** HTTP client for `/api/business-partners` plain CRUD; see `SipocService` for Lipok-attachment operations. */
@Injectable({ providedIn: 'root' })
export class BusinessPartnerService {
  private baseUrl = `${environment.apiBaseUrl}/business-partners`;

  constructor(private http: HttpClient) {}

  list(page = 0, size = 20): Observable<Page<BusinessPartnerListItem>> {
    return this.http.get<Page<BusinessPartnerListItem>>(this.baseUrl, {
      params: { page, size },
    });
  }

  get(id: string): Observable<BusinessPartner> {
    return this.http.get<BusinessPartner>(`${this.baseUrl}/${id}`);
  }

  create(dto: BusinessPartnerCreate): Observable<BusinessPartner> {
    return this.http.post<BusinessPartner>(this.baseUrl, dto);
  }

  update(id: string, dto: BusinessPartnerUpdate): Observable<BusinessPartner> {
    return this.http.patch<BusinessPartner>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
