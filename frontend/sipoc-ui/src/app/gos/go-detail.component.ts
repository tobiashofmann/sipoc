import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { GoService } from './go.service';
import { BoType, Criticality, CustomProperty, Go, GoListItem, GoTreeNode, Importance } from './go.model';

export interface GoHierarchyRow {
  id: string;
  name: string;
  description: string | null;
  depth: number;
}

/** Depth-first flattens a Go hierarchy tree into rows for a simple indented list rendering. */
function flattenTree(nodes: GoTreeNode[], depth: number, rows: GoHierarchyRow[]): void {
  for (const node of nodes) {
    rows.push({ id: node.id, name: node.name, description: node.description, depth });
    if (node.children?.length) {
      flattenTree(node.children, depth + 1, rows);
    }
  }
}

@Component({
  selector: 'app-go-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './go-detail.component.html',
})
/** Read/edit/delete panel for a single Go taxonomy node, embedded by `GoListComponent` (not routed). */
export class GoDetailComponent implements OnChanges {
  @Input({ required: true }) id!: string;
  @Input() fullScreen = false;

  @Output() closed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();
  @Output() fullScreenToggled = new EventEmitter<void>();
  /** Emitted when the user clicks another Go in the hierarchy tree table, to navigate the master list's selection there. */
  @Output() selectGo = new EventEmitter<string>();

  go = signal<Go | null>(null);
  parentName = signal<string | null>(null);
  hierarchyRows = signal<GoHierarchyRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  saving = signal(false);

  editing = signal(false);
  editName = '';
  editDescription = '';
  editCategory = '';
  editType: BoType | '' = '';
  editImportance: Importance | '' = '';
  editCriticality: Criticality | '' = '';
  editParentId = '';
  editCustomProps: CustomProperty[] = [];

  parentOptions = signal<GoListItem[]>([]);

  deleteDialogOpen = signal(false);

  constructor(
    private service: GoService,
    private router: Router,
    private translate: TranslateService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['id']) {
      this.editing.set(false);
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.parentName.set(null);
    this.hierarchyRows.set([]);
    this.service.get(this.id).subscribe({
      next: (go) => {
        this.go.set(go);
        this.loading.set(false);
        if (go.parentId) {
          this.service.get(go.parentId).subscribe({ next: (parent) => this.parentName.set(parent.name) });
        }
      },
      error: () => {
        this.error.set(this.translate.instant('gos.loadError'));
        this.loading.set(false);
      },
    });
    this.service.hierarchy(this.id).subscribe({
      next: (tree) => {
        const rows: GoHierarchyRow[] = [];
        flattenTree(tree, 0, rows);
        this.hierarchyRows.set(rows);
      },
      error: () => {
        this.hierarchyRows.set([]);
      },
    });
  }

  openHierarchyGo(id: string): void {
    if (id === this.id) {
      return;
    }
    this.selectGo.emit(id);
  }

  openLipok(lipokId: string): void {
    this.router.navigate(['/sipocs'], { queryParams: { id: lipokId } });
  }

  startEdit(): void {
    const go = this.go();
    if (!go) {
      return;
    }
    this.editName = go.name;
    this.editDescription = go.description ?? '';
    this.editCategory = go.category ?? '';
    this.editType = go.type ?? '';
    this.editImportance = go.importance ?? '';
    this.editCriticality = go.criticality ?? '';
    this.editParentId = go.parentId ?? '';
    this.editCustomProps = go.customProperties.map((p) => ({ ...p }));
    this.editing.set(true);

    this.service.list(0, 100).subscribe({
      next: (page) => this.parentOptions.set(page.content.filter((g) => g.id !== this.id)),
    });
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  addCustomProperty(): void {
    this.editCustomProps = [...this.editCustomProps, { key: '', value: '' }];
  }

  removeCustomProperty(index: number): void {
    this.editCustomProps = this.editCustomProps.filter((_, i) => i !== index);
  }

  save(): void {
    const name = this.editName.trim();
    if (!name) {
      return;
    }
    this.saving.set(true);
    this.service
      .update(this.id, {
        name,
        description: this.editDescription.trim() || null,
        category: this.editCategory.trim() || null,
        parentId: this.editParentId || null,
        type: this.editType || null,
        importance: this.editImportance || null,
        criticality: this.editCriticality || null,
        customProperties: this.editCustomProps.filter((p) => p.key.trim()),
      })
      .subscribe({
        next: (go) => {
          this.go.set(go);
          this.saving.set(false);
          this.editing.set(false);
          this.parentName.set(null);
          if (go.parentId) {
            this.service.get(go.parentId).subscribe({ next: (parent) => this.parentName.set(parent.name) });
          }
        },
        error: () => {
          this.error.set(this.translate.instant('gos.saveError'));
          this.saving.set(false);
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
        this.error.set(this.translate.instant('gos.deleteError'));
        this.deleteDialogOpen.set(false);
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
