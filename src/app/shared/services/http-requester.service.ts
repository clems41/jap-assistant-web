/**
 * HttpRequesterService — surcouche d'HttpClient avec gestion JWT et erreurs.
 *
 * NOTE : Le composant racine app.component.ts doit inclure <p-toast key="global" position="top-center">
 * pour que les toasts d'erreur s'affichent correctement.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import {Observable, EMPTY, throwError, switchMap, catchError, take, tap} from 'rxjs';
import { ENVIRONMENT } from '../../core/tokens/environment.token';
import { Environment } from '../../../environments/environment.model';

export interface HttpRequesterOptions {
  succes_message?: string;
  show_error?: boolean;
  enable_retry?: boolean;
}

interface RefreshResponse {
  access_token: string;
}

interface ApiErrorResponse {
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class HttpRequesterService {
  private defaultShowError: boolean = true;
  private defaultEnableRetry: boolean = true;
  private http = inject(HttpClient);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private environment = inject<Environment>(ENVIRONMENT);

  private get baseUrl(): string {
    return this.environment.apiBaseUrl;
  }

  // ---------------------------------------------------------------------------
  // Token helpers
  // ---------------------------------------------------------------------------

  private getAccessToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem('refresh_token');
  }

  private setAccessToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  saveTokens(access: string, refresh: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    }
  }

  private buildParams(params?: object): HttpParams {
    if (!params) return new HttpParams();
    return Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .reduce((acc, [k, v]) => acc.set(k, String(v)), new HttpParams());
  }

  private buildHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    if (token) {
      return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }
    return new HttpHeaders();
  }

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------

  private showErrorToast(error: HttpErrorResponse): void {
    const body = error.error as ApiErrorResponse | null;
    const message =
      body?.message ?? error.message ?? 'Une erreur est survenue.';

    this.messageService.add({
      key: 'global',
      severity: 'error',
      summary: 'Erreur',
      detail: message,
      life: 5000,
    });
  }

  private showSuccessToast(message: string): void {
    this.messageService.add({
      key: 'global',
      severity: 'success',
      summary: 'Succès',
      detail: message,
      life: 5000,
    });
  }

  private refreshAndRetry<T>(
    retryFn: () => Observable<T>,
  ): Observable<T> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.router.navigate(['/auth/login']);
      return EMPTY;
    }

    return this.http
      .post<RefreshResponse>(`${this.baseUrl}/auth/token/refresh/`, {
        refresh_token: refreshToken,
      })
      .pipe(
        take(1),
        switchMap((response) => {
          this.setAccessToken(response.access_token);
          return retryFn();
        }),
        catchError(() => {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }
          this.router.navigate(['/auth/login']);
          return EMPTY;
        }),
      );
  }

  private handleError<T>(
    error: HttpErrorResponse,
    retryFn: () => Observable<T>,
    options?: HttpRequesterOptions
  ): Observable<T> {
    const enableRetry = options?.enable_retry ?? this.defaultEnableRetry;
    const showError = options?.show_error ?? this.defaultShowError;

    if (error.status === 401 && enableRetry) {
      return this.refreshAndRetry(retryFn);
    }

    if (showError) {
      this.showErrorToast(error);
    }

    return throwError(() => error);
  }

  private handleSuccess(options?: HttpRequesterOptions): void {
    if (options?.succes_message !== undefined) {
      this.showSuccessToast(options.succes_message);
    }
  }

  // ---------------------------------------------------------------------------
  // Public HTTP methods
  // ---------------------------------------------------------------------------

  get<T>(
    path: string,
    params?: object,
    options?: HttpRequesterOptions
  ): Observable<T> {
    const call = (): Observable<T> =>
      this.http
        .get<T>(`${this.baseUrl}${path}/`, {
          headers: this.buildHeaders(),
          params: this.buildParams(params),
        })
        .pipe(
          tap(() => this.handleSuccess(options)),
          catchError((err: HttpErrorResponse) => this.handleError(err, call, options))
        );

    return call();
  }

  post<T>(path: string, body: unknown, options?: HttpRequesterOptions): Observable<T> {
    const call = (): Observable<T> =>
      this.http
        .post<T>(`${this.baseUrl}${path}/`, body, {
          headers: this.buildHeaders(),
        })
        .pipe(
          tap(() => this.handleSuccess(options)),
          catchError((err: HttpErrorResponse) => this.handleError(err, call, options))
        );

    return call();
  }

  put<T>(path: string, body: unknown, options?: HttpRequesterOptions): Observable<T> {
    const call = (): Observable<T> =>
      this.http
        .put<T>(`${this.baseUrl}${path}/`, body, {
          headers: this.buildHeaders(),
        })
        .pipe(
          tap(() => this.handleSuccess(options)),
          catchError((err: HttpErrorResponse) => this.handleError(err, call, options))
        );

    return call();
  }

  patch<T>(path: string, body: unknown, options?: HttpRequesterOptions): Observable<T> {
    const call = (): Observable<T> =>
      this.http
        .patch<T>(`${this.baseUrl}${path}/`, body, {
          headers: this.buildHeaders(),
        })
        .pipe(
          tap(() => this.handleSuccess(options)),
          catchError((err: HttpErrorResponse) => this.handleError(err, call, options))
        );

    return call();
  }

  delete<T>(path: string, options?: HttpRequesterOptions): Observable<T> {
    const call = (): Observable<T> =>
      this.http
        .delete<T>(`${this.baseUrl}${path}/`, { headers: this.buildHeaders() })
        .pipe(
          tap(() => this.handleSuccess(options)),
          catchError((err: HttpErrorResponse) => this.handleError(err, call, options))
        );

    return call();
  }
}
