// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { CUSTOM_ELEMENTS_SCHEMA, Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.css',
})
/** Application shell: top-level header/navigation plus the routed `<router-outlet>`. */
export class AppComponent {
  title = 'sipoc-ui';

  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }
}
