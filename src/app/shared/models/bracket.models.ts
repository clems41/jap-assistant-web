import {Pair} from './pair.models';

export type BracketDimension = 4 | 8 | 16 | 32 | 64;

export interface MatchData {
  title: string;
  pair1: Pair;
  pair2: Pair;
}
