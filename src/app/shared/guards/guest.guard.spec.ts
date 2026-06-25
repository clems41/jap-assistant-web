import { PLATFORM_ID, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { guestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

describe('guestGuard', () => {
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
    return TestBed.runInInjectionContext(() => guestGuard(route, state)) as boolean | UrlTree;
  }

  describe('on the server', () => {
    beforeEach(() => setup('server'));

    it('should redirect to /loading with the original url as redirect query param', () => {
      const result = router.serializeUrl(runGuard('/auth/login') as UrlTree);

      expect(result).toBe('/loading?redirect=%2Fauth%2Flogin');
    });

    it('should not evaluate AuthService.isAuthenticated', () => {
      const spy = spyOn(authServiceStub, 'isAuthenticated');

      runGuard('/auth/login');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('on the browser', () => {
    beforeEach(() => setup('browser'));

    it('should allow access when not authenticated', () => {
      isAuthenticated.set(false);

      const result = runGuard('/auth/login');

      expect(result).toBeTrue();
    });

    it('should redirect to /home when already authenticated', () => {
      isAuthenticated.set(true);

      const result = router.serializeUrl(runGuard('/auth/login') as UrlTree);

      expect(result).toBe('/home');
    });
  });
});
