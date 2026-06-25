import { Routes } from '@angular/router';
import { authGuard } from '@core';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./onboarding-wizard/onboarding-wizard').then(m => m.OnboardingWizard),
  },
];
