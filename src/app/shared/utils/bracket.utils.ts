import { BracketMatch } from '../models/tournament.models';

export function collectPlacedPairIds(match: BracketMatch | null, result: Set<number> = new Set()): Set<number> {
  if (!match) return result;
  if (match.pair1 != null) result.add(match.pair1);
  if (match.pair2 != null) result.add(match.pair2);
  collectPlacedPairIds(match.child1 as BracketMatch | null, result);
  collectPlacedPairIds(match.child2 as BracketMatch | null, result);
  return result;
}
