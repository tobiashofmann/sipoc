import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { HomeStatsService } from './home-stats.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './home.component.html',
})
/** Dashboard landing page: summary counts plus shortcuts into the three feature areas. */
export class HomeComponent implements OnInit {
  lipokCount = signal<number | null>(null);
  documentCount = signal<number | null>(null);

  constructor(
    private router: Router,
    private stats: HomeStatsService,
  ) {}

  ngOnInit(): void {
    this.stats.lipokCount().subscribe((count) => this.lipokCount.set(count));
    forkJoin([this.stats.inputCount(), this.stats.outputCount()]).subscribe(([inputs, outputs]) =>
      this.documentCount.set(inputs + outputs),
    );
  }

  openBusinessPartners(): void {
    this.router.navigate(['/business-partners']);
  }

  openSipocs(): void {
    this.router.navigate(['/sipocs']);
  }

  openGos(): void {
    this.router.navigate(['/gos']);
  }
}
