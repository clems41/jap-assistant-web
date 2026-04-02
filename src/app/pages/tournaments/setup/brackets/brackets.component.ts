import {
  Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal, viewChild,
  ChangeDetectionStrategy, effect, untracked
} from '@angular/core';
import {Tournament} from '../../../../shared/models/tournament.models';
import {Pair} from '../../../../shared/models/pair.models';
import {TreeNode} from 'primeng/api';
import {OrganizationChartModule} from 'primeng/organizationchart';
import {BracketService} from '../../../../shared/services/bracket.service';
import {BracketApiService} from '../../../../shared/services/bracket-api.service';
import {SelectModule} from 'primeng/select';
import {ButtonModule} from 'primeng/button';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {DragDropModule} from 'primeng/dragdrop';
import {MatchData, BracketStateResponse, BracketStatePayload, BracketSlotPayload} from '../../../../shared/models/bracket.models';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-brackets',
  imports: [
    OrganizationChartModule,
    SelectModule,
    ButtonModule,
    ProgressSpinnerModule,
    ReactiveFormsModule,
    DragDropModule,
    NgIf,
  ],
  templateUrl: './brackets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BracketsComponent {
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();

  private destroyRef = inject(DestroyRef);
  private bracketService = inject(BracketService);
  private bracketApiService = inject(BracketApiService);
  private formBuilder = inject(FormBuilder);
  form: FormGroup = this.buildForm();
  bracketData = signal<TreeNode<MatchData>[]>([]);
  availableNumberOfTopSeeds = signal<number[]>([]);
  selectedPair = signal<Pair | null>(null);
  isDragging = computed(() => this.selectedPair() !== null);
  hoveredSlot = signal<MatchData | null>(null);
  remainingPairsToBePlaced = signal<Pair[]>([]);
  pairsPlaced = signal<Pair[]>([]);
  isLoadingState = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  chartContainer = viewChild<ElementRef<HTMLElement>>('chartContainer');
  private chartNaturalWidth = signal(0);
  chartNaturalHeight = signal(0);
  chartMargin = computed(() => Math.max(0, (this.chartNaturalWidth() - this.chartNaturalHeight()) / 2));

  private readonly allRoundLabels = ['Gagnant', 'Finale', 'Demies', 'Quarts', '1/8èmes', '1/16èmes', '1/32èmes'];
  bracketRounds = computed<string[]>(() => this.allRoundLabels.slice(0, this.treeDepth(this.bracketData())));

  private treeDepth(nodes: TreeNode<MatchData>[]): number {
    if (!nodes.length) return 0;
    const first = nodes[0];
    if (!first.children?.length) return 1;
    return 1 + this.treeDepth(first.children as TreeNode<MatchData>[]);
  }

  constructor() {
    afterNextRender(() => {
      const el = this.chartContainer()?.nativeElement;
      if (!el) return;
      const observer = new ResizeObserver(() => {
        this.chartNaturalWidth.set(el.offsetWidth);
        this.chartNaturalHeight.set(el.offsetHeight);
      });
      observer.observe(el);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });

    this.form.get('bracketDimension')?.valueChanges.subscribe(bracketDimension => this.bracketData.set(this.bracketService.buildBracketData(bracketDimension)));

    effect(() => {
      const pairsPlaced = this.pairsPlaced();
      this.remainingPairsToBePlaced.set(
        this.pairs()
          .filter(pair => !pairsPlaced.find(pairPlaced => pairPlaced.id === pair.id))
          .sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0))
      );
    });

    effect(() => {
      const nbPairs = this.pairs().length;
      const bracketDimension = this.bracketService.getBracketDimensionFromNumberOfPairs(nbPairs);
      untracked(() => {
        this.form.patchValue({
          bracketDimension: bracketDimension,
          nbTopSeeds: bracketDimension / 4,
        });
      });
      this.availableNumberOfTopSeeds.set(this.bracketService.getAvailableNumberOfTopSeedsFromNumberOfPairs(nbPairs));
      this.bracketData.set(this.bracketService.buildBracketData(bracketDimension));
    });

    effect(() => {
      const tournament = this.tournament();
      untracked(() => this.loadBracketState(tournament.id));
    });
  }

  private loadBracketState(tournamentId: number): void {
    this.bracketApiService.getBracketState(tournamentId).subscribe({
      next: (state) => {
        if (state) this.applyBracketState(state);
        this.isLoadingState.set(false);
      },
      error: () => this.isLoadingState.set(false),
    });
  }

  private applyBracketState(state: BracketStateResponse): void {
    const newBracketData = this.bracketService.buildBracketData(state.dimension);
    for (const slot of state.slots) {
      const node = this.findNode(newBracketData, slot.slot_title);
      if (node?.data) node.data.pair = slot.pair;
    }
    this.form.patchValue(
      { bracketDimension: state.dimension, nbTopSeeds: state.nb_top_seeds },
      { emitEvent: false }
    );
    this.bracketData.set(newBracketData);
    this.pairsPlaced.set(state.slots.map(slot => slot.pair));
  }

  private serializeBracketData(): BracketSlotPayload[] {
    const slots: BracketSlotPayload[] = [];
    const traverse = (nodes: TreeNode<MatchData>[]) => {
      for (const node of nodes) {
        if (node.data?.pair?.id) {
          slots.push({ slot_title: node.data.title, pair_id: node.data.pair.id });
        }
        if (node.children) traverse(node.children as TreeNode<MatchData>[]);
      }
    };
    traverse(this.bracketData());
    return slots;
  }

  saveBracket(): void {
    this.isSaving.set(true);
    const payload: BracketStatePayload = {
      dimension: this.form.value.bracketDimension,
      nb_top_seeds: this.form.value.nbTopSeeds,
      slots: this.serializeBracketData(),
    };
    this.bracketApiService.saveBracketState(this.tournament().id, payload).subscribe({
      next: () => this.isSaving.set(false),
      error: () => this.isSaving.set(false),
    });
  }

  getSeedNumber(pair: Pair): number | null {
    const pairs = this.pairs()
      .sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0));
    const pairIndex = pairs.findIndex(p => p.id === pair.id);
    const {nbTopSeeds} = this.form.value;
    return pairIndex < nbTopSeeds ? pairIndex+1 : null;
  }

  getPairName(pair: Pair): string {
    return pair.player1 && pair.player2 ?
      `${pair?.player1?.last_name.toUpperCase()} / ${pair?.player2?.last_name?.toUpperCase()}` : '---';
  }

  private buildForm() {
    return this.formBuilder.group({
      bracketDimension: [64, [Validators.required]],
      nbTopSeeds: [0, [Validators.required, Validators.min(1)]],
    })
  }

  dragStart(pair: Pair) {
    console.log('dragStart', pair);
    this.selectedPair.set(pair);
  }

  dragEnd(): void {
    this.selectedPair.set(null);
    this.hoveredSlot.set(null);
  }

  dragEnterSlot(matchData: MatchData): void {
    if (!matchData.pair?.id) {
      this.hoveredSlot.set({ title: matchData.title, pair: matchData.pair, disabled: false });
    }
  }

  dragLeaveSlot(): void {
    this.hoveredSlot.set(null);
  }

  isSlotHovered(matchData: MatchData): boolean {
    const h = this.hoveredSlot();
    return h !== null && h.title === matchData.title;
  }

  dropOnSlot(matchData: MatchData): void {
    const selectedPair = this.selectedPair();
    if (!selectedPair) return;
    if (matchData.pair?.id) return;

    const bracketData = structuredClone(this.bracketData());
    const node = this.findNode(bracketData, matchData.title);
    if (!node?.data) return;

    node.data.pair = selectedPair;

    this.bracketData.set(bracketData);
    this.pairsPlaced.set([...this.pairsPlaced(), selectedPair]);
    this.selectedPair.set(null);
    this.hoveredSlot.set(null);
  }

  isPairAlreadyPlaced(matchData: MatchData): boolean {
    return !!matchData.pair?.id;
  }

  removePairFromSlot(matchData: MatchData): void {
    const removedPair = matchData.pair;
    if (!removedPair) return;

    const bracketData = structuredClone(this.bracketData());
    const node = this.findNode(bracketData, matchData.title);
    if (!node?.data) return;

    node.data.pair = undefined;
    this.bracketData.set(bracketData);
    this.pairsPlaced.set(this.pairsPlaced().filter(p => p.id !== removedPair.id));
  }

  private findNode(nodes: TreeNode<MatchData>[], title: string): TreeNode<MatchData> | null {
    for (const node of nodes) {
      if (node.data?.title === title) return node;
      if (node.children?.length) {
        const found = this.findNode(node.children as TreeNode<MatchData>[], title);
        if (found) return found;
      }
    }
    return null;
  }
}
