import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { HttpRequesterService } from './http-requester.service';
import {
  LastLeagueResponse,
  PaginatedTournamentRequest,
  Tournament,
  TournamentRequest,
} from '../models/tournament.models';
import {EnumChoice, PaginatedResponse} from '../models/base.models';

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private http = inject(HttpRequesterService);

  private categories$ = this.http.get<EnumChoice[]>('/tournaments/enums/categories').pipe(shareReplay(1));
  private genders$ = this.http.get<EnumChoice[]>('/tournaments/enums/genders').pipe(shareReplay(1));
  private leagues$ = this.http.get<EnumChoice[]>('/tournaments/enums/leagues').pipe(shareReplay(1));
  private lastLeague$ = this.http.get<LastLeagueResponse>('/tournaments/last-league').pipe(shareReplay(1));

  /** GET /api/v1/tournaments/ */
  getTournaments(filters?: PaginatedTournamentRequest): Observable<PaginatedResponse<Tournament>> {
    return this.http.get<PaginatedResponse<Tournament>>('/tournaments', filters);
  }

  /** POST /api/v1/tournaments/ */
  createTournament(input: TournamentRequest): Observable<Tournament> {
    return this.http.post<Tournament>('/tournaments', input);
  }

  /** GET /api/v1/tournaments/{id}/ */
  getTournament(id: number): Observable<Tournament> {
    return this.http.get<Tournament>(`/tournaments/${id}`);
  }

  /** PUT /api/v1/tournaments/{id}/ */
  updateTournament(id: number, input: TournamentRequest): Observable<Tournament> {
    return this.http.put<Tournament>(`/tournaments/${id}`, input);
  }

  /** DELETE /api/v1/tournaments/{id}/ */
  deleteTournament(id: number): Observable<void> {
    return this.http.delete<void>(`/tournaments/${id}`);
  }

  /** GET /api/v1/tournaments/enums/categories/ */
  getCategories(): Observable<EnumChoice[]> {
    return this.categories$;
  }

  /** GET /api/v1/tournaments/enums/genders/ */
  getGenders(): Observable<EnumChoice[]> {
    return this.genders$;
  }

  /** GET /api/v1/tournaments/enums/leagues/ */
  getLeagues(): Observable<EnumChoice[]> {
    return this.leagues$;
  }

  /** GET /api/v1/tournaments/last-league/ */
  getLastLeague(): Observable<LastLeagueResponse> {
    return this.lastLeague$;
  }
}
