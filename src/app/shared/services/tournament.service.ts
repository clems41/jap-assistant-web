import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { HttpRequesterService } from './http-requester.service';
import {
  Bracket,
  DurationByGameFormat, GenerateBracketRequest,
  LastLeagueResponse,
  PaginatedTournamentRequest, TimeSlot, TimeSlotRequest,
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
  private configurations$ = this.http.get<EnumChoice[]>('/tournaments/enums/configurations').pipe(shareReplay(1));
  private gameFormats$ = this.http.get<EnumChoice[]>('/tournaments/enums/game-formats').pipe(shareReplay(1));
  private gameFormatDurations$ = this.http.get<DurationByGameFormat[]>('/tournaments/enums/game-format-durations').pipe(shareReplay(1));
  private lastLeague$ = this.http.get<LastLeagueResponse>('/tournaments/last-league').pipe(shareReplay(1));

  /** GET /api/v1/tournaments/ */
  getTournaments(filters?: PaginatedTournamentRequest): Observable<PaginatedResponse<Tournament>> {
    return this.http.get<PaginatedResponse<Tournament>>('/tournaments', filters);
  }

  /** POST /api/v1/tournaments/ */
  createTournament(input: TournamentRequest): Observable<Tournament> {
    return this.http.post<Tournament>('/tournaments', input);
  }
  /** GET /api/v1/tournaments/{id}/brackets/ */
  getTournamentBracket(id: number): Observable<Bracket> {
    return this.http.get<Bracket>(`/tournaments/${id}/bracket`, undefined, {show_error: false});
  }

  /** POST /api/v1/tournaments/{id}/brackets/ */
  generateTournamentBracket(id: number, input: GenerateBracketRequest): Observable<Bracket> {
    return this.http.post<Bracket>(`/tournaments/${id}/bracket`, input);
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

  /** GET /api/v1/tournaments/{id}/time-slots */
  getTimeSlots(tournament_id: number): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>(`/tournaments/${tournament_id}/time-slots`);
  }

  /** POST /api/v1/tournaments/{id}/time-slots */
  addTimeSlot(tournament_id: number, input: TimeSlotRequest): Observable<TimeSlot> {
    return this.http.post<TimeSlot>(`/tournaments/${tournament_id}/time-slots`, input);
  }

  /** PUT /api/v1/tournaments/{id}/time-slots/{id} */
  updateTimeSlot(tournament_id: number, id: number, input: TimeSlotRequest): Observable<TimeSlot> {
    return this.http.put<TimeSlot>(`/tournaments/${tournament_id}/time-slots/${id}`, input);
  }

  /** DELETE /api/v1/tournaments/{id}/time-slots */
  deleteTimeSlot(tournament_id: number, id: number): Observable<void> {
    return this.http.delete<void>(`/tournaments/${tournament_id}/time-slots/${id}`);
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

  /** GET /api/v1/tournaments/enums/configurations/ */
  getConfigurations(): Observable<EnumChoice[]> {
    return this.configurations$;
  }

  /** GET /api/v1/tournaments/enums/game-formats/ */
  getGameFormats(): Observable<EnumChoice[]> {
    return this.gameFormats$;
  }

  /** GET /api/v1/tournaments/enums/game-format-durations/ */
  getGameFormatDurations(): Observable<DurationByGameFormat[]> {
    return this.gameFormatDurations$;
  }

  /** GET /api/v1/tournaments/last-league/ */
  getLastLeague(): Observable<LastLeagueResponse> {
    return this.lastLeague$;
  }
}
