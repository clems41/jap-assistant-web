import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthService, LoginResponse, RegisterResponse, ChangePasswordResponse } from './auth.service';
import { HttpRequesterService } from './http-requester.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpRequesterSpy: jasmine.SpyObj<HttpRequesterService>;

  beforeEach(() => {
    httpRequesterSpy = jasmine.createSpyObj<HttpRequesterService>(
      'HttpRequesterService',
      ['post', 'saveTokens'],
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
  });

  // ---------------------------------------------------------------------------
  // register()
  // ---------------------------------------------------------------------------

  describe('register()', () => {
    const email = 'alice@example.com';
    const password = 'secret123';
    const firstName = 'Alice';
    const lastName = 'Dupont';

    const mockResponse: RegisterResponse = {
      id: 1,
      email,
      first_name: firstName,
      last_name: lastName,
    };

    it('should call POST /auth/register with the correct body', () => {
      httpRequesterSpy.post.and.returnValue(of(mockResponse));

      service.register(email, password, firstName, lastName).subscribe();

      expect(httpRequesterSpy.post).toHaveBeenCalledOnceWith('/auth/register', {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
    });

    it('should return the server response on success', (done) => {
      httpRequesterSpy.post.and.returnValue(of(mockResponse));

      service.register(email, password, firstName, lastName).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('400 Bad Request');
      httpRequesterSpy.post.and.returnValue(throwError(() => error));

      service.register(email, password, firstName, lastName).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should map firstName / lastName to snake_case fields', () => {
      httpRequesterSpy.post.and.returnValue(of(mockResponse));

      service.register('b@b.com', 'pwd', 'Bob', 'Martin').subscribe();

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
    const oldPassword = 'oldPass1';
    const newPassword = 'newPass2';
    const mockResponse: ChangePasswordResponse = { detail: 'Password updated.' };

    it('should call POST /auth/change-password with the correct body', () => {
      httpRequesterSpy.post.and.returnValue(of(mockResponse));

      service.changePassword(oldPassword, newPassword).subscribe();

      expect(httpRequesterSpy.post).toHaveBeenCalledOnceWith(
        '/auth/change-password',
        { old_password: oldPassword, new_password: newPassword },
      );
    });

    it('should return the server response on success', (done) => {
      httpRequesterSpy.post.and.returnValue(of(mockResponse));

      service.changePassword(oldPassword, newPassword).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        done();
      });
    });

    it('should map oldPassword / newPassword to snake_case fields', () => {
      httpRequesterSpy.post.and.returnValue(of(mockResponse));

      service.changePassword('aaa', 'bbb').subscribe();

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

      service.changePassword(oldPassword, newPassword).subscribe({
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
    const email = 'jap@padel.fr';
    const password = 'password';
    const mockTokens: LoginResponse = {
      access: 'access-jwt-token',
      refresh: 'refresh-jwt-token',
    };

    it('should call POST /auth/token with the correct body', () => {
      httpRequesterSpy.post.and.returnValue(of(mockTokens));

      service.login(email, password).subscribe();

      expect(httpRequesterSpy.post).toHaveBeenCalledOnceWith('/auth/token', {
        email,
        password,
      });
    });

    it('should return access and refresh tokens on success', (done) => {
      httpRequesterSpy.post.and.returnValue(of(mockTokens));

      service.login(email, password).subscribe((res) => {
        expect(res.access).toBe('access-jwt-token');
        expect(res.refresh).toBe('refresh-jwt-token');
        done();
      });
    });

    it('should save tokens in storage after a successful login', (done) => {
      httpRequesterSpy.post.and.returnValue(of(mockTokens));

      service.login(email, password).subscribe(() => {
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

      service.login(email, 'wrong-password').subscribe({
        error: () => {
          expect(httpRequesterSpy.saveTokens).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should propagate HTTP errors on invalid credentials', (done) => {
      const error = new Error('401 Unauthorized');
      httpRequesterSpy.post.and.returnValue(throwError(() => error));

      service.login(email, 'wrong-password').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should propagate server errors (500)', (done) => {
      const error = new Error('500 Internal Server Error');
      httpRequesterSpy.post.and.returnValue(throwError(() => error));

      service.login(email, password).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

});
