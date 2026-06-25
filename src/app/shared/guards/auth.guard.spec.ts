import { PLATFORM_ID, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let router: Router;
  let isAuthenticated: WritableSignal<boolean>;
  let authServiceStub: Pick<AuthService, 'isAuthenticated'>;

  function setup(platform: 'server' | 'browser'): void {
    isAuthenticated = signal(false);
    authServiceStub = { isAuthenticated };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: PLATFORM_ID, useValue: platform },
      ],
    });

    router = TestBed.inject(Router);
  }

  function runGuard(url: string): boolean | UrlTree {
    const route = {} as ActivatedRouteSnapshot;
    const state = { url } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => authGuard(route, state)) as boolean | UrlTree;
  }

  describe('on the server', () => {
    beforeEach(() => setup('server'));

    it('should redirect to /loading with the original url as redirect query param', () => {
      const result = router.serializeUrl(runGuard('/home') as UrlTree);

      expect(result).toBe('/loading?redirect=%2Fhome');
    });

    it('should preserve query params of the original url when building the redirect target', () => {
      const result = router.serializeUrl(runGuard('/tournaments/setup/42?tab=pools') as UrlTree);

      expect(result).toBe('/loading?redirect=%2Ftournaments%2Fsetup%2F42%3Ftab%3Dpools');
    });

    it('should not evaluate AuthService.isAuthenticated', () => {
      const spy = spyOn(authServiceStub, 'isAuthenticated');

      runGuard('/home');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('on the browser', () => {
    beforeEach(() => setup('browser'));

    it('should allow access when authenticated', () => {
      isAuthenticated.set(true);

      const result = runGuard('/home');

      expect(result).toBeTrue();
    });

    it('should redirect to /auth/login when not authenticated', () => {
      isAuthenticated.set(false);

      const result = router.serializeUrl(runGuard('/home') as UrlTree);

      expect(result).toBe('/auth/login');
    });
  });
});
