import { BracketMatch } from '../../../../../shared/models/tournament.models';

export interface PairSlot {
  id: string;
  pairId: number | null;
  x: number;
  y: number;
  isWinner: boolean;
  isChampion: boolean;
  isLeaf: boolean;
}

export interface MatchJunction {
  match: BracketMatch;
  x: number;
  y: number;
}

export interface Connector {
  id: string;
  path: string;
  isWinner: boolean;
}

export interface RoundHeader {
  label: string;
  x: number;
}

export interface BracketLayout {
  pairSlots: PairSlot[];
  junctions: MatchJunction[];
  connectors: Connector[];
  roundHeaders: RoundHeader[];
  totalWidth: number;
  totalHeight: number;
}

export const PAIR_W = 140;
export const PAIR_H = 52;
export const CELL_H = 64;
export const COL_GAP = 80;
export const HEADER_HEIGHT = 40;
