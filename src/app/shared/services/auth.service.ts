import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpRequesterOptions, HttpRequesterService } from './http-requester.service';
import {
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordConfirmRequest,
  ResetPasswordRequest,
} from '../models/auth.models';

export type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordConfirmRequest,
  ResetPasswordRequest,
};

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
    return this.http.post<RegisterResponse>('/auth/register', input, options);
  }

  /**
   * Changes the authenticated user's password.
   * POST /auth/change-password
   */
  changePassword(input: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>('/auth/change-password', input);
  }

  /**
   * Send email with url to reset password
   * POST /auth/password-reset
   */
  resetPassword(input: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>('/auth/password-reset', input);
  }

  /**
   * Reset password based on token and new_password
   * POST /auth/password-reset/confirm
   */
  resetPasswordConfirm(input: ResetPasswordConfirmRequest): Observable<void> {
    const options: HttpRequesterOptions = {
      succes_message: `Votre mot de passe a bien été réinitialisé.\n
      Vous allez être redirigé vers la page de connexion.`,
    }
    return this.http.post<void>('/auth/password-reset/confirm', input, options);
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
