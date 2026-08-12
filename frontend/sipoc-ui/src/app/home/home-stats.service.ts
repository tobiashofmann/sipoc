import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Page } from '../business-partners/business-partner.model';

/** Dashboard counts for the home page, each fetched as a size-1 page's `totalElements` rather than a dedicated count endpoint. */
@Injectable({ providedIn: 'root' })
export class HomeStatsService {
  constructor(private http: HttpClient) {}

  private count(path: string): Observable<number> {
    return this.http
      .get<Page<unknown>>(`${environment.apiBaseUrl}/${path}`, { params: { page: 0, size: 1 } })
      .pipe(map((page) => page.totalElements));
  }

  lipokCount(): Observable<number> {
    return this.count('lipoks');
  }

  inputCount(): Observable<number> {
    return this.count('inputs');
  }

  outputCount(): Observable<number> {
    return this.count('outputs');
  }
}
