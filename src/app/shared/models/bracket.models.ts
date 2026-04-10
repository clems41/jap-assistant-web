import {Pair} from './pair.models';

export type BracketDimension = 4 | 8 | 16 | 32 | 64;

export interface MatchData {
  title: string;
  pair?: Pair;
  score?: string;
  game_format?: string;
}

export interface BracketSlotPayload {
  slot_title: string;
  pair_id: number;
  score?: string;
  game_format?: string;
}

export interface BracketStatePayload {
  dimension: BracketDimension;
  nb_top_seeds: number;
  slots: BracketSlotPayload[];
}

export interface BracketSlotResponse {
  slot_title: string;
  pair: Pair;
  score?: string;
  game_format?: string;
}

export interface BracketStateResponse {
  id: number;
  tournament_id: number;
  dimension: BracketDimension;
  nb_top_seeds: number;
  slots: BracketSlotResponse[];
}
