import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpRequesterService } from './http-requester.service';
import { BracketStatePayload, BracketStateResponse } from '../models/bracket.models';

@Injectable({ providedIn: 'root' })
export class BracketApiService {
  private http = inject(HttpRequesterService);

  /** GET /api/v1/tournaments/{tournamentId}/bracket/ — retourne null si aucun tableau sauvegardé (404) */
  getBracketState(tournamentId: number): Observable<BracketStateResponse | null> {
    return this.http.get<BracketStateResponse>(
      `/tournaments/${tournamentId}/bracket`,
      undefined,
      { show_error: false }
    ).pipe(
      catchError((err: HttpErrorResponse) =>
        err.status === 404 ? of(null) : throwError(() => err)
      )
    );
  }

  /** PUT /api/v1/tournaments/{tournamentId}/bracket/ — crée ou remplace l'état du tableau */
  saveBracketState(tournamentId: number, payload: BracketStatePayload): Observable<BracketStateResponse> {
    return this.http.put<BracketStateResponse>(
      `/tournaments/${tournamentId}/bracket`,
      payload,
      { succes_message: 'Tableau enregistré' }
    );
  }
}
