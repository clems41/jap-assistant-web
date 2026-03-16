import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  // Redirect root to /home (authGuard on /home will redirect to /auth/login if needed)
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },

  // Auth routes — accessible to guests only
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then(
        (m) => m.AuthLayoutComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/auth/login/login.component').then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/auth/register/register.component').then(
            (m) => m.RegisterComponent,
          ),
      },
      {
        path: 'password-forgotten',
        loadComponent: () =>
          import(
            './pages/auth/password-forgotten/password-forgotten.component'
          ).then((m) => m.PasswordForgottenComponent),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import(
            './pages/auth/reset-password/reset-password.component'
          ).then((m) => m.ResetPasswordComponent),
      },
    ],
  },

  // Main app routes — protected by authGuard
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home/home.component').then(
            (m) => m.HomeComponent,
          ),
      },
    ],
  },

  // Wildcard — redirect to root
  {
    path: '**',
    redirectTo: '',
  },
];
