// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { CommonModule } from '@angular/common';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  computed,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { marked } from 'marked';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SipocService } from './sipoc.service';
import {
  EntryKind,
  ReorderableKind,
  Sipoc,
  SipocCommentDto,
  SipocInputDto,
  SipocOutputDto,
  SipocProcessStepDto,
} from './sipoc.model';
import { BusinessPartnerService } from '../business-partners/business-partner.service';
import { CatalogEntry, EntryCatalogService } from './entry-catalog.service';
import { GoService } from '../gos/go.service';
import { triggerDownload } from '../shared/download.util';

interface CatalogOption {
  id: string;
  name: string;
}

const ENTRY_KIND_LABEL_KEY: Record<EntryKind, string> = {
  supplier: 'sipoc.columnSupplier',
  input: 'sipoc.columnInput',
  processStep: 'sipoc.columnProcess',
  output: 'sipoc.columnOutput',
  customer: 'sipoc.columnCustomer',
  go: 'gos.term',
};

export interface ConnectionLine {
  path: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  /** The two data-tile keys this line connects, e.g. ["supplier:<id>", "input:<id>"]. */
  tileKeys: [string, string];
  /** Whether this line participates in the click-to-highlight interaction (Lieferant/Input and Output/Kunde only). */
  selectable: boolean;
  /** Marker to remove this connection, always positioned on the Input/Output side. */
  removable?: { x: number; y: number; remove: () => void };
}

const LINE_COLOR = '#7a7f85';

marked.setOptions({ breaks: true });

/** Straight line if endpoints are aligned on the given axis, otherwise a right-angled connector. */
function connectorPath(x1: number, y1: number, x2: number, y2: number, axis: 'horizontal' | 'vertical'): string {
  if (axis === 'horizontal') {
    if (Math.abs(y1 - y2) < 1) {
      return `M${x1} ${y1} L${x2} ${y2}`;
    }
    const midX = (x1 + x2) / 2;
    return `M${x1} ${y1} L${midX} ${y1} L${midX} ${y2} L${x2} ${y2}`;
  }
  if (Math.abs(x1 - x2) < 1) {
    return `M${x1} ${y1} L${x2} ${y2}`;
  }
  const midY = (y1 + y2) / 2;
  return `M${x1} ${y1} L${x1} ${midY} L${x2} ${midY} L${x2} ${y2}`;
}

