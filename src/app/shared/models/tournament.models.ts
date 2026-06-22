import {PaginatedRequest} from './base.models';

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  SET = 'SET',
  READY = 'READY',
  STARTED = 'STARTED',
  FINISHED = 'FINISHED'
}

export enum MatchStatus {
  UPCOMING = 'UPCOMING',
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
  pairs_count: number;
  created_at: string;
  updated_at: string;
}

export interface BracketBase {
  id: number;
  dimension: number;
  nb_pair_round_64?: number;
  nb_pair_round_32?: number;
  nb_pair_round_16?: number;
  nb_pair_round_8?: number;
  nb_pair_round_4?: number;
  root_match: BracketMatch;
}

export interface Bracket extends BracketBase {
  nb_pair_round_64: number;
  nb_pair_round_32: number;
  nb_pair_round_16: number;
  nb_pair_round_8: number;
  nb_pair_round_4: number;
  classification_brackets: ClassificationBracket[];
}

export interface ClassificationBracket extends BracketBase {
  source_round: string;
  source_round_display: string;
  start_place: number;
  end_place: number;
  children: ClassificationBracket[];
}

export interface BracketMatch {
  id: number;
  round: string;
  round_display: string;
  match_number: number;
  pair1: number;
  pair2: number;
  game_format: string;
  score: string;
  winner_id: number;
  child1: BracketMatch;
  child2: BracketMatch;
  disabled: boolean;
  pair1_can_be_placed: boolean;
  pair2_can_be_placed: boolean;
  status: MatchStatus;
  finished_at: string;
}

export interface Match {
  id: number;
  round: string;
  round_display: string;
  match_number: number;
  order: number;
  pair1: number | null;
  pair2: number | null;
  game_format: string;
  score: string;
  winner_id: number;
  status: MatchStatus;
  finished_at: string;
  started_at: string | null;
  estimated_start_at: string | null;
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

export interface GenerateBracketRequest {
  dimension: number;
  nb_pair_round_64: number;
  nb_pair_round_32: number;
  nb_pair_round_16: number;
  nb_pair_round_8: number;
  nb_pair_round_4: number;
}

export interface ScoreRequest {
  score: string;
  winner_id: number;
}

export interface SeedingMatchPlacement {
  match_id: number;
  pair1_id: number | null;
  pair2_id: number | null;
}

export interface SeedingRequest {
  placements: SeedingMatchPlacement[];
}

export interface ReorderMatchesRequest {
  match_ids: number[];
}

export interface TournamentInformationsResponse {
  last_league: string;
  last_location: string;
  all_locations: string[];
}

export interface PaginatedTournamentRequest extends PaginatedRequest {
  category?: string;
  start_date?: string;
  end_date?: string;
  gender?: string;
}
