import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Bracket, BracketMatch} from '../../../../../shared/models/tournament.models';
import {Pair} from '../../../../../shared/models/pair.models';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {InputTextModule} from 'primeng/inputtext';
import {RadioButtonModule} from 'primeng/radiobutton';

interface PairSlot {
  id: string;
  pairId: number | null;
  x: number;
  y: number;
  isWinner: boolean;
  isChampion: boolean;
}

interface MatchJunction {
  match: BracketMatch;
  x: number;
  y: number;
}

interface Connector {
  id: string;
  path: string;
  isWinner: boolean;
}

interface BracketLayout {
  pairSlots: PairSlot[];
  junctions: MatchJunction[];
  connectors: Connector[];
  totalWidth: number;
  totalHeight: number;
}

const PAIR_W = 140;
const PAIR_H = 52;
const CELL_H = 64;
const COL_GAP = 80;

@Component({
  selector: 'app-bracket-chart',
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, RadioButtonModule],
  templateUrl: './bracket-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BracketChartComponent {
  bracket = input.required<Bracket>();
  pairs = input.required<Pair[]>();

  scoreChanged = output<{ matchId: number; score: string; winnerId: number }>();

  private readonly fb = inject(FormBuilder);

  readonly PAIR_W = PAIR_W;
  readonly PAIR_H = PAIR_H;

  private pairsMap = computed(() => new Map(this.pairs().map(p => [p.id, p])));

  layout = computed<BracketLayout>(() => this.computeLayout(this.bracket().root_match));

  selectedJunction = signal<MatchJunction | null>(null);

  scoreForm = this.fb.group({
    score: ['', Validators.required],
    winnerId: [null as number | null, Validators.required],
  });

  getPairName(pairId: number | null): string {
    if (!pairId) return '';
    const pair = this.pairsMap().get(pairId);
    if (!pair) return `Paire ${pairId}`;
    return `${pair.player1.last_name} / ${pair.player2.last_name}`;
  }

  onJunctionClick(junction: MatchJunction): void {
    const match = junction.match;
    if (!match.pair1 && !match.pair2) return;
    this.scoreForm.reset({
      score: match.score || '',
      winnerId: match.winner_id || null,
    });
    this.selectedJunction.set(junction);
  }

  saveScore(): void {
    if (this.scoreForm.invalid) return;
    const junction = this.selectedJunction();
    if (!junction) return;
    const { score, winnerId } = this.scoreForm.value;
    this.scoreChanged.emit({ matchId: junction.match.id, score: score!, winnerId: winnerId! });
    this.closeDialog();
  }

  closeDialog(): void {
    this.selectedJunction.set(null);
    this.scoreForm.reset();
  }

  private getDepth(match: BracketMatch | null): number {
    if (!match) return 0;
    return 1 + Math.max(this.getDepth(match.child1), this.getDepth(match.child2));
  }

  private countLeaves(match: BracketMatch | null): number {
    if (!match) return 0;
    if (!match.child1 && !match.child2) return 1;
    return this.countLeaves(match.child1) + this.countLeaves(match.child2);
  }

  private computeLayout(root: BracketMatch): BracketLayout {
    const pairSlots: PairSlot[] = [];
    const junctions: MatchJunction[] = [];
    const connectors: Connector[] = [];

    const D = this.getDepth(root) - 1;
    const numLeaves = this.countLeaves(root);
    const totalHeight = numLeaves * 2 * CELL_H;

    const colX = (d: number) => (D - d) * (PAIR_W + COL_GAP);
    const junX = (d: number) => colX(d) + PAIR_W + COL_GAP / 2;

    const layout = (match: BracketMatch, d: number, topY: number, allocH: number): number => {
      const pairX = colX(d);
      const pairRightX = pairX + PAIR_W;
      const junctionX = junX(d);

      let pair1Y: number;
      let pair2Y: number;

      if (!match.child1 && !match.child2) {
        pair1Y = topY + allocH / 4;
        pair2Y = topY + 3 * allocH / 4;
      } else {
        pair1Y = layout(match.child1, d + 1, topY, allocH / 2);
        pair2Y = layout(match.child2, d + 1, topY + allocH / 2, allocH / 2);
      }

      const junctionY = (pair1Y + pair2Y) / 2;
      const pair1Wins = !!match.winner_id && match.winner_id === match.pair1;
      const pair2Wins = !!match.winner_id && match.winner_id === match.pair2;

      pairSlots.push({ id: `${match.id}-p1`, pairId: match.pair1 ?? null, x: pairX, y: pair1Y, isWinner: pair1Wins, isChampion: false });
      pairSlots.push({ id: `${match.id}-p2`, pairId: match.pair2 ?? null, x: pairX, y: pair2Y, isWinner: pair2Wins, isChampion: false });
      junctions.push({ match, x: junctionX, y: junctionY });

      connectors.push({ id: `${match.id}-cp1`, path: `M ${pairRightX} ${pair1Y} H ${junctionX} V ${junctionY}`, isWinner: pair1Wins });
      connectors.push({ id: `${match.id}-cp2`, path: `M ${pairRightX} ${pair2Y} H ${junctionX} V ${junctionY}`, isWinner: pair2Wins });

      return junctionY;
    };

    const rootJunctionY = layout(root, 0, 0, totalHeight);

    const championX = (D + 1) * (PAIR_W + COL_GAP);
    pairSlots.push({ id: `champion-${root.id}`, pairId: root.winner_id ?? null, x: championX, y: rootJunctionY, isWinner: false, isChampion: true });
    connectors.push({ id: `${root.id}-cc`, path: `M ${junX(0)} ${rootJunctionY} H ${championX}`, isWinner: !!root.winner_id });

    return {
      pairSlots,
      junctions,
      connectors,
      totalWidth: championX + PAIR_W + 20,
      totalHeight,
    };
  }
}
