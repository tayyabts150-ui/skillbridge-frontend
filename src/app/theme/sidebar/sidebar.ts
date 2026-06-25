import { Component, ViewEncapsulation, input, output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '@core';
import { Sidemenu } from '../sidemenu/sidemenu';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    Sidemenu,
    TranslateModule,
  ],
})
export class Sidebar {
  // inputs/outputs for layout
  readonly showToggle = input(true);
  readonly showUser = input(true);
  readonly showHeader = input(true);
  readonly toggleChecked = input(false);

  readonly toggleCollapsed = output<void>();
  readonly closeSidenav = output<void>();

  // services for logout functionality
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout() {
    this.auth.logout().subscribe(() => {
      this.router.navigateByUrl('/auth/login');
    });
  }
}
