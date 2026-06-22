import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthService, LoginResponse, RegisterResponse, ChangePasswordResponse, UserProfile } from './auth.service';
import { HttpRequesterService } from './http-requester.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpRequesterSpy: jasmine.SpyObj<HttpRequesterService>;

  beforeEach(() => {
    httpRequesterSpy = jasmine.createSpyObj<HttpRequesterService>(
      'HttpRequesterService',
      ['get', 'post', 'saveTokens'],
    );

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpRequesterService, useValue: httpRequesterSpy },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  // ---------------------------------------------------------------------------
  // Creation
  // ---------------------------------------------------------------------------

  describe('initial state', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be unauthenticated when no access_token in localStorage', () => {
      localStorage.removeItem('access_token');
      // Re-create service to re-evaluate signal
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          { provide: HttpRequesterService, useValue: httpRequesterSpy },
        ],
      });
      const freshService = TestBed.inject(AuthService);
      expect(freshService.isAuthenticated()).toBeFalse();
    });

    it('should be authenticated when access_token is present in localStorage', () => {
      localStorage.setItem('access_token', 'some-token');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          { provide: HttpRequesterService, useValue: httpRequesterSpy },
        ],
      });
      const freshService = TestBed.inject(AuthService);
      expect(freshService.isAuthenticated()).toBeTrue();
      localStorage.removeItem('access_token');
    });
  });

  // ---------------------------------------------------------------------------
  // register()
  // ---------------------------------------------------------------------------

  describe('register()', () => {
    const input = {
      email: 'alice@example.com',
      password: 'secret123',
      first_name: 'Alice',
      last_name: 'Dupont',
    };

    const mockResponse: RegisterResponse = {
      id: 1,
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
    };

    it('should call POST /auth/register with the correct body', () => {
      httpRequesterSpy.post.and.returnValue(of(mockResponse));

      service.register(input).subscribe();

      expect(httpRequesterSpy.post).toHaveBeenCalledOnceWith(
        '/auth/register',
        input,
        jasmine.objectContaining({ succes_message: jasmine.any(String) }),
      );
    });

    it('should return the server response on success', (done) => {
      httpRequesterSpy.post.and.returnValue(of(mockResponse));

      service.register(input).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('400 Bad Request');
      httpRequesterSpy.post.and.returnValue(throwError(() => error));

      service.register(input).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should forward first_name and last_name as-is to the API', () => {
      httpRequesterSpy.post.and.returnValue(of(mockResponse));

      service.register({ email: 'b@b.com', password: 'pwd', first_name: 'Bob', last_name: 'Martin' }).subscribe();

      const body = httpRequesterSpy.post.calls.mostRecent().args[1] as {
        first_name: string;
        last_name: string;
      };
      expect(body.first_name).toBe('Bob');
      expect(body.last_name).toBe('Martin');
    });
  });

  // ---------------------------------------------------------------------------
  // changePassword()
  // ---------------------------------------------------------------------------

  describe('changePassword()', () => {
    const input = { old_password: 'oldPass1', new_password: 'newPass2' };
    const mockResponse: ChangePasswordResponse = { detail: 'Password updated.' };

    it('should call POST /auth/me/change-password with the correct body', () => {
      httpRequesterSpy.post.and.returnValue(of(mockResponse));

      service.changePassword(input).subscribe();

      expect(httpRequesterSpy.post).toHaveBeenCalledOnceWith(
        '/auth/me/change-password',
        input,
      );
    });

    it('should return the server response on success', (done) => {
      httpRequesterSpy.post.and.returnValue(of(mockResponse));

      service.changePassword(input).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        done();
      });
    });

    it('should forward old_password and new_password as-is to the API', () => {
      httpRequesterSpy.post.and.returnValue(of(mockResponse));

      service.changePassword({ old_password: 'aaa', new_password: 'bbb' }).subscribe();

      const body = httpRequesterSpy.post.calls.mostRecent().args[1] as {
        old_password: string;
        new_password: string;
      };
      expect(body.old_password).toBe('aaa');
      expect(body.new_password).toBe('bbb');
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('403 Forbidden');
      httpRequesterSpy.post.and.returnValue(throwError(() => error));

      service.changePassword(input).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getMe()
  // ---------------------------------------------------------------------------

  describe('getMe()', () => {
    const mockProfile: UserProfile = {
      id: 1,
      email: 'alice@example.com',
      first_name: 'Alice',
      last_name: 'Dupont',
    };

    it('should call GET /auth/me', () => {
      httpRequesterSpy.get.and.returnValue(of(mockProfile));

      service.getMe().subscribe();

      expect(httpRequesterSpy.get).toHaveBeenCalledOnceWith('/auth/me');
    });

    it('should return the server response on success', (done) => {
      httpRequesterSpy.get.and.returnValue(of(mockProfile));

      service.getMe().subscribe((res) => {
        expect(res).toEqual(mockProfile);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('401 Unauthorized');
      httpRequesterSpy.get.and.returnValue(throwError(() => error));

      service.getMe().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // login()
  // ---------------------------------------------------------------------------

  describe('login()', () => {
    const input = { email: 'jap@padel.fr', password: 'password' };
    const mockTokens: LoginResponse = {
      access: 'access-jwt-token',
      refresh: 'refresh-jwt-token',
    };

    it('should call POST /auth/token with the correct body', () => {
      httpRequesterSpy.post.and.returnValue(of(mockTokens));

      service.login(input).subscribe();

      expect(httpRequesterSpy.post).toHaveBeenCalledOnceWith(
        '/auth/token',
        input,
        jasmine.objectContaining({ enable_retry: false }),
      );
    });

    it('should return access and refresh tokens on success', (done) => {
      httpRequesterSpy.post.and.returnValue(of(mockTokens));

      service.login(input).subscribe((res) => {
        expect(res.access).toBe('access-jwt-token');
        expect(res.refresh).toBe('refresh-jwt-token');
        done();
      });
    });

    it('should save tokens in storage after a successful login', (done) => {
      httpRequesterSpy.post.and.returnValue(of(mockTokens));

      service.login(input).subscribe(() => {
        expect(httpRequesterSpy.saveTokens).toHaveBeenCalledOnceWith(
          'access-jwt-token',
          'refresh-jwt-token',
        );
        done();
      });
    });

    it('should not save tokens when login fails', (done) => {
      const error = new Error('401 Unauthorized');
      httpRequesterSpy.post.and.returnValue(throwError(() => error));

      service.login({ email: input.email, password: 'wrong-password' }).subscribe({
        error: () => {
          expect(httpRequesterSpy.saveTokens).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should propagate HTTP errors on invalid credentials', (done) => {
      const error = new Error('401 Unauthorized');
      httpRequesterSpy.post.and.returnValue(throwError(() => error));

      service.login({ email: input.email, password: 'wrong-password' }).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should propagate server errors (500)', (done) => {
      const error = new Error('500 Internal Server Error');
      httpRequesterSpy.post.and.returnValue(throwError(() => error));

      service.login(input).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // logout()
  // ---------------------------------------------------------------------------

  describe('logout()', () => {
    it('should remove access_token and refresh_token from localStorage', () => {
      localStorage.setItem('access_token', 'tok');
      localStorage.setItem('refresh_token', 'ref');

      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('should set isAuthenticated to false', () => {
      service.logout();

      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should set isAuthenticated to false even when called multiple times', () => {
      service.logout();
      service.logout();

      expect(service.isAuthenticated()).toBeFalse();
    });
  });

});
