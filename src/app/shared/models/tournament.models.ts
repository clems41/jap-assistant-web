import {PaginatedRequest} from './base.models';

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  SET = 'SET',
  READY = 'READY',
  STARTED = 'STARTED',
  FINISHED = 'FINISHED'
}

export interface Tournament {
  id: number;
  owner: number;
  name: string;
  category: string;
  start_date: string;
  location: string;
  league: string;
  gender: string;
  status: TournamentStatus;
  game_format: string;
  configuration: string;
  estimated_match_duration: number;
  created_at: string;
  updated_at: string;
}

export interface DurationByGameFormat {
  format: string;
  duration: number;
}

export interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  courts_available: number;
}

export interface TimeSlotRequest {
  start_time: string;
  end_time: string;
  courts_available: number;
}

export interface TournamentRequest {
  name: string;
  category: string;
  start_date: string;
  location: string;
  league: string;
  gender: string;
  game_format?: string;
  configuration?: string;
  estimated_match_duration?: number;
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
