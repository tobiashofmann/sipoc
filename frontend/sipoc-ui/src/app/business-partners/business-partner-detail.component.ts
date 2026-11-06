// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BusinessPartnerService } from './business-partner.service';
import { BusinessPartner, LipokUsageDto } from './business-partner.model';

@Component({
  selector: 'app-business-partner-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './business-partner-detail.component.html',
})
/**
 * Read/edit/delete panel for a single business partner, embedded by `BusinessPartnerListComponent`
 * (not routed). Also surfaces `lipokUsages` — every Lipok this partner is attached to, and in
 * which role(s) (see `usageInputNames`/`usageOutputNames`).
 */
export class BusinessPartnerDetailComponent implements OnChanges {
  @Input({ required: true }) id!: string;
  @Input() fullScreen = false;

  @Output() closed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();
  @Output() fullScreenToggled = new EventEmitter<void>();

  partner = signal<BusinessPartner | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  saving = signal(false);

  editing = signal(false);
  editName = '';
  editDescription = '';

  deleteDialogOpen = signal(false);

  constructor(
    private service: BusinessPartnerService,
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
    this.service.get(this.id).subscribe({
      next: (partner) => {
        this.partner.set(partner);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('businessPartners.loadError'));
        this.loading.set(false);
      },
    });
  }

  startEdit(): void {
    const partner = this.partner();
    if (!partner) {
      return;
    }
    this.editName = partner.name;
    this.editDescription = partner.description ?? '';
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
      next: (partner) => {
        this.partner.set(partner);
        this.saving.set(false);
        this.editing.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('businessPartners.saveError'));
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
        this.error.set(this.translate.instant('businessPartners.deleteError'));
        this.deleteDialogOpen.set(false);
      },
    });
  }

  openLipok(lipokId: string): void {
    this.router.navigate(['/sipocs'], { queryParams: { id: lipokId } });
  }

  usageInputNames(usage: LipokUsageDto): string {
    return usage.inputs?.length ? usage.inputs.map((e) => e.name).join(', ') : '—';
  }

  usageOutputNames(usage: LipokUsageDto): string {
    return usage.outputs?.length ? usage.outputs.map((e) => e.name).join(', ') : '—';
  }

  close(): void {
    this.closed.emit();
  }

  toggleFullScreen(): void {
    this.fullScreenToggled.emit();
  }
}
