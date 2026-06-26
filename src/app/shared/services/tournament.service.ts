import { Injectable, inject } from '@angular/core';
import { Observable, defer, shareReplay } from 'rxjs';
import { HttpRequesterService } from './http-requester.service';
import {
  Bracket,
  BracketMatch,
  DurationByGameFormat, GenerateBracketRequest,
  Match, MatchStatus,
  PaginatedTournamentRequest, ReorderMatchesRequest, ScoreRequest, SeedingRequest, TimeSlot, TimeSlotRequest,
  Tournament, TournamentInformationsResponse,
  TournamentRequest,
} from '../models/tournament.models';
import {EnumChoice, PaginatedResponse} from '../models/base.models';

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private http = inject(HttpRequesterService);

  private categories$ = defer(() => this.http.get<EnumChoice[]>('/tournaments/enums/categories')).pipe(shareReplay(1));
  private genders$ = defer(() => this.http.get<EnumChoice[]>('/tournaments/enums/genders')).pipe(shareReplay(1));
  private leagues$ = defer(() => this.http.get<EnumChoice[]>('/tournaments/enums/leagues')).pipe(shareReplay(1));
  private configurations$ = defer(() => this.http.get<EnumChoice[]>('/tournaments/enums/configurations')).pipe(shareReplay(1));
  private gameFormats$ = defer(() => this.http.get<EnumChoice[]>('/tournaments/enums/game-formats')).pipe(shareReplay(1));
  private gameFormatDurations$ = defer(() => this.http.get<DurationByGameFormat[]>('/tournaments/enums/game-format-durations')).pipe(shareReplay(1));
  private informations = defer(() => this.http.get<TournamentInformationsResponse>('/tournaments/informations')).pipe(shareReplay(1));

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

  /** DELETE /api/v1/tournaments/{id}/bracket/ */
  deleteTournamentBracket(id: number): Observable<void> {
    return this.http.delete<void>(`/tournaments/${id}/bracket`, { succes_message: 'Tableau supprimé' });
  }

  /** POST /api/v1/tournaments/{id}/bracket/draw/ */
  drawBracket(tournamentId: number): Observable<Bracket> {
    return this.http.post<Bracket>(
      `/tournaments/${tournamentId}/bracket/draw`,
      null,
      { succes_message: 'Paires placées automatiquement' }
    );
  }

  /** PATCH /api/v1/tournaments/{id}/bracket/placement/ */
  updateBracketPlacement(tournamentId: number, request: SeedingRequest): Observable<Bracket> {
    return this.http.patch<Bracket>(
      `/tournaments/${tournamentId}/bracket/placement`,
      request,
    );
  }

  /** PATCH /api/v1/tournaments/{id}/matches/order/ */
  updateMatchesOrder(tournamentId: number, request: ReorderMatchesRequest): Observable<Match[]> {
    return this.http.patch<Match[]>(`/tournaments/${tournamentId}/matches/order`, request);
  }

  /** PATCH /api/v1/tournaments/{id}/matches/{matchId}/score/ */
  updateMatchScore(tournamentId: number, matchId: number, request: ScoreRequest): Observable<BracketMatch> {
    return this.http.patch<BracketMatch>(
      `/tournaments/${tournamentId}/matches/${matchId}/score`,
      request,
      { succes_message: 'Score enregistré' }
    );
  }

  /** DELETE /api/v1/tournaments/{id}/matches/{matchId}/score/ */
  deleteMatchScore(tournamentId: number, matchId: number): Observable<void> {
    return this.http.delete<void>(
      `/tournaments/${tournamentId}/matches/${matchId}/score`,
      { succes_message: 'Score supprimé' }
    );
  }

  /** POST /api/v1/tournaments/{id}/matches/{matchId}/start/ */
  startMatch(tournamentId: number, matchId: number): Observable<BracketMatch> {
    return this.http.post<BracketMatch>(
      `/tournaments/${tournamentId}/matches/${matchId}/start`,
      null,
      { succes_message: 'Match démarré' }
    );
  }

  /** GET /api/v1/tournaments/{id}/matches/ */
  getMatches(tournamentId: number, statuses?: MatchStatus[]): Observable<Match[]> {
    return this.http.get<Match[]>(
      `/tournaments/${tournamentId}/matches`,
      statuses?.length ? { status: statuses } : undefined,
    );
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

  /** GET /api/v1/tournaments/informations/ */
  getInformations(): Observable<TournamentInformationsResponse> {
    return this.informations;
  }
}
