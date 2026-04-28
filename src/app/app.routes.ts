import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'pipelines',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/pipelines-page.component').then(
        (m) => m.PipelinesPageComponent,
      ),
  },
  {
    path: 'integrations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/integrations/integrations-page.component').then(
        (m) => m.IntegrationsPageComponent,
      ),
  },
  {
    path: 'runs/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/runs/run-details-page.component').then(
        (m) => m.RunDetailsPageComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'pipelines' },
  { path: '**', redirectTo: 'pipelines' },
];
