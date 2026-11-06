// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SipocService } from './sipoc.service';
import { SipocDetailComponent } from './sipoc-detail.component';
import { SipocListItem } from './sipoc.model';
import { ViewportService } from '../shared/viewport.service';
import { triggerDownload } from '../shared/download.util';

type SortField = 'name' | 'createdAt';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-sipoc-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SipocDetailComponent, TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './sipoc-list.component.html',
})
export class SipocListComponent implements OnInit {
  sipocs = signal<SipocListItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  searchTerm = signal('');
  sortField = signal<SortField>('name');
  sortDirection = signal<SortDirection>('asc');

  selectedId = signal<string | null>(null);
  detailFullScreen = signal(false);
  /** Id of the Lipok that should auto-enter edit mode once its detail view has loaded. */
  editOnOpenId = signal<string | null>(null);
  /** On tablet/mobile the detail always takes the full screen; the master list stays desktop-only. */
  effectiveDetailFullScreen = computed(() => !this.viewport.isDesktop() || this.detailFullScreen());
  fclLayout = computed(() => {
    if (!this.selectedId()) {
      return 'OneColumn';
    }
    return this.effectiveDetailFullScreen() ? 'MidColumnFullScreen' : 'TwoColumnsMidExpanded';
  });
  /** The "Created" column is only shown in the master-only layout (no detail shown), and never on phone. */
  showCreatedColumn = computed(() => !this.viewport.isPhone() && this.fclLayout() === 'OneColumn');
  /** Within that column, the time is only shown alongside the date on desktop. */
  createdAtFormat = computed(() => (this.viewport.isDesktop() ? 'medium' : 'mediumDate'));
  /**
   * The actions column shows 3 icons on desktop always, and on tablet while no detail is shown;
   * it collapses to a dropdown menu on phone always, and on tablet once a detail is shown.
   */
  showActionsDropdown = computed(() => {
    if (this.viewport.isDesktop()) {
      return false;
    }
    if (this.viewport.isPhone()) {
      return true;
    }
    return this.fclLayout() !== 'OneColumn';
  });

  filteredSipocs = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const sipocs = this.sipocs();
    return term
      ? sipocs.filter((s) => s.name.toLowerCase().includes(term) || s.id.toLowerCase().includes(term))
      : sipocs;
  });

  sortedSipocs = computed(() => {
    const field = this.sortField();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;
    return [...this.filteredSipocs()].sort((a, b) => {
      const cmp = field === 'name' ? a.name.localeCompare(b.name) : a.createdAt.localeCompare(b.createdAt);
      return cmp * direction;
    });
  });

  exportingAll = signal(false);
  exportingRowId = signal<string | null>(null);

  /** State for the per-row actions dropdown menu, shown instead of the 3 action icons when space is tight. */
  menuOpen = signal(false);
  menuOpener = signal<HTMLElement | null>(null);
  menuTargetSipoc = signal<SipocListItem | null>(null);

  createDialogOpen = signal(false);
  newName = '';
  newDescription = '';

  deleteCandidate = signal<SipocListItem | null>(null);

  constructor(
    private service: SipocService,
    private route: ActivatedRoute,
    private router: Router,
    private viewport: ViewportService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.selectedId.set(id);
    }
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.list().subscribe({
      next: (page) => {
        this.sipocs.set(page.content);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.listLoadError'));
        this.loading.set(false);
      },
    });
  }

  setSortField(field: SortField): void {
    this.sortField.set(field);
  }

  toggleSortDirection(): void {
    this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
  }

  exportAll(): void {
    this.exportingAll.set(true);
    this.service.exportAll().subscribe({
      next: ({ blob, filename }) => {
        triggerDownload(blob, filename);
        this.exportingAll.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.exportAllError'));
        this.exportingAll.set(false);
      },
    });
  }

  exportRow(sipoc: SipocListItem, event: Event): void {
    event.stopPropagation();
    this.exportingRowId.set(sipoc.id);
    this.service.exportOne(sipoc.id, `${sipoc.id}_${sipoc.name}.md`).subscribe({
      next: ({ blob, filename }) => {
        triggerDownload(blob, filename);
        this.exportingRowId.set(null);
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.exportError'));
        this.exportingRowId.set(null);
      },
    });
  }

  editRow(sipoc: SipocListItem, event: Event): void {
    event.stopPropagation();
    this.editOnOpenId.set(sipoc.id);
    this.selectedId.set(sipoc.id);
    this.detailFullScreen.set(true);
    this.router.navigate([], { relativeTo: this.route, queryParams: { id: sipoc.id }, queryParamsHandling: 'merge' });
  }

  openRowMenu(sipoc: SipocListItem, event: Event): void {
    event.stopPropagation();
    this.menuTargetSipoc.set(sipoc);
    this.menuOpener.set(event.currentTarget as HTMLElement);
    this.menuOpen.set(true);
  }

  onRowMenuItemClick(event: Event): void {
    const sipoc = this.menuTargetSipoc();
    this.menuOpen.set(false);
    if (!sipoc) {
      return;
    }
    const item = (event as CustomEvent<{ item: HTMLElement }>).detail?.item;
    const action = item?.dataset?.['action'];
    if (action === 'export') {
      this.exportRow(sipoc, event);
    } else if (action === 'edit') {
      this.editRow(sipoc, event);
    } else if (action === 'delete') {
      this.requestDelete(sipoc, event);
    }
  }

  openCreateDialog(): void {
    this.newName = '';
    this.newDescription = '';
    this.createDialogOpen.set(true);
  }

  closeCreateDialog(): void {
    this.createDialogOpen.set(false);
  }

  submitCreate(): void {
    const name = this.newName.trim();
    if (!name) {
      return;
    }
    this.service.create({ name, description: this.newDescription.trim() || null }).subscribe({
      next: () => {
        this.createDialogOpen.set(false);
        this.load();
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.createError'));
      },
    });
  }

  openDetail(id: string): void {
    this.editOnOpenId.set(null);
    this.selectedId.set(id);
    this.detailFullScreen.set(false);
    this.router.navigate([], { relativeTo: this.route, queryParams: { id }, queryParamsHandling: 'merge' });
  }

  closeDetail(): void {
    this.selectedId.set(null);
    this.detailFullScreen.set(false);
    this.editOnOpenId.set(null);
    this.router.navigate([], { relativeTo: this.route, queryParams: { id: null }, queryParamsHandling: 'merge' });
  }

  toggleDetailFullScreen(): void {
    this.detailFullScreen.set(!this.detailFullScreen());
  }

  onDetailDeleted(): void {
    this.closeDetail();
    this.load();
  }

  requestDelete(sipoc: SipocListItem, event: Event): void {
    event.stopPropagation();
    this.deleteCandidate.set(sipoc);
  }

  cancelDelete(): void {
    this.deleteCandidate.set(null);
  }

  confirmDelete(): void {
    const candidate = this.deleteCandidate();
    if (!candidate) {
      return;
    }
    this.service.delete(candidate.id).subscribe({
      next: () => {
        this.deleteCandidate.set(null);
        if (this.selectedId() === candidate.id) {
          this.closeDetail();
        }
        this.load();
      },
      error: () => {
        this.error.set(this.translate.instant('sipoc.deleteError'));
        this.deleteCandidate.set(null);
      },
    });
  }
}
