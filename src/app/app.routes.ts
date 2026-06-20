import { Routes } from '@angular/router';
import {guestGuard} from './shared/guards/guest.guard';
import {authGuard} from './shared/guards/auth.guard';

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
        data: {title: 'Accueil'},
        loadComponent: () =>
          import('./pages/home/home/home.component').then(
            (m) => m.HomeComponent,
          ),
      },
      {
        path: 'user-profile',
        data: {title: 'Profil utilisateur'},
        loadComponent: () =>
          import('./pages/user-profile/user-profile.component').then(
            (m) => m.UserProfileComponent,
          ),
      },
      {
        path: 'tournaments',
        children: [
          {
            path: 'setup/:id',
            data: {title: 'Configuration de tournoi'},
            loadComponent: () =>
              import('./pages/tournaments/setup/setup.component').then(
                (m) => m.SetupComponent,
              ),
          },
        ],
      },
    ],
  },

  // Standalone draw tool — opened in a separate popup window, no main layout
  {
    path: 'draw',
    canActivate: [authGuard],
    data: {title: 'Tirage au sort'},
    loadComponent: () =>
      import('./pages/draw/draw.page').then(m => m.DrawPageComponent),
  },

  // Wildcard — redirect to root
  {
    path: '**',
    redirectTo: '',
  },
];
