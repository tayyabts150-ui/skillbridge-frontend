import { Component, ViewEncapsulation, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import screenfull from 'screenfull';

import { Branding } from '../widgets/branding';
import { SettingsService } from '@core';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
  host: {
    class: 'matero-header',
  },
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    Branding,
    // GithubButton,
    // NotificationButton,
  ],
})
export class Header {
  private readonly settings = inject(SettingsService);

  readonly options = this.settings.options;

  readonly showToggle = input(true);
  readonly showBranding = input(false);

  readonly toggleSidenav = output<void>();
  readonly toggleSidenavNotice = output<void>();

  toggleFullscreen() {
    if (screenfull.isEnabled) {
      screenfull.toggle();
    }
  }

  toggleTheme() {
    this.settings.setTheme(this.settings.options.theme === 'dark' ? 'light' : 'dark');
  }
}
