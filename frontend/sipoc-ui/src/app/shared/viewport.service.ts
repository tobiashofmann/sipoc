// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { Injectable, computed, signal } from '@angular/core';

/** Matches ui5-flexible-column-layout's own desktop breakpoint (>= 1024px shows up to 3 columns). */
const DESKTOP_BREAKPOINT = 1024;
/** SAP Fiori's phone/tablet split (0-599px phone, 600-1023px tablet). */
const TABLET_BREAKPOINT = 600;

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private width = signal(window.innerWidth);
  isDesktop = computed(() => this.width() >= DESKTOP_BREAKPOINT);
  isPhone = computed(() => this.width() < TABLET_BREAKPOINT);

  constructor() {
    window.addEventListener('resize', () => this.width.set(window.innerWidth));
  }
}
