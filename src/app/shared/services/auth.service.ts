import {Injectable, inject, signal} from '@angular/core';
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
  register(input: RegisterRequest): Observable<RegisterResponse> {
    const options: HttpRequesterOptions = {
      succes_message: `Votre compte a été correctement créée, vous allez être redirigé vers la page d'accueil.`,
    }
    return this.http.post<RegisterResponse>('/auth/register', input,options);
  }

  /**
   * Changes the authenticated user's password.
   * POST /auth/change-password
   */
  changePassword(input: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>('/auth/change-password', input);
  }

  /**
   * Authenticates a user and returns JWT access + refresh tokens.
   * POST /auth/token
   */
  login(input: LoginRequest): Observable<LoginResponse> {
    const options: HttpRequesterOptions = {
      enable_retry: false,
    }
    return this.http.post<LoginResponse>('/auth/token', input, options).pipe(
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
