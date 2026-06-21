import {Pair} from '../models/pair.models';

export function formatPairName(pair: Pair | undefined, pairId: number | null): string {
  if (!pairId) return 'Paire à déterminer';
  return pair ? `${pair.player1.last_name} / ${pair.player2.last_name}` : `Paire ${pairId}`;
}
