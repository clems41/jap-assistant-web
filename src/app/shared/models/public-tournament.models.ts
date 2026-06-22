import { MatchStatus, TournamentStatus } from './tournament.models';

export interface PublicTournament {
  public_code: string;
  name: string;
  category: string;
  start_date: string;
  location: string;
  league: string;
  gender: string;
  game_format: string;
  configuration: string;
  estimated_match_duration: number;
  status: TournamentStatus;
  pairs_count: number;
}

export interface PublicPlayer {
  first_name: string;
  last_name: string;
  ranking: number | null;
  club: string;
}

export interface PublicPair {
  player1: PublicPlayer;
  player2: PublicPlayer;
  weight: number | null;
}

// GET /public/tournaments/<code>/matches/ — liste plate, pas d'id, triée par "order" côté backend
export interface PublicMatch {
  round: string;
  round_display: string;
  match_number: number;
  order: number;
  pair1: PublicPair | null;
  pair2: PublicPair | null;
  winner: PublicPair | null;
  game_format: string;
  score: string;
  status: MatchStatus;
  status_display: string;
  started_at: string | null;
  finished_at: string | null;
  estimated_start_at: string | null;
}

// Utilisé récursivement (child1/child2) dans GET /public/tournaments/<code>/bracket/ — pas d'id, pas d'order, "disabled" au lieu de "estimated_start_at"
export interface PublicBracketMatch {
  round: string;
  round_display: string;
  match_number: number;
  pair1: PublicPair | null;
  pair2: PublicPair | null;
  winner: PublicPair | null;
  game_format: string;
  score: string;
  status: MatchStatus;
  status_display: string;
  started_at: string | null;
  finished_at: string | null;
  disabled: boolean;
  child1: PublicBracketMatch | null;
  child2: PublicBracketMatch | null;
}

export interface PublicClassificationBracket {
  source_round_display: string;
  start_place: number;
  end_place: number;
  root_match: PublicBracketMatch;
  children: PublicClassificationBracket[];
}

export interface PublicBracketResponse {
  root_match: PublicBracketMatch;
  classification_brackets: PublicClassificationBracket[];
}
