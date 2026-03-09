/**
 * HttpRequesterService — surcouche d'HttpClient avec gestion JWT et erreurs.
 *
 * NOTE : Le composant racine app.component.ts doit inclure <p-toast key="global" position="top-center">
 * pour que les toasts d'erreur s'affichent correctement.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Observable, EMPTY, switchMap, catchError, take } from 'rxjs';
import { ENVIRONMENT } from '../../core/tokens/environment.token';
import { Environment } from '../../../environments/environment.model';

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

  private refreshAndRetry<T>(
    retryFn: () => Observable<T>,
  ): Observable<T> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.router.navigate(['/login']);
      return EMPTY;
    }

    return this.http
      .post<RefreshResponse>(`${this.baseUrl}/auth/refresh`, {
        refresh_token: refreshToken,
      })
      .pipe(
        take(1),
        switchMap((response) => {
          this.setAccessToken(response.access_token);
          return retryFn();
        }),
        catchError(() => {
          this.router.navigate(['/login']);
          return EMPTY;
        }),
      );
  }

  private handleError<T>(
    error: HttpErrorResponse,
    retryFn: () => Observable<T>,
  ): Observable<T> {
    if (error.status === 401) {
      return this.refreshAndRetry(retryFn);
    }

    this.showErrorToast(error);
    return EMPTY;
  }

  // ---------------------------------------------------------------------------
  // Public HTTP methods
  // ---------------------------------------------------------------------------

  get<T>(path: string): Observable<T> {
    const call = (): Observable<T> =>
      this.http
        .get<T>(`${this.baseUrl}${path}`, { headers: this.buildHeaders() })
        .pipe(catchError((err: HttpErrorResponse) => this.handleError(err, call)));

    return call();
  }

  post<T>(path: string, body: unknown): Observable<T> {
    const call = (): Observable<T> =>
      this.http
        .post<T>(`${this.baseUrl}${path}`, body, {
          headers: this.buildHeaders(),
        })
        .pipe(catchError((err: HttpErrorResponse) => this.handleError(err, call)));

    return call();
  }

  put<T>(path: string, body: unknown): Observable<T> {
    const call = (): Observable<T> =>
      this.http
        .put<T>(`${this.baseUrl}${path}`, body, {
          headers: this.buildHeaders(),
        })
        .pipe(catchError((err: HttpErrorResponse) => this.handleError(err, call)));

    return call();
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    const call = (): Observable<T> =>
      this.http
        .patch<T>(`${this.baseUrl}${path}`, body, {
          headers: this.buildHeaders(),
        })
        .pipe(catchError((err: HttpErrorResponse) => this.handleError(err, call)));

    return call();
  }

  delete<T>(path: string): Observable<T> {
    const call = (): Observable<T> =>
      this.http
        .delete<T>(`${this.baseUrl}${path}`, { headers: this.buildHeaders() })
        .pipe(catchError((err: HttpErrorResponse) => this.handleError(err, call)));

    return call();
  }
}
