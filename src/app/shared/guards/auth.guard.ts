import { isPlatformServer } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {AuthService} from '../services/auth.service';

/**
 * Protects routes that require authentication.
 * If not authenticated, redirects to /auth/login.
 *
 * On the server, localStorage is unavailable so the real auth state can't be
 * determined yet — redirect to /loading instead of guessing, to avoid
 * flashing the wrong page before the client re-runs this guard with the
 * reliable client-side auth state.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  if (isPlatformServer(inject(PLATFORM_ID))) {
    return router.createUrlTree(['/loading'], { queryParams: { redirect: state.url } });
  }

  const auth = inject(AuthService);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  return true;
};
