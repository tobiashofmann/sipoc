import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { filenameFromContentDisposition } from '../shared/download.util';
import { EntryKind, ReorderableKind, Sipoc, SipocCreate, SipocPage, SipocUpdate } from './sipoc.model';

export interface DownloadedFile {
  blob: Blob;
  filename: string;
}

const ATTACH_SEGMENT: Record<EntryKind, string> = {
  supplier: 'suppliers',
  input: 'inputs',
  processStep: 'process-steps',
  output: 'outputs',
  customer: 'customers',
  go: 'gos',
};

/**
 * HTTP client for `/api/lipoks`: plain CRUD plus the full SIPOC-specific surface — attach/detach/
 * reorder the five columns, Go tagging, the fine-grained supplier/process-step/customer links,
 * comments, and Markdown export.
 */
@Injectable({ providedIn: 'root' })
export class SipocService {
  private baseUrl = `${environment.apiBaseUrl}/lipoks`;

  constructor(private http: HttpClient) {}

  list(page = 0, size = 20): Observable<SipocPage> {
    return this.http.get<SipocPage>(this.baseUrl, { params: { page, size } });
  }

  get(id: string): Observable<Sipoc> {
    return this.http.get<Sipoc>(`${this.baseUrl}/${id}`);
  }

  create(dto: SipocCreate): Observable<Sipoc> {
    return this.http.post<Sipoc>(this.baseUrl, dto);
  }

  update(id: string, dto: SipocUpdate): Observable<Sipoc> {
    return this.http.patch<Sipoc>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  setProcessStepPredecessor(sipocId: string, lipokProcessStepId: number, predecessorId: number | null): Observable<Sipoc> {
    return this.http.patch<Sipoc>(`${this.baseUrl}/${sipocId}/process-steps/${lipokProcessStepId}/link`, {
      predecessorId,
    });
  }

  attach(sipocId: string, kind: EntryKind, entityId: string): Observable<Sipoc> {
    return this.http.post<Sipoc>(`${this.baseUrl}/${sipocId}/${ATTACH_SEGMENT[kind]}/${entityId}`, null);
  }

  detach(sipocId: string, kind: EntryKind, entityId: string): Observable<Sipoc> {
    return this.http.delete<Sipoc>(`${this.baseUrl}/${sipocId}/${ATTACH_SEGMENT[kind]}/${entityId}`);
  }

  /** Reorders a column's tiles; orderedIds must be exactly the currently attached entity ids in the new order. */
  reorder(sipocId: string, kind: ReorderableKind, orderedIds: string[]): Observable<Sipoc> {
    return this.http.patch<Sipoc>(`${this.baseUrl}/${sipocId}/${ATTACH_SEGMENT[kind]}/reorder`, { orderedIds });
  }

  linkInputSupplier(
    sipocId: string,
    lipokInputId: number,
    supplierId: string | null,
    processStepId: string | null,
  ): Observable<Sipoc> {
    return this.http.patch<Sipoc>(`${this.baseUrl}/${sipocId}/inputs/${lipokInputId}/link`, {
      supplierId,
      processStepId,
    });
  }

  addOutputCustomer(sipocId: string, lipokOutputId: number, customerId: string): Observable<Sipoc> {
    return this.http.post<Sipoc>(`${this.baseUrl}/${sipocId}/outputs/${lipokOutputId}/customers/${customerId}`, null);
  }

  removeOutputCustomer(sipocId: string, lipokOutputId: number, customerId: string): Observable<Sipoc> {
    return this.http.delete<Sipoc>(`${this.baseUrl}/${sipocId}/outputs/${lipokOutputId}/customers/${customerId}`);
  }

  addComment(sipocId: string, content: string): Observable<Sipoc> {
    return this.http.post<Sipoc>(`${this.baseUrl}/${sipocId}/comments`, { content });
  }

  updateComment(sipocId: string, commentId: number, content: string): Observable<Sipoc> {
    return this.http.patch<Sipoc>(`${this.baseUrl}/${sipocId}/comments/${commentId}`, { content });
  }

  removeComment(sipocId: string, commentId: number): Observable<Sipoc> {
    return this.http.delete<Sipoc>(`${this.baseUrl}/${sipocId}/comments/${commentId}`);
  }

  /** Markdown export of a single Lipok (a single .md file). */
  exportOne(id: string, fallbackFilename: string): Observable<DownloadedFile> {
    return this.downloadWithFilename(`${this.baseUrl}/${id}/export`, fallbackFilename);
  }

  /** Markdown export of every Lipok, bundled as a zip. */
  exportAll(): Observable<DownloadedFile> {
    return this.downloadWithFilename(`${this.baseUrl}/export`, 'lipok-export.zip');
  }

  private downloadWithFilename(url: string, fallbackFilename: string): Observable<DownloadedFile> {
    return this.http.get(url, { observe: 'response', responseType: 'blob' }).pipe(
      map((response) => ({
        blob: response.body as Blob,
        filename: filenameFromContentDisposition(response.headers.get('Content-Disposition')) ?? fallbackFilename,
      })),
    );
  }
}
