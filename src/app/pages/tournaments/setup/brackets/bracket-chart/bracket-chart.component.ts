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
  BracketBase,
  BracketMatch,
  SeedingRequest, Tournament, TournamentStatus,
} from '../../../../../shared/models/tournament.models';
import { Pair } from '../../../../../shared/models/pair.models';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TagModule } from 'primeng/tag';
import { CdkDrag, CdkDragDrop, CdkDragEnd, CdkDragStart, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import {
  BracketLayout,
  CELL_H,
  COL_GAP,
  HEADER_HEIGHT,
  MatchJunction,
  PAIR_H,
  PAIR_W,
  PairSlot,
  SlotState,
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
  bracket = input.required<BracketBase>();
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();
  mode = input<'placement' | 'score-only'>('placement');

  scoreChanged = output<{ matchId: number; score: string; winnerId: number }>();
  seedingChanged = output<SeedingRequest>();
  deleteRequested = output<void>();

  private readonly fb = inject(FormBuilder);

  readonly PAIR_W = PAIR_W;
  readonly PAIR_H = PAIR_H;
  readonly HEADER_HEIGHT = HEADER_HEIGHT;
  readonly SlotState = SlotState;

  private pairsMap = computed(() => new Map(this.pairs().map(p => [p.id, p])));

  layout = computed<BracketLayout>(() => this.computeLayout(this.bracket().root_match));

  selectedMatch = signal<BracketMatch | null>(null);

  scoreForm = this.fb.group({
    score: ['', Validators.required],
    winnerId: [null as number | null, Validators.required],
  });

  readonly seedingMap = signal<Map<string, number | null>>(new Map());
  readonly draggedPairId = signal<number | null>(null);

  readonly sortedPairs = computed<Pair[]>(() =>
    [...this.pairs()].sort((a, b) => (a.weight ?? Infinity) - (b.weight ?? Infinity))
  );

  private static readonly SEED_SEVERITIES = ['warn', 'primary', 'secondary', 'info'];
  private static readonly SEED_ROUND_SIZES = [4, 8, 16, 32, 64];

  // Répartit les paires triées par rang dans des paliers ordonnés du tour d'entrée le plus
  // protégé (taille la plus petite avec un effectif > 0) au tour sans bye (taille = dimension,
  // qui récupère toutes les paires restantes).
  private readonly seedTiers = computed<{ roundSize: number; pairIds: number[] }[]>(() => {
    const bracket = this.bracket();
    const sortedPairs = this.sortedPairs();
    const tiers: { roundSize: number; pairIds: number[] }[] = [];

    let pairIndex = 0;
    for (const roundSize of BracketChartComponent.SEED_ROUND_SIZES) {
      if (roundSize > bracket.dimension) break;
      const count = roundSize === bracket.dimension
        ? sortedPairs.length - pairIndex
        : this.getNbPairForRoundSize(bracket, roundSize);
      if (count > 0) {
        tiers.push({ roundSize, pairIds: sortedPairs.slice(pairIndex, pairIndex + count).map(p => p.id) });
        pairIndex += count;
      }
    }
    return tiers;
  });

  // Couleur de badge par paire ; le palier sans bye (taille = dimension) n'a pas de couleur.
  private readonly seedSeverityByPairId = computed<Map<number, string>>(() => {
    const bracket = this.bracket();
    const map = new Map<number, string>();

    let severityIndex = 0;
    for (const tier of this.seedTiers()) {
      if (tier.roundSize === bracket.dimension) continue;
      const severity = BracketChartComponent.SEED_SEVERITIES[severityIndex];
      for (const pairId of tier.pairIds) map.set(pairId, severity);
      severityIndex++;
    }
    return map;
  });

  // Taille de tour à laquelle chaque paire doit entrer dans le tableau (avec ou sans bye).
  private readonly entryRoundSizeByPairId = computed<Map<number, number>>(() => {
    const map = new Map<number, number>();
    for (const tier of this.seedTiers()) {
      for (const pairId of tier.pairIds) map.set(pairId, tier.roundSize);
    }
    return map;
  });

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

  readonly allPairsPlaced = computed(() => this.unplacedPairs().length === 0);

  readonly dropListIds = computed<string[]>(() =>
    this.layout().pairSlots
      .filter(s => !s.isChampion && s.state === SlotState.Interactive)
      .map(s => 'drop-' + s.id)
  );

  readonly lockedSlotIds = computed<Set<string>>(() => {
    const result = new Set<string>();
    this.collectLockedSlots(this.bracket().root_match, result);
    return result;
  });

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

  getSeedBadge(pairId: number): { rank: number; severity: string } | null {
    const idx = this.sortedPairs().findIndex(p => p.id === pairId);
    if (idx < 0) return null;
    const severity = this.seedSeverityByPairId().get(pairId);
    return severity ? { rank: idx + 1, severity } : null;
  }

  readonly slotEnterPredicate = (drag: CdkDrag, list: CdkDropList): boolean => {
    const slot = list.data as PairSlot | undefined;
    if (!slot || slot.isChampion || slot.state !== SlotState.Interactive) return false;
    const current = this.seedingMap().get(slot.id);
    if (current !== null && current !== undefined) return false;

    return this.matchesEntryRoundSize(drag.data as number, slot.roundSize);
  };

  onDragStarted(event: CdkDragStart): void {
    this.draggedPairId.set(event.source.data as number);
  }

  onDragEnded(_event: CdkDragEnd): void {
    this.draggedPairId.set(null);
  }

  getSlotDropState(slot: PairSlot): 'occupied' | 'available' | 'unavailable' {
    if (this.seedingMap().get(slot.id)) return 'occupied';
    const draggedPairId = this.draggedPairId();
    if (draggedPairId === null) return 'available';
    return this.matchesEntryRoundSize(draggedPairId, slot.roundSize) ? 'available' : 'unavailable';
  }

  private matchesEntryRoundSize(pairId: number, roundSize: number): boolean {
    const requiredRoundSize = this.entryRoundSizeByPairId().get(pairId);
    return requiredRoundSize === undefined || requiredRoundSize === roundSize;
  }

  onDropIntoSlot(event: CdkDragDrop<PairSlot>, targetSlot: PairSlot): void {
    const pairId = event.item.data as number;
    const newMap = new Map(this.seedingMap());
    newMap.set(targetSlot.id, pairId);
    this.seedingMap.set(newMap);

    const matchId = Number(targetSlot.id.substring(0, targetSlot.id.lastIndexOf('-')));
    this.emitPlacement(matchId, newMap);
  }

  onRemoveFromSlot(slotId: string): void {
    const newMap = new Map(this.seedingMap());
    newMap.set(slotId, null);
    this.seedingMap.set(newMap);
    const matchId = Number(slotId.substring(0, slotId.lastIndexOf('-')));
    this.emitPlacement(matchId, newMap);
  }

  private emitPlacement(matchId: number, map: Map<string, number | null>): void {
    this.seedingChanged.emit({
      placements: [{
        match_id: matchId,
        pair1_id: map.get(`${matchId}-p1`) ?? null,
        pair2_id: map.get(`${matchId}-p2`) ?? null,
      }],
    });
  }

  onMatchClick(match: BracketMatch): void {
    this.scoreForm.reset({
      score: match.score || '',
      winnerId: match.winner_id || null,
    });
    this.selectedMatch.set(match);
  }

  saveScore(): void {
    if (this.scoreForm.invalid) return;
    const match = this.selectedMatch();
    if (!match) return;
    const { score, winnerId } = this.scoreForm.value;
    this.scoreChanged.emit({ matchId: match.id, score: score!, winnerId: winnerId! });
    this.closeDialog();
  }

  closeDialog(): void {
    this.selectedMatch.set(null);
  }

  private collectLockedSlots(match: BracketMatch | null, result: Set<string>): void {
    if (!match) return;
    if (match.score || match.winner_id) {
      result.add(`${match.id}-p1`);
      result.add(`${match.id}-p2`);
    } else {
      if (match.child1?.winner_id && match.child1.winner_id === match.pair1) {
        result.add(`${match.id}-p1`);
      }
      if (match.child2?.winner_id && match.child2.winner_id === match.pair2) {
        result.add(`${match.id}-p2`);
      }
    }
    this.collectLockedSlots(match.child1 as BracketMatch | null, result);
    this.collectLockedSlots(match.child2 as BracketMatch | null, result);
  }

  private traverseForSeeding(match: BracketMatch | null, map: Map<string, number | null>): void {
    if (!match) return;
    map.set(`${match.id}-p1`, match.pair1 ?? null);
    map.set(`${match.id}-p2`, match.pair2 ?? null);
    this.traverseForSeeding(match.child1 as BracketMatch | null, map);
    this.traverseForSeeding(match.child2 as BracketMatch | null, map);
  }

  private getNbPairForRoundSize(bracket: BracketBase, roundSize: number): number {
    switch (roundSize) {
      case 4: return bracket.nb_pair_round_4 ?? 0;
      case 8: return bracket.nb_pair_round_8 ?? 0;
      case 16: return bracket.nb_pair_round_16 ?? 0;
      case 32: return bracket.nb_pair_round_32 ?? 0;
      case 64: return bracket.nb_pair_round_64 ?? 0;
      default: return 0;
    }
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

    const slotState = (disabled: boolean, canBePlaced: boolean): SlotState =>
      disabled ? SlotState.Bypassed
        : canBePlaced ? SlotState.Interactive
        : SlotState.WaitingForWinner;

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

      const yOffset = HEADER_HEIGHT;
      const roundSize = 2 ** (d + 1);
      pairSlots.push({ id: `${match.id}-p1`, pairId: match.pair1 ?? null, x: pairX, y: pair1Y + yOffset, isWinner: pair1Wins, isChampion: false, state: slotState(match.disabled, match.pair1_can_be_placed), roundSize });
      pairSlots.push({ id: `${match.id}-p2`, pairId: match.pair2 ?? null, x: pairX, y: pair2Y + yOffset, isWinner: pair2Wins, isChampion: false, state: slotState(match.disabled, match.pair2_can_be_placed), roundSize });
      junctions.push({ match, x: junctionX, y: junctionY + yOffset });

      connectors.push({ id: `${match.id}-cp1`, path: `M ${pairRightX} ${pair1Y + yOffset} H ${junctionX} V ${junctionY + yOffset}`, isWinner: pair1Wins });
      connectors.push({ id: `${match.id}-cp2`, path: `M ${pairRightX} ${pair2Y + yOffset} H ${junctionX} V ${junctionY + yOffset}`, isWinner: pair2Wins });
      if (match.child1) {
        connectors.push({ id: `${match.id}-cj1`, path: `M ${junX(d + 1)} ${pair1Y + yOffset} H ${pairX}`, isWinner: pair1Wins });
      }
      if (match.child2) {
        connectors.push({ id: `${match.id}-cj2`, path: `M ${junX(d + 1)} ${pair2Y + yOffset} H ${pairX}`, isWinner: pair2Wins });
      }

      return junctionY;
    };

    const rootJunctionY = layout(root, 0, 0, bracketHeight);

    const championX = (D + 1) * (PAIR_W + COL_GAP);
    // state non lu pour le slot champion (branche template séparée gérée via isChampion)
    pairSlots.push({ id: `champion-${root.id}`, pairId: root.winner_id ?? null, x: championX, y: rootJunctionY + HEADER_HEIGHT, isWinner: false, isChampion: true, state: SlotState.Interactive, roundSize: 0 });
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

  protected readonly TournamentStatus = TournamentStatus;
}
