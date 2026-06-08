import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Bracket,
  BracketMatch,
  SeedingMatchPlacement,
  SeedingRequest,
} from '../../../../../shared/models/tournament.models';
import { Pair } from '../../../../../shared/models/pair.models';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TagModule } from 'primeng/tag';
import { CdkDrag, CdkDragDrop, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import {
  BracketLayout,
  CELL_H,
  COL_GAP,
  HEADER_HEIGHT,
  MatchJunction,
  PAIR_H,
  PAIR_W,
  PairSlot,
} from './bracket-chart.models';

@Component({
  selector: 'app-bracket-chart',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    RadioButtonModule,
    TagModule,
    DragDropModule,
  ],
  templateUrl: './bracket-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BracketChartComponent {
  bracket = input.required<Bracket>();
  pairs = input.required<Pair[]>();

  scoreChanged = output<{ matchId: number; score: string; winnerId: number }>();
  seedingChanged = output<SeedingRequest>();

  private readonly fb = inject(FormBuilder);

  readonly PAIR_W = PAIR_W;
  readonly PAIR_H = PAIR_H;
  readonly HEADER_HEIGHT = HEADER_HEIGHT;

  private pairsMap = computed(() => new Map(this.pairs().map(p => [p.id, p])));

  layout = computed<BracketLayout>(() => this.computeLayout(this.bracket().root_match));

  selectedJunction = signal<MatchJunction | null>(null);

  scoreForm = this.fb.group({
    score: ['', Validators.required],
    winnerId: [null as number | null, Validators.required],
  });

  readonly seedingMap = signal<Map<string, number | null>>(new Map());

  readonly sortedPairs = computed<Pair[]>(() =>
    [...this.pairs()].sort((a, b) => (a.weight ?? Infinity) - (b.weight ?? Infinity))
  );

  private readonly placedPairIds = computed<Set<number>>(() => {
    const s = new Set<number>();
    for (const v of this.seedingMap().values()) {
      if (v !== null) s.add(v);
    }
    return s;
  });

  readonly unplacedPairs = computed<Pair[]>(() =>
    this.sortedPairs().filter(p => !this.placedPairIds().has(p.id))
  );

  readonly dropListIds = computed<string[]>(() =>
    this.layout().pairSlots.filter(s => !s.isChampion).map(s => 'drop-' + s.id)
  );

  constructor() {
    effect(() => {
      const bracket = this.bracket();
      untracked(() => {
        const map = new Map<string, number | null>();
        this.traverseForSeeding(bracket.root_match, map);
        this.seedingMap.set(map);
      });
    });
  }

  getPairName(pairId: number | null): string {
    if (!pairId) return '';
    const pair = this.pairsMap().get(pairId);
    if (!pair) return `Paire ${pairId}`;
    return `${pair.player1.last_name} / ${pair.player2.last_name}`;
  }

  getPairPlayerNames(pairId: number | null): [string, string] {
    if (!pairId) return ['', ''];
    const pair = this.pairsMap().get(pairId);
    if (!pair) return [`Paire ${pairId}`, ''];
    return [pair.player1.last_name, pair.player2.last_name];
  }

  getSeedRank(pairId: number): number | null {
    const idx = this.sortedPairs().findIndex(p => p.id === pairId);
    return idx >= 0 && idx < this.bracket().nb_top_seeds ? idx + 1 : null;
  }

  readonly slotEnterPredicate = (_drag: CdkDrag, list: CdkDropList): boolean => {
    const slot = list.data as PairSlot | undefined;
    if (!slot || slot.isChampion) return false;
    const current = this.seedingMap().get(slot.id);
    return current === null || current === undefined;
  };

  onDropIntoSlot(event: CdkDragDrop<PairSlot>, targetSlot: PairSlot): void {
    const pairId = event.item.data as number;
    const newMap = new Map(this.seedingMap());
    newMap.set(targetSlot.id, pairId);
    this.seedingMap.set(newMap);
  }

  onRemoveFromSlot(slotId: string): void {
    const newMap = new Map(this.seedingMap());
    newMap.set(slotId, null);
    this.seedingMap.set(newMap);
  }

  saveSeedingPlacement(): void {
    const matchMap = new Map<number, SeedingMatchPlacement>();
    for (const [slotId, pairId] of this.seedingMap()) {
      const dashIdx = slotId.lastIndexOf('-');
      const matchId = Number(slotId.substring(0, dashIdx));
      const posRaw = slotId.substring(dashIdx + 1);
      if (posRaw !== 'p1' && posRaw !== 'p2') continue;
      if (!matchMap.has(matchId)) {
        matchMap.set(matchId, { match_id: matchId, pair1_id: null, pair2_id: null });
      }
      const entry = matchMap.get(matchId)!;
      if (posRaw === 'p1') entry.pair1_id = pairId;
      else entry.pair2_id = pairId;
    }
    this.seedingChanged.emit({ placements: Array.from(matchMap.values()) });
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

  private traverseForSeeding(match: BracketMatch | null, map: Map<string, number | null>): void {
    if (!match) return;
    map.set(`${match.id}-p1`, match.pair1 ?? null);
    map.set(`${match.id}-p2`, match.pair2 ?? null);
    this.traverseForSeeding(match.child1 as BracketMatch | null, map);
    this.traverseForSeeding(match.child2 as BracketMatch | null, map);
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
    const connectors: BracketLayout['connectors'] = [];
    const roundDisplayByDepth = new Map<number, string>();

    const D = this.getDepth(root) - 1;
    const numLeaves = this.countLeaves(root);
    const bracketHeight = numLeaves * 2 * CELL_H;

    const colX = (d: number) => (D - d) * (PAIR_W + COL_GAP);
    const junX = (d: number) => colX(d) + PAIR_W + COL_GAP / 2;

    const layout = (match: BracketMatch, d: number, topY: number, allocH: number): number => {
      const pairX = colX(d);
      const pairRightX = pairX + PAIR_W;
      const junctionX = junX(d);

      roundDisplayByDepth.set(d, match.round_display);

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
      const isLeaf = !match.child1 && !match.child2;

      const yOffset = HEADER_HEIGHT;
      pairSlots.push({ id: `${match.id}-p1`, pairId: match.pair1 ?? null, x: pairX, y: pair1Y + yOffset, isWinner: pair1Wins, isChampion: false, isLeaf });
      pairSlots.push({ id: `${match.id}-p2`, pairId: match.pair2 ?? null, x: pairX, y: pair2Y + yOffset, isWinner: pair2Wins, isChampion: false, isLeaf });
      junctions.push({ match, x: junctionX, y: junctionY + yOffset });

      connectors.push({ id: `${match.id}-cp1`, path: `M ${pairRightX} ${pair1Y + yOffset} H ${junctionX} V ${junctionY + yOffset}`, isWinner: pair1Wins });
      connectors.push({ id: `${match.id}-cp2`, path: `M ${pairRightX} ${pair2Y + yOffset} H ${junctionX} V ${junctionY + yOffset}`, isWinner: pair2Wins });

      return junctionY;
    };

    const rootJunctionY = layout(root, 0, 0, bracketHeight);

    const championX = (D + 1) * (PAIR_W + COL_GAP);
    pairSlots.push({ id: `champion-${root.id}`, pairId: root.winner_id ?? null, x: championX, y: rootJunctionY + HEADER_HEIGHT, isWinner: false, isChampion: true, isLeaf: false });
    connectors.push({ id: `${root.id}-cc`, path: `M ${junX(0)} ${rootJunctionY + HEADER_HEIGHT} H ${championX}`, isWinner: !!root.winner_id });

    const roundHeaders: BracketLayout['roundHeaders'] = [];
    for (const [d, label] of roundDisplayByDepth) {
      roundHeaders.push({ label, x: colX(d) + PAIR_W / 2 });
    }
    roundHeaders.sort((a, b) => a.x - b.x);
    roundHeaders.push({ label: 'Gagnant', x: championX + PAIR_W / 2 });

    return {
      pairSlots,
      junctions,
      connectors,
      roundHeaders,
      totalWidth: championX + PAIR_W + 20,
      totalHeight: bracketHeight + HEADER_HEIGHT,
    };
  }
}
