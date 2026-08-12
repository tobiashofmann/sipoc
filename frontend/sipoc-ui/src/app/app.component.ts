import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
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
