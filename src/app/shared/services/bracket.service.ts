import {Injectable} from '@angular/core';
import {TreeNode} from 'primeng/api';
import {BracketDimension, MatchData} from '../models/bracket.models';
import {Pair} from '../models/pair.models';

interface RoundConfig {
  label: string;
  minDimension: number;
  count: number;
}

@Injectable({providedIn: 'root'})
export class BracketService {
  private readonly rounds: RoundConfig[] = [
    {label: 'R64', minDimension: 33, count: 64},
    {label: 'R32', minDimension: 17, count: 32},
    {label: 'R16', minDimension: 9, count: 16},
    {label: 'R8', minDimension: 5, count: 8},
    {label: 'R4', minDimension: 3, count: 4},
    {label: 'R2', minDimension: 2, count: 2},
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
        type: 'pair',
        data: {
          title: 'Gagnant',
          pair: {} as Pair,
          disabled: false,
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
      type: 'pair' as const,
      data: {title: `${label} #${i + 1}`, pair: {} as Pair, disabled: false},
      children:
        previousRound.length > 0
          ? [previousRound[i * 2], previousRound[i * 2 + 1]]
          : [],
    }));
  }
}
