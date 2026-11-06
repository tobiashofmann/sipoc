// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { BusinessPartnerListComponent } from './business-partners/business-partner-list.component';
import { SipocListComponent } from './sipocs/sipoc-list.component';
import { GoListComponent } from './gos/go-list.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: 'business-partners', component: BusinessPartnerListComponent },
  { path: 'sipocs', component: SipocListComponent },
  { path: 'gos', component: GoListComponent },
];
