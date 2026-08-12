import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Go, GoCreate, GoPage, GoTreeNode, GoUpdate } from './go.model';

/** HTTP client for `/api/gos`: plain CRUD plus the single-node ancestor/descendant `hierarchy` read. */
@Injectable({ providedIn: 'root' })
export class GoService {
  private baseUrl = `${environment.apiBaseUrl}/gos`;

  constructor(private http: HttpClient) {}

  list(page = 0, size = 100): Observable<GoPage> {
    return this.http.get<GoPage>(this.baseUrl, { params: { page, size } });
  }

  get(id: string): Observable<Go> {
    return this.http.get<Go>(`${this.baseUrl}/${id}`);
  }

  create(dto: GoCreate): Observable<Go> {
    return this.http.post<Go>(this.baseUrl, dto);
  }

  update(id: string, dto: GoUpdate): Observable<Go> {
    return this.http.patch<Go>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  hierarchy(id: string): Observable<GoTreeNode[]> {
    return this.http.get<GoTreeNode[]>(`${this.baseUrl}/${id}/hierarchy`);
  }
}
