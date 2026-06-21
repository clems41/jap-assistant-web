import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
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
import { PrintService } from '../../../../../shared/services/print.service';
import {
  BracketLayout,
  buildPrintSections,
  computeLayout,
  HEADER_HEIGHT,
  PAIR_H,
  PAIR_W,
  PairSlot,
  PRINT_PAGE_WIDTH,
  PrintSection,
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
    NgTemplateOutlet,
  ],
  templateUrl: './bracket-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BracketChartComponent {
  bracket = input.required<BracketBase>();
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();
  mode = input<'placement' | 'score-only'>('placement');
  startPlace = input<number | null>(null);

  scoreChanged = output<{ matchId: number; score: string; winnerId: number }>();
  seedingChanged = output<SeedingRequest>();
  deleteRequested = output<void>();
  scoreDeleteRequested = output<number>();

  private readonly fb = inject(FormBuilder);
  private readonly printService = inject(PrintService);

  readonly PAIR_W = PAIR_W;
  readonly PAIR_H = PAIR_H;
  readonly HEADER_HEIGHT = HEADER_HEIGHT;
  readonly SlotState = SlotState;
  private readonly printSectionsArea = viewChild<ElementRef<HTMLElement>>('printSectionsArea');

  private pairsMap = computed(() => new Map(this.pairs().map(p => [p.id, p])));

  layout = computed<BracketLayout>(() =>
    computeLayout(this.bracket().root_match, { championLabel: this.computeChampionLabel() }));

  readonly printScale = computed(() => Math.min(1, PRINT_PAGE_WIDTH / (this.layout().totalWidth || 1)));

  // Calculé uniquement en mode placement (onglet "Tableau principal") : en mode score-only
  // (tableaux de classement), le bouton d'impression n'est jamais affiché et ce calcul ne doit
  // pas s'exécuter pour ne rien changer au comportement de ce chemin existant.
  readonly printSections = computed<PrintSection[]>(() => {
    if (this.mode() !== 'placement') return [];
    return buildPrintSections(this.bracket().root_match, this.computeChampionLabel());
  });

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

  private readonly slotLockInfo = computed<{ locked: Set<string>; promotionSource: Map<string, number> }>(() => {
    const locked = new Set<string>();
    const promotionSource = new Map<string, number>();
    this.collectLockedSlots(this.bracket().root_match, locked, promotionSource);
    return { locked, promotionSource };
  });

  readonly lockedSlotIds = computed<Set<string>>(() => this.slotLockInfo().locked);
  readonly promotionSourceMatchId = computed<Map<string, number>>(() => this.slotLockInfo().promotionSource);

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

  onDeleteScore(matchId: number): void {
    this.scoreDeleteRequested.emit(matchId);
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

  openDrawTool(): void {
    window.open('/draw', 'jap-draw-tool', 'width=520,height=720,noopener');
  }

  onPrint(): void {
    if (this.mode() !== 'placement') return;
    const el = this.printSectionsArea()?.nativeElement;
    if (el) this.printService.printElement(el);
  }

  private collectLockedSlots(
    match: BracketMatch | null,
    locked: Set<string>,
    promotionSource: Map<string, number>,
  ): void {
    if (!match) return;
    if (match.score || match.winner_id) {
      locked.add(`${match.id}-p1`);
      locked.add(`${match.id}-p2`);
    } else {
      if (match.child1?.winner_id && match.child1.winner_id === match.pair1) {
        locked.add(`${match.id}-p1`);
        promotionSource.set(`${match.id}-p1`, match.child1.id);
      }
      if (match.child2?.winner_id && match.child2.winner_id === match.pair2) {
        locked.add(`${match.id}-p2`);
        promotionSource.set(`${match.id}-p2`, match.child2.id);
      }
    }
    this.collectLockedSlots(match.child1 as BracketMatch | null, locked, promotionSource);
    this.collectLockedSlots(match.child2 as BracketMatch | null, locked, promotionSource);
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

  private formatOrdinalPlace(place: number): string {
    return place === 1 ? '1er' : `${place}ème`;
  }

  private computeChampionLabel(): string {
    const startPlace = this.startPlace();
    return this.mode() === 'score-only' && startPlace !== null
      ? this.formatOrdinalPlace(startPlace)
      : 'Gagnant';
  }

  protected readonly TournamentStatus = TournamentStatus;
}
