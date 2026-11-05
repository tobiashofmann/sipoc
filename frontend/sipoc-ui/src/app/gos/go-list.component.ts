import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { GoService } from './go.service';
import { GoDetailComponent } from './go-detail.component';
import { GoListItem } from './go.model';
import { ViewportService } from '../shared/viewport.service';

type SortField = 'name' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export interface GoTreeRow {
  item: GoListItem;
  depth: number;
  hasChildren: boolean;
}

@Component({
  selector: 'app-go-list',
  standalone: true,
  imports: [CommonModule, FormsModule, GoDetailComponent, TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './go-list.component.html',
})
export class GoListComponent implements OnInit {
  gos = signal<GoListItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  searchTerm = signal('');
  sortField = signal<SortField>('name');
  sortDirection = signal<SortDirection>('asc');

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

  expandedIds = signal<Set<string>>(new Set());

  /** parentId (or '' for top-level) -> its direct children. */
  private childrenByParent = computed(() => {
    const map = new Map<string, GoListItem[]>();
    for (const go of this.gos()) {
      const key = go.parentId ?? '';
      const list = map.get(key) ?? [];
      list.push(go);
      map.set(key, list);
    }
    return map;
  });

  private sortedSiblings(parentKey: string): GoListItem[] {
    const children = this.childrenByParent().get(parentKey) ?? [];
    const field = this.sortField();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;
    return [...children].sort((a, b) => {
      const cmp = field === 'name' ? a.name.localeCompare(b.name) : a.updatedAt.localeCompare(b.updatedAt);
      return cmp * direction;
    });
  }

  /** Flattened, indented tree rows for the tree table: depth-first, respecting expand/collapse state. When
   *  searching, expand/collapse is ignored and ancestors of any match are kept visible so results stay reachable. */
  visibleRows = computed<GoTreeRow[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const tree = this.childrenByParent();
    const expanded = this.expandedIds();

    let matchOrAncestor: Set<string> | null = null;
    if (term) {
      matchOrAncestor = new Set<string>();
      const byId = new Map(this.gos().map((g) => [g.id, g]));
      for (const go of this.gos()) {
        if (go.name.toLowerCase().includes(term)) {
          let cursor: GoListItem | undefined = go;
          while (cursor) {
            matchOrAncestor.add(cursor.id);
            cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
          }
        }
      }
    }

    const rows: GoTreeRow[] = [];
    const visit = (parentKey: string, depth: number) => {
      for (const item of this.sortedSiblings(parentKey)) {
        if (matchOrAncestor && !matchOrAncestor.has(item.id)) {
          continue;
        }
        const hasChildren = (tree.get(item.id) ?? []).length > 0;
        rows.push({ item, depth, hasChildren });
        if (hasChildren && (matchOrAncestor ? true : expanded.has(item.id))) {
          visit(item.id, depth + 1);
        }
      }
    };
    visit('', 0);
    return rows;
  });

  toggleExpand(id: string, event: Event): void {
    event.stopPropagation();
    const next = new Set(this.expandedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.expandedIds.set(next);
  }

  createDialogOpen = signal(false);
  newName = '';
  newDescription = '';
  newCategory = '';

  deleteCandidate = signal<GoListItem | null>(null);

  constructor(
    private service: GoService,
    private route: ActivatedRoute,
    private router: Router,
    protected viewport: ViewportService,
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
        this.gos.set(page.content);
        this.expandedIds.set(new Set(page.content.filter((g) => g.parentId).map((g) => g.parentId!)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('gos.listLoadError'));
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

  openCreateDialog(): void {
    this.newName = '';
    this.newDescription = '';
    this.newCategory = '';
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
    this.service
      .create({
        name,
        description: this.newDescription.trim() || null,
        category: this.newCategory.trim() || null,
      })
      .subscribe({
        next: () => {
          this.createDialogOpen.set(false);
          this.load();
        },
        error: () => {
          this.error.set(this.translate.instant('gos.createError'));
        },
      });
  }

  openDetail(id: string): void {
    this.selectedId.set(id);
    this.detailFullScreen.set(false);
    this.router.navigate([], { relativeTo: this.route, queryParams: { id }, queryParamsHandling: 'merge' });
  }

  closeDetail(): void {
    this.selectedId.set(null);
    this.detailFullScreen.set(false);
    this.router.navigate([], { relativeTo: this.route, queryParams: { id: null }, queryParamsHandling: 'merge' });
  }

  toggleDetailFullScreen(): void {
    this.detailFullScreen.set(!this.detailFullScreen());
  }

  onDetailDeleted(): void {
    this.closeDetail();
    this.load();
  }

  requestDelete(go: GoListItem, event: Event): void {
    event.stopPropagation();
    this.deleteCandidate.set(go);
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
        this.error.set(this.translate.instant('gos.deleteError'));
        this.deleteCandidate.set(null);
      },
    });
  }
}
