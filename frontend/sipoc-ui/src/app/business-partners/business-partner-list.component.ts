import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, OnInit, ViewChild, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BusinessPartnerService } from './business-partner.service';
import { BusinessPartnerDetailComponent } from './business-partner-detail.component';
import { BusinessPartnerListItem } from './business-partner.model';
import { ViewportService } from '../shared/viewport.service';

type SortField = 'name' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

interface PartnerGroup {
  label: string | null;
  items: BusinessPartnerListItem[];
}

@Component({
  selector: 'app-business-partner-list',
  standalone: true,
  imports: [CommonModule, FormsModule, BusinessPartnerDetailComponent, TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './business-partner-list.component.html',
})
/** Master list of business partners, with search/sort/grouping and an embedded detail panel. */
export class BusinessPartnerListComponent implements OnInit {
  @ViewChild('selection') private selectionRef?: ElementRef<any>;

  partners = signal<BusinessPartnerListItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  searchTerm = signal('');
  sortField = signal<SortField>('name');
  sortDirection = signal<SortDirection>('asc');
  groupByName = signal(false);

  selectedIds = signal<Set<string>>(new Set());
  selectedCount = computed(() => this.selectedIds().size);

  selectedId = signal<string | null>(null);
  detailFullScreen = signal(false);
  /** On tablet/mobile the detail always takes the full screen; the master list stays desktop-only. */
  effectiveDetailFullScreen = computed(() => !this.viewport.isDesktop() || this.detailFullScreen());
  fclLayout = computed(() => {
    if (!this.selectedId()) {
      return 'OneColumn';
    }
    return this.effectiveDetailFullScreen() ? 'MidColumnFullScreen' : 'TwoColumnsMidExpanded';
  });

  filteredPartners = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const partners = this.partners();
    return term ? partners.filter((p) => p.name.toLowerCase().includes(term)) : partners;
  });

  sortedPartners = computed(() => {
    const field = this.sortField();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;
    return [...this.filteredPartners()].sort((a, b) => {
      const cmp =
        field === 'name'
          ? a.name.localeCompare(b.name)
          : a.updatedAt.localeCompare(b.updatedAt);
      return cmp * direction;
    });
  });

  groups = computed<PartnerGroup[]>(() => {
    const sorted = this.sortedPartners();
    if (!this.groupByName()) {
      return [{ label: null, items: sorted }];
    }
    const groups: PartnerGroup[] = [];
    for (const partner of sorted) {
      const letter = partner.name.trim().charAt(0).toUpperCase() || '#';
      const current = groups[groups.length - 1];
      if (current?.label === letter) {
        current.items.push(partner);
      } else {
        groups.push({ label: letter, items: [partner] });
      }
    }
    return groups;
  });

  createDialogOpen = signal(false);
  newName = '';
  newDescription = '';

  deleteCandidate = signal<BusinessPartnerListItem | null>(null);
  bulkDeleteDialogOpen = signal(false);

  constructor(
    private service: BusinessPartnerService,
    private route: ActivatedRoute,
    private router: Router,
    private viewport: ViewportService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const id = params.get('id');
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
        this.partners.set(page.content);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('businessPartners.listLoadError'));
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

  toggleGroupByName(): void {
    const next = !this.groupByName();
    this.groupByName.set(next);
    if (next) {
      this.sortField.set('name');
    }
  }

  onSelectionChange(event: Event): void {
    const target = event.target as any;
    this.selectedIds.set(target.getSelectedAsSet());
  }

  private clearSelection(): void {
    this.selectedIds.set(new Set());
    this.selectionRef?.nativeElement?.setSelectedAsSet(new Set());
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
        this.error.set(this.translate.instant('businessPartners.createError'));
      },
    });
  }

  openDetail(id: string): void {
    this.selectedId.set(id);
    this.detailFullScreen.set(false);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id },
      queryParamsHandling: 'merge',
    });
  }

  closeDetail(): void {
    this.selectedId.set(null);
    this.detailFullScreen.set(false);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: null },
      queryParamsHandling: 'merge',
    });
  }

  onDetailDeleted(): void {
    this.closeDetail();
    this.load();
  }

  toggleDetailFullScreen(): void {
    this.detailFullScreen.set(!this.detailFullScreen());
  }

  requestDelete(partner: BusinessPartnerListItem, event: Event): void {
    event.stopPropagation();
    this.deleteCandidate.set(partner);
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
        this.error.set(this.translate.instant('businessPartners.deleteError'));
        this.deleteCandidate.set(null);
      },
    });
  }

  requestBulkDelete(): void {
    if (this.selectedCount() > 0) {
      this.bulkDeleteDialogOpen.set(true);
    }
  }

  cancelBulkDelete(): void {
    this.bulkDeleteDialogOpen.set(false);
  }

  confirmBulkDelete(): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) {
      this.bulkDeleteDialogOpen.set(false);
      return;
    }
    forkJoin(ids.map((id) => this.service.delete(id))).subscribe({
      next: () => {
        this.bulkDeleteDialogOpen.set(false);
        if (this.selectedId() && ids.includes(this.selectedId()!)) {
          this.closeDetail();
        }
        this.clearSelection();
        this.load();
      },
      error: () => {
        this.error.set(this.translate.instant('businessPartners.bulkDeleteError'));
        this.bulkDeleteDialogOpen.set(false);
      },
    });
  }
}
