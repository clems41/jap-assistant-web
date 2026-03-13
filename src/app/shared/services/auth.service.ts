import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {HttpRequesterOptions, HttpRequesterService} from './http-requester.service';

// ---------------------------------------------------------------------------
// Request / Response interfaces
// ---------------------------------------------------------------------------

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface RegisterResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  detail: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpRequesterService);

  private readonly _isAuthenticated = signal<boolean>(
    typeof localStorage !== 'undefined' && !!localStorage.getItem('access_token'),
  );
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  /**
   * Registers a new user account.
   * POST /auth/register
   */
  register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Observable<RegisterResponse> {
    const body: RegisterRequest = {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    };
    return this.http.post<RegisterResponse>('/auth/register', body);
  }

  /**
   * Changes the authenticated user's password.
   * POST /auth/change-password
   */
  changePassword(
    oldPassword: string,
    newPassword: string,
  ): Observable<ChangePasswordResponse> {
    const body: ChangePasswordRequest = {
      old_password: oldPassword,
      new_password: newPassword,
    };
    return this.http.post<ChangePasswordResponse>('/auth/change-password', body);
  }

  /**
   * Authenticates a user and returns JWT access + refresh tokens.
   * POST /auth/token
   */
  login(email: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { email, password };
    const options: HttpRequesterOptions = {
      enable_retry: false,
    }
    return this.http.post<LoginResponse>('/auth/token', body, options).pipe(
      tap((res) => {
        this.http.saveTokens(res.access, res.refresh);
        this._isAuthenticated.set(true);
      }),
    );
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    this._isAuthenticated.set(false);
  }

}
