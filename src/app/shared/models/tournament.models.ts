import {PaginatedRequest} from './base.models';

export interface Tournament {
  id: number;
  owner: number;
  name: string;
  category: string;
  start_date: string;
  location: string;
  league: string;
  gender: string;
  created_at: string;
  updated_at: string;
}

export interface TournamentRequest {
  name: string;
  category: string;
  start_date: string;
  location: string;
  league: string;
  gender: string;
}

export interface LastLeagueResponse {
  league: string;
}

export interface PaginatedTournamentRequest extends PaginatedRequest {
  category?: string;
  start_date?: string;
  end_date?: string;
  gender?: string;
}
