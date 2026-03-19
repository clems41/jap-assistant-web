import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpRequesterService } from './http-requester.service';
import { Pair, PairRequest } from '../models/pair.models';

@Injectable({ providedIn: 'root' })
export class PairService {
  private http = inject(HttpRequesterService);

  /** GET /api/v1/tournaments/{tournamentId}/pairs/ */
  getPairs(tournamentId: number): Observable<Pair[]> {
    return this.http.get<Pair[]>(`/tournaments/${tournamentId}/pairs`);
  }

  /** POST /api/v1/tournaments/{tournamentId}/pairs/ */
  createPair(tournamentId: number, input: PairRequest): Observable<Pair> {
    return this.http.post<Pair>(`/tournaments/${tournamentId}/pairs`, input);
  }

  /** GET /api/v1/tournaments/{tournamentId}/pairs/{id}/ */
  getPair(tournamentId: number, id: number): Observable<Pair> {
    return this.http.get<Pair>(`/tournaments/${tournamentId}/pairs/${id}`);
  }

  /** PUT /api/v1/tournaments/{tournamentId}/pairs/{id}/ */
  updatePair(tournamentId: number, id: number, input: PairRequest): Observable<Pair> {
    return this.http.put<Pair>(`/tournaments/${tournamentId}/pairs/${id}`, input);
  }

  /** DELETE /api/v1/tournaments/{tournamentId}/pairs/{id}/ */
  deletePair(tournamentId: number, id: number): Observable<void> {
    return this.http.delete<void>(`/tournaments/${tournamentId}/pairs/${id}`);
  }

  /** POST /api/v1/tournaments/{tournamentId}/pairs/import/ */
  importPairs(tournamentId: number, file: File): Observable<Pair[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Pair[]>(`/tournaments/${tournamentId}/pairs/import`, formData);
  }
}
