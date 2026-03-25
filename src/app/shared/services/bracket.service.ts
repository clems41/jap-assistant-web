import {Injectable} from '@angular/core';
import {TreeNode} from 'primeng/api';
import {BracketDimension, MatchData} from '../models/bracket.models';
import {Pair} from '../models/pair.models';

interface RoundConfig {
  label: string;
  count: number;
  minDimension: BracketDimension;
}

@Injectable({providedIn: 'root'})
export class BracketService {
  private readonly rounds: RoundConfig[] = [
    {label: '1/16ème', count: 16, minDimension: 32},
    {label: '1/8ème', count: 8, minDimension: 16},
    {label: 'Quart', count: 4, minDimension: 8},
    {label: 'Demie', count: 2, minDimension: 4},
  ];

  getAvailableNumberOfTopSeedsFromNumberOfPairs(nbPairs: number): number[] {
    const min: number = Math.round(nbPairs / 8);
    const max: number = Math.round(nbPairs / 2);
    return Array.from({length: max - min + 1}, (_, i) => min + i);
  }

  getBracketDimensionFromNumberOfPairs(nbPairs: number): BracketDimension {
    const dimensions: BracketDimension[] = [4, 8, 16, 32, 64];
    return dimensions.find(d => d >= nbPairs) ?? 64;
  }

  buildBracketData(bracketDimension: BracketDimension): TreeNode<MatchData>[] {
    let previousRound: TreeNode<MatchData>[] = [];

    for (const round of this.rounds) {
      if (bracketDimension < round.minDimension) {
        continue;
      }
      previousRound = this.buildRound(round.label, round.count, previousRound);
    }

    return [
      {
        expanded: true,
        type: 'match',
        data: {
          title: 'Finale',
          pair1: {} as Pair,
          pair2: {} as Pair
        },
        children: previousRound,
      },
    ];
  }

  private buildRound(
    label: string,
    count: number,
    previousRound: TreeNode<MatchData>[],
  ): TreeNode<MatchData>[] {
    return Array.from({length: count}, (_, i) => ({
      expanded: true,
      type: 'match' as const,
      data: {title: `${label} #${i + 1}`, pair1: {} as Pair, pair2: {} as Pair},
      children:
        previousRound.length > 0
          ? [previousRound[i * 2], previousRound[i * 2 + 1]]
          : [],
    }));
  }
}