@Component({
  selector: 'app-sipoc-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './sipoc-detail.component.html',
})
export class SipocDetailComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) id!: string;
  @Input() fullScreen = false;
  /** When true, enters edit mode automatically once the Lipok has loaded. */
  @Input() startInEdit = false;

  @Output() closed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();
  @Output() fullScreenToggled = new EventEmitter<void>();

  @ViewChild('columnsContainer') columnsContainer?: ElementRef<HTMLDivElement>;

  sipoc = signal<Sipoc | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  saving = signal(false);

  editing = signal(false);
  editName = '';
  editDescription = '';

  deleteDialogOpen = signal(false);

  exporting = signal(false);

  newCommentText = signal('');
  addingComment = signal(false);
  commentError = signal<string | null>(null);

  editingCommentId = signal<number | null>(null);
  editingCommentText = signal('');
  savingComment = signal(false);

  lines = signal<ConnectionLine[]>([]);
  private resizeObserver?: ResizeObserver;

  /** Tile key (e.g. "input:<id>") currently being hovered over during a drag, for a visual drop-target highlight. */
  dragOverTile = signal<string | null>(null);

  /** Column kind + entity id of the tile currently being dragged to reorder it within its own column. */
  draggedReorderKind = signal<ReorderableKind | null>(null);
  draggedReorderId = signal<string | null>(null);
  /** Whether the tile currently hovered over (dragOverTile) would receive the drop before or after itself. */
  reorderDropPosition = signal<'before' | 'after' | null>(null);

  /** Identifies the current selection: a tile key (e.g. "supplier:<id>") or "line:<keyA>|<keyB>". */
  selectionToken = signal<string | null>(null);
  hasSelection = computed(() => this.selectionToken() !== null);
  /** Tile keys related to the current selection, recomputed live from the current Sipoc data. */
  highlightedKeys = computed<Set<string>>(() => {
    const token = this.selectionToken();
    const sipoc = this.sipoc();
    if (!token || !sipoc) {
      return new Set();
    }
    if (token.startsWith('line:')) {
      const [a, b] = token.slice(5).split('|');
      return new Set([a, b]);
    }
    return this.computeRelatedKeys(token, sipoc);
  });

  addDialogKind = signal<EntryKind | null>(null);
  addDialogLabel = computed(() =>
    this.addDialogKind() ? this.translate.instant(ENTRY_KIND_LABEL_KEY[this.addDialogKind()!]) : '',
  );
  addMode = signal<'existing' | 'new'>('existing');
  addError = signal<string | null>(null);
  adding = signal(false);

  catalogLoading = signal(false);
  catalogSearch = signal('');
  catalogOptions = signal<CatalogOption[]>([]);
  filteredCatalogOptions = computed(() => {
    const term = this.catalogSearch().trim().toLowerCase();
    const options = this.catalogOptions();
    return term ? options.filter((o) => o.name.toLowerCase().includes(term)) : options;
  });

  newEntryName = '';
  newEntryDescription = '';
  newEntryType: 'TEXT' | 'DOCUMENT' = 'TEXT';
  newEntryLinkUrl = '';
  newEntryNeedsType = computed(() => this.addDialogKind() === 'input' || this.addDialogKind() === 'output');

  /** Process steps ordered by walking the predecessor chain(s), start(s) first. */
  orderedProcessSteps = computed<SipocProcessStepDto[]>(() => {
    const steps = this.sipoc()?.processSteps ?? [];
    const byId = new Map(steps.map((s) => [s.lipokProcessStepId, s]));
    const childrenOf = new Map<number, SipocProcessStepDto[]>();
    const roots: SipocProcessStepDto[] = [];

    for (const step of steps) {
      if (step.predecessorId != null && byId.has(step.predecessorId)) {
        const siblings = childrenOf.get(step.predecessorId) ?? [];
        siblings.push(step);
        childrenOf.set(step.predecessorId, siblings);
      } else {
        roots.push(step);
      }
    }
    roots.sort((a, b) => a.position - b.position);

    const ordered: SipocProcessStepDto[] = [];
    const visited = new Set<number>();
    const visit = (step: SipocProcessStepDto) => {
      if (visited.has(step.lipokProcessStepId)) {
        return;
      }
      visited.add(step.lipokProcessStepId);
      ordered.push(step);
      const children = [...(childrenOf.get(step.lipokProcessStepId) ?? [])].sort((a, b) => a.position - b.position);
      children.forEach(visit);
    };
    roots.forEach(visit);
    // Safety net in case of unexpected cycles/orphans: still show every step.
    steps.forEach((step) => {
      if (!visited.has(step.lipokProcessStepId)) {
        ordered.push(step);
      }
    });
    return ordered;
  });

  constructor(
    private service: SipocService,
    private partners: BusinessPartnerService,
    private catalog: EntryCatalogService,
    private gos: GoService,
    private translate: TranslateService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['id']) {
      this.editing.set(false);
      this.load();
      return;
    }
    if (changes['startInEdit'] && this.startInEdit && this.sipoc()) {
      this.startEdit();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.get(this.id).subscribe({
      next: (sipoc) => {
        this.sipoc.set(sipoc);
        this.loading.set(false);
        setTimeout(() => this.computeLines());
        if (this.startInEdit) {
          this.startEdit();
        }
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.loadError'));
        this.loading.set(false);
      },
    });
  }

  computeLines(): void {
    const container = this.columnsContainer?.nativeElement;
    const sipoc = this.sipoc();
    if (!container || !sipoc) {
      return;
    }

    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.computeLines());
      this.resizeObserver.observe(container);
    }

    const containerRect = container.getBoundingClientRect();
    const tileRects = new Map<string, DOMRect>();
    container.querySelectorAll<HTMLElement>('[data-tile]').forEach((el) => {
      tileRects.set(el.dataset['tile']!, el.getBoundingClientRect());
    });

    const rightMid = (rect: DOMRect) => ({ x: rect.right - containerRect.left, y: rect.top + rect.height / 2 - containerRect.top });
    const leftMid = (rect: DOMRect) => ({ x: rect.left - containerRect.left, y: rect.top + rect.height / 2 - containerRect.top });
    const bottomMid = (rect: DOMRect) => ({ x: rect.left + rect.width / 2 - containerRect.left, y: rect.bottom - containerRect.top });
    const topMid = (rect: DOMRect) => ({ x: rect.left + rect.width / 2 - containerRect.left, y: rect.top - containerRect.top });

    const lines: ConnectionLine[] = [];
    const addLine = (
      from: { x: number; y: number },
      to: { x: number; y: number },
      axis: 'horizontal' | 'vertical',
      tileKeys: [string, string],
      options?: { selectable?: boolean; removable?: { x: number; y: number; remove: () => void } },
    ) => {
      lines.push({
        path: connectorPath(from.x, from.y, to.x, to.y, axis),
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        color: LINE_COLOR,
        tileKeys,
        selectable: options?.selectable ?? false,
        removable: options?.removable,
      });
    };

    for (const step of sipoc.processSteps) {
      if (!step.predecessorId) {
        continue;
      }
      const predecessorRect = tileRects.get(`process:${step.predecessorId}`);
      const stepRect = tileRects.get(`process:${step.lipokProcessStepId}`);
      if (predecessorRect && stepRect) {
        addLine(bottomMid(predecessorRect), topMid(stepRect), 'vertical', [
          `process:${step.predecessorId}`,
          `process:${step.lipokProcessStepId}`,
        ]);
      }
    }

    for (const input of sipoc.inputs) {
      if (!input.supplierId) {
        continue;
      }
      const supplierRect = tileRects.get(`supplier:${input.supplierId}`);
      const inputRect = tileRects.get(`input:${input.id}`);
      if (supplierRect && inputRect) {
        const from = rightMid(supplierRect);
        const to = leftMid(inputRect);
        addLine(from, to, 'horizontal', [`supplier:${input.supplierId}`, `input:${input.id}`], {
          selectable: true,
          removable: { x: to.x, y: to.y, remove: () => this.removeInputSupplierLink(input) },
        });
      }
    }

    for (const output of sipoc.outputs) {
      const outputRect = tileRects.get(`output:${output.id}`);
      if (!outputRect) {
        continue;
      }
      for (const customerId of output.customerIds) {
        const customerRect = tileRects.get(`customer:${customerId}`);
        if (customerRect) {
          const from = rightMid(outputRect);
          const to = leftMid(customerRect);
          addLine(from, to, 'horizontal', [`output:${output.id}`, `customer:${customerId}`], {
            selectable: true,
            removable: { x: from.x, y: from.y, remove: () => this.removeOutputCustomerLink(output, customerId) },
          });
        }
      }
    }

    this.lines.set(lines);
  }

  startEdit(): void {
    const sipoc = this.sipoc();
    if (!sipoc) {
      return;
    }
    this.editName = sipoc.name;
    this.editDescription = sipoc.description ?? '';
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  save(): void {
    const name = this.editName.trim();
    if (!name) {
      return;
    }
    this.saving.set(true);
    this.service.update(this.id, { name, description: this.editDescription.trim() || null }).subscribe({
      next: (sipoc) => {
        this.sipoc.set(sipoc);
        this.saving.set(false);
        this.editing.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.saveError'));
        this.saving.set(false);
      },
    });
  }

  exportMarkdown(): void {
    const sipoc = this.sipoc();
    if (!sipoc) {
      return;
    }
    this.exporting.set(true);
    this.service.exportOne(sipoc.id, `${sipoc.id}_${sipoc.name}.md`).subscribe({
      next: ({ blob, filename }) => {
        triggerDownload(blob, filename);
        this.exporting.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.exportError'));
        this.exporting.set(false);
      },
    });
  }

  requestDelete(): void {
    this.deleteDialogOpen.set(true);
  }

  cancelDelete(): void {
    this.deleteDialogOpen.set(false);
  }

  confirmDelete(): void {
    this.service.delete(this.id).subscribe({
      next: () => {
        this.deleteDialogOpen.set(false);
        this.deleted.emit();
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.deleteError'));
        this.deleteDialogOpen.set(false);
      },
    });
  }

  setPredecessor(step: SipocProcessStepDto, event: Event): void {
    const value = ((event.target as any).value as string) ?? '';
    const predecessorId = value ? Number(value) : null;
    this.service.setProcessStepPredecessor(this.id, step.lipokProcessStepId, predecessorId).subscribe({
      next: (sipoc) => {
        this.sipoc.set(sipoc);
        setTimeout(() => this.computeLines());
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.predecessorError'));
      },
    });
  }

  onSupplierDragStart(event: DragEvent, supplierId: string): void {
    event.dataTransfer?.setData('application/x-lipok-supplier', supplierId);
    event.dataTransfer!.effectAllowed = 'link';
  }

  onOutputDragStart(event: DragEvent, lipokOutputId: number): void {
    event.dataTransfer?.setData('application/x-lipok-output', String(lipokOutputId));
    event.dataTransfer!.effectAllowed = 'link';
  }

  allowSupplierDrop(event: DragEvent, tileKey: string): void {
    if (event.dataTransfer?.types.includes('application/x-lipok-supplier')) {
      event.preventDefault();
      this.dragOverTile.set(tileKey);
    }
  }

  allowOutputDrop(event: DragEvent, tileKey: string): void {
    if (event.dataTransfer?.types.includes('application/x-lipok-output')) {
      event.preventDefault();
      this.dragOverTile.set(tileKey);
    }
  }

  clearDragOver(): void {
    this.dragOverTile.set(null);
    this.reorderDropPosition.set(null);
  }

  onInputDrop(event: DragEvent, input: SipocInputDto): void {
    event.preventDefault();
    this.dragOverTile.set(null);
    const supplierId = event.dataTransfer?.getData('application/x-lipok-supplier');
    if (!supplierId) {
      return;
    }
    this.service.linkInputSupplier(this.id, input.lipokInputId, supplierId, input.processStepId).subscribe({
      next: (sipoc) => {
        this.sipoc.set(sipoc);
        setTimeout(() => this.computeLines());
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.linkError'));
      },
    });
  }

  onCustomerDrop(event: DragEvent, customerId: string): void {
    event.preventDefault();
    this.dragOverTile.set(null);
    const raw = event.dataTransfer?.getData('application/x-lipok-output');
    const lipokOutputId = raw ? Number(raw) : NaN;
    if (!raw || Number.isNaN(lipokOutputId)) {
      return;
    }
    this.service.addOutputCustomer(this.id, lipokOutputId, customerId).subscribe({
      next: (sipoc) => {
        this.sipoc.set(sipoc);
        setTimeout(() => this.computeLines());
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.linkError'));
      },
    });
  }

  /** Drag-start for reordering a tile within its own column (supplier/input/output/customer). */
  onReorderDragStart(event: DragEvent, kind: ReorderableKind, id: string): void {
    this.draggedReorderKind.set(kind);
    this.draggedReorderId.set(id);
    event.dataTransfer!.effectAllowed = 'move';
  }

  onReorderDragEnd(): void {
    this.draggedReorderKind.set(null);
    this.draggedReorderId.set(null);
    this.dragOverTile.set(null);
    this.reorderDropPosition.set(null);
  }

  /**
   * Every tile is itself the drop target — dropping in its top half inserts the dragged tile
   * before it, the bottom half inserts after it. This also covers dropping before the very first
   * tile or after the very last one, without needing a separate empty drop zone.
   */
  private dropPositionFor(event: DragEvent): 'before' | 'after' {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
  }

  /** Allows dropping only when the tile currently being dragged belongs to the same column. */
  allowReorderDrop(event: DragEvent, kind: ReorderableKind, tileKey: string): void {
    if (this.draggedReorderKind() === kind) {
      event.preventDefault();
      this.dragOverTile.set(tileKey);
      this.reorderDropPosition.set(this.dropPositionFor(event));
    }
  }

  isReorderDropBefore(tileKey: string): boolean {
    return this.dragOverTile() === tileKey && this.reorderDropPosition() === 'before';
  }

  isReorderDropAfter(tileKey: string): boolean {
    return this.dragOverTile() === tileKey && this.reorderDropPosition() === 'after';
  }

  /** Drops the dragged tile before or after `targetId` (depending on which half it was dropped on), then persists the new order. */
  onReorderDrop(event: DragEvent, kind: ReorderableKind, targetId: string): void {
    event.preventDefault();
    const position = this.dropPositionFor(event);
    this.dragOverTile.set(null);
    this.reorderDropPosition.set(null);
    const draggedId = this.draggedReorderId();
    if (this.draggedReorderKind() !== kind || !draggedId || draggedId === targetId) {
      return;
    }

    const ids = this.columnIds(kind).filter((id) => id !== draggedId);
    let targetIndex = ids.indexOf(targetId);
    if (position === 'after') {
      targetIndex += 1;
    }
    ids.splice(targetIndex, 0, draggedId);
    this.persistReorder(kind, ids);
  }

  /**
   * Fallback drop target covering the empty space below a column's last tile (columns are stretched
   * to equal height by the grid, so a short column can have a lot of dead space there otherwise).
   * Dropping anywhere in it always appends the dragged tile to the end of the column.
   */
  allowReorderColumnEndDrop(event: DragEvent, kind: ReorderableKind): void {
    if (this.draggedReorderKind() === kind) {
      event.preventDefault();
      this.dragOverTile.set(`${kind}:__end__`);
      this.reorderDropPosition.set('after');
    }
  }

  onReorderColumnEndDrop(event: DragEvent, kind: ReorderableKind): void {
    event.preventDefault();
    this.dragOverTile.set(null);
    this.reorderDropPosition.set(null);
    const draggedId = this.draggedReorderId();
    if (this.draggedReorderKind() !== kind || !draggedId) {
      return;
    }

    const ids = this.columnIds(kind).filter((id) => id !== draggedId);
    ids.push(draggedId);
    this.persistReorder(kind, ids);
  }

  private persistReorder(kind: ReorderableKind, ids: string[]): void {
    this.service.reorder(this.id, kind, ids).subscribe({
      next: (sipoc) => {
        this.sipoc.set(sipoc);
        setTimeout(() => this.computeLines());
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.reorderError'));
      },
    });
  }

  private columnIds(kind: ReorderableKind): string[] {
    const sipoc = this.sipoc();
    if (!sipoc) {
      return [];
    }
    switch (kind) {
      case 'supplier':
        return sipoc.suppliers.map((s) => s.id);
      case 'input':
        return sipoc.inputs.map((i) => i.id);
      case 'output':
        return sipoc.outputs.map((o) => o.id);
      case 'customer':
        return sipoc.customers.map((c) => c.id);
    }
  }

  removeInputSupplierLink(input: SipocInputDto): void {
    this.service.linkInputSupplier(this.id, input.lipokInputId, null, input.processStepId).subscribe({
      next: (sipoc) => {
        this.sipoc.set(sipoc);
        setTimeout(() => this.computeLines());
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.unlinkError'));
      },
    });
  }

  removeOutputCustomerLink(output: SipocOutputDto, customerId: string): void {
    this.service.removeOutputCustomer(this.id, output.lipokOutputId, customerId).subscribe({
      next: (sipoc) => {
        this.sipoc.set(sipoc);
        setTimeout(() => this.computeLines());
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.unlinkError'));
      },
    });
  }

  removeEntity(kind: EntryKind, entityId: string, event: Event): void {
    event.stopPropagation();
    this.service.detach(this.id, kind, entityId).subscribe({
      next: (sipoc) => {
        this.sipoc.set(sipoc);
        this.clearSelection();
        setTimeout(() => this.computeLines());
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.entryDeleteError'));
      },
    });
  }

  openAddDialog(kind: EntryKind): void {
    this.addDialogKind.set(kind);
    this.addMode.set('existing');
    this.addError.set(null);
    this.catalogSearch.set('');
    this.catalogOptions.set([]);
    this.newEntryName = '';
    this.newEntryDescription = '';
    this.newEntryType = 'TEXT';
    this.newEntryLinkUrl = '';
    this.loadCatalog(kind);
  }

  closeAddDialog(): void {
    this.addDialogKind.set(null);
  }

  setAddMode(mode: 'existing' | 'new'): void {
    this.addMode.set(mode);
  }

  private attachedIds(kind: EntryKind): Set<string> {
    const sipoc = this.sipoc();
    if (!sipoc) {
      return new Set();
    }
    switch (kind) {
      case 'supplier':
        return new Set(sipoc.suppliers.map((s) => s.id));
      case 'customer':
        return new Set(sipoc.customers.map((c) => c.id));
      case 'input':
        return new Set(sipoc.inputs.map((i) => i.id));
      case 'output':
        return new Set(sipoc.outputs.map((o) => o.id));
      case 'processStep':
        return new Set(sipoc.processSteps.map((p) => p.id));
      case 'go':
        return new Set(sipoc.gos.map((g) => g.id));
    }
  }

  private loadCatalog(kind: EntryKind): void {
    this.catalogLoading.set(true);
    const attached = this.attachedIds(kind);
    let source: Observable<{ content: CatalogOption[] }>;
    if (kind === 'supplier' || kind === 'customer') {
      source = this.partners.list(0, 100);
    } else if (kind === 'go') {
      source = this.gos.list(0, 100);
    } else {
      source = this.catalog.list(kind, 0, 100);
    }
    source.subscribe({
      next: (page) => {
        this.catalogOptions.set(page.content.filter((item) => !attached.has(item.id)));
        this.catalogLoading.set(false);
      },
      error: () => {
        this.addError.set(this.translate.instant('sipoc.catalogLoadError'));
        this.catalogLoading.set(false);
      },
    });
  }

  selectExisting(entityId: string): void {
    const kind = this.addDialogKind();
    if (!kind) {
      return;
    }
    this.adding.set(true);
    this.service.attach(this.id, kind, entityId).subscribe({
      next: (sipoc) => {
        this.sipoc.set(sipoc);
        this.adding.set(false);
        this.closeAddDialog();
        setTimeout(() => this.computeLines());
      },
      error: () => {
        this.addError.set(this.translate.instant('sipoc.entryAddError'));
        this.adding.set(false);
      },
    });
  }

  submitNewEntry(): void {
    const kind = this.addDialogKind();
    const name = this.newEntryName.trim();
    if (!kind || !name) {
      return;
    }
    const description = this.newEntryDescription.trim() || null;

    let create$: Observable<CatalogEntry>;
    if (kind === 'supplier' || kind === 'customer') {
      create$ = this.partners.create({ name, description });
    } else if (kind === 'input' || kind === 'output') {
      create$ = this.catalog.create(kind, {
        name,
        description,
        type: this.newEntryType,
        linkUrl: this.newEntryLinkUrl.trim() || null,
      });
    } else if (kind === 'go') {
      create$ = this.gos.create({ name, description });
    } else {
      create$ = this.catalog.create(kind, { name, description });
    }

    this.adding.set(true);
    create$.subscribe({
      next: (created) => {
        this.service.attach(this.id, kind, created.id).subscribe({
          next: (sipoc) => {
            this.sipoc.set(sipoc);
            this.adding.set(false);
            this.closeAddDialog();
            setTimeout(() => this.computeLines());
          },
          error: () => {
            this.addError.set(this.translate.instant('sipoc.entryAddError'));
            this.adding.set(false);
          },
        });
      },
      error: () => {
        this.addError.set(this.translate.instant('sipoc.entryCreateError'));
        this.adding.set(false);
      },
    });
  }

  private computeRelatedKeys(key: string, sipoc: Sipoc): Set<string> {
    const sep = key.indexOf(':');
    const kind = key.slice(0, sep);
    const id = key.slice(sep + 1);
    const keys = new Set<string>([key]);

    if (kind === 'supplier') {
      sipoc.inputs.filter((i) => i.supplierId === id).forEach((i) => keys.add(`input:${i.id}`));
    } else if (kind === 'input') {
      const input = sipoc.inputs.find((i) => i.id === id);
      if (input?.supplierId) {
        keys.add(`supplier:${input.supplierId}`);
      }
    } else if (kind === 'output') {
      const output = sipoc.outputs.find((o) => o.id === id);
      output?.customerIds.forEach((customerId) => keys.add(`customer:${customerId}`));
    } else if (kind === 'customer') {
      sipoc.outputs.filter((o) => o.customerIds.includes(id)).forEach((o) => keys.add(`output:${o.id}`));
    }
    return keys;
  }

  selectTile(key: string, event: Event): void {
    event.stopPropagation();
    this.selectionToken.set(this.selectionToken() === key ? null : key);
  }

  selectLine(line: ConnectionLine, event: Event): void {
    event.stopPropagation();
    const token = `line:${line.tileKeys[0]}|${line.tileKeys[1]}`;
    this.selectionToken.set(this.selectionToken() === token ? null : token);
  }

  clearSelection(): void {
    this.selectionToken.set(null);
  }

  isDimmed(key: string): boolean {
    return this.hasSelection() && !this.highlightedKeys().has(key);
  }

  isLineDimmed(line: ConnectionLine): boolean {
    if (!line.selectable || !this.hasSelection()) {
      return false;
    }
    return !(this.highlightedKeys().has(line.tileKeys[0]) && this.highlightedKeys().has(line.tileKeys[1]));
  }

  renderMarkdown(content: string): string {
    return marked.parse(content, { async: false }) as string;
  }

  addComment(): void {
    const content = this.newCommentText().trim();
    if (!content) {
      return;
    }
    this.addingComment.set(true);
    this.commentError.set(null);
    this.service.addComment(this.id, content).subscribe({
      next: (sipoc) => {
        this.sipoc.set(sipoc);
        this.newCommentText.set('');
        this.addingComment.set(false);
      },
      error: () => {
        this.commentError.set(this.translate.instant('sipoc.commentSaveError'));
        this.addingComment.set(false);
      },
    });
  }

  removeComment(commentId: number): void {
    this.service.removeComment(this.id, commentId).subscribe({
      next: (sipoc) => {
        this.sipoc.set(sipoc);
      },
      error: () => {
        this.commentError.set(this.translate.instant('sipoc.commentDeleteError'));
      },
    });
  }

  startEditComment(comment: SipocCommentDto): void {
    this.editingCommentId.set(comment.id);
    this.editingCommentText.set(comment.content);
    this.commentError.set(null);
  }

  cancelEditComment(): void {
    this.editingCommentId.set(null);
    this.editingCommentText.set('');
  }

  saveEditComment(): void {
    const commentId = this.editingCommentId();
    const content = this.editingCommentText().trim();
    if (commentId == null || !content) {
      return;
    }
    this.savingComment.set(true);
    this.service.updateComment(this.id, commentId, content).subscribe({
      next: (sipoc) => {
        this.sipoc.set(sipoc);
        this.savingComment.set(false);
        this.cancelEditComment();
      },
      error: () => {
        this.commentError.set(this.translate.instant('sipoc.commentSaveError'));
        this.savingComment.set(false);
      },
    });
  }

  close(): void {
    this.closed.emit();
  }

  toggleFullScreen(): void {
    this.fullScreenToggled.emit();
  }
}
