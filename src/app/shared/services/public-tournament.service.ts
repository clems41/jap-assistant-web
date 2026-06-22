import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpRequesterService } from './http-requester.service';
import { MatchStatus } from '../models/tournament.models';
import {
  PublicBracketResponse,
  PublicMatch,
  PublicTournament,
} from '../models/public-tournament.models';

@Injectable({ providedIn: 'root' })
export class PublicTournamentService {
  private http = inject(HttpRequesterService);

  /** GET /api/v1/public/tournaments/{code}/ */
  getPublicTournament(code: string): Observable<PublicTournament> {
    return this.http.get<PublicTournament>(`/public/tournaments/${code}`, undefined, { show_error: false });
  }

  /** GET /api/v1/public/tournaments/{code}/matches/ */
  getPublicMatches(code: string, statuses?: MatchStatus[]): Observable<PublicMatch[]> {
    return this.http.get<PublicMatch[]>(
      `/public/tournaments/${code}/matches`,
      statuses?.length ? { status: statuses } : undefined,
      { show_error: false },
    );
  }

  /** GET /api/v1/public/tournaments/{code}/bracket/ */
  getPublicBracket(code: string): Observable<PublicBracketResponse> {
    return this.http.get<PublicBracketResponse>(`/public/tournaments/${code}/bracket`, undefined, { show_error: false });
  }
}
