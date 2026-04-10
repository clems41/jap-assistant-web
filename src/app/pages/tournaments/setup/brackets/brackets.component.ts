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
import {TooltipModule} from 'primeng/tooltip';
import {DialogModule} from 'primeng/dialog';
import {validScoreBasedOnGameFormat} from '../../../../shared/validators/form.validators';
import {InputTextModule} from 'primeng/inputtext';
import {EnumChoice} from '../../../../shared/models/base.models';

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
    TooltipModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './brackets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BracketsComponent {
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();
  availableGameFormats = input.required<EnumChoice[]>();

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
  scoreDialogVisible = signal<boolean>(false);
  selectNodeForScore = signal<TreeNode | null>(null);
  scoreForm: FormGroup = this.buildScoreForm();

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
      untracked(() => {
        this.loadBracketState(tournament.id);
        this.scoreForm.patchValue({
          game_format: tournament.game_format
        });
      });
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
      const node = this.bracketService.findNode(newBracketData, slot.slot_title);
      if (node?.data) {
        node.data.pair = slot.pair;
        node.data.score = slot.score;
        node.data.game_format = slot.game_format;
      }
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
          slots.push({ slot_title: node.data.title, pair_id: node.data.pair.id, score: node.data.score,
            game_format: node.data.game_format });
        }
        if (node.children) traverse(node.children as TreeNode<MatchData>[]);
      }
    };
    traverse(this.bracketData());
    return slots;
  }

  printBracket(): void {
    const chartEl = document.getElementById('bracket-chart');
    if (!chartEl) return;

    const filename = this.buildPrintFilename();

    const styles = Array.from(document.styleSheets).reduce<string>((acc, sheet) => {
      try {
        return acc + Array.from(sheet.cssRules).map(r => r.cssText).join('\n');
      } catch {
        return acc;
      }
    }, '');

    const pw = window.open('', '_blank', 'width=1200,height=900');
    if (!pw) return;

    pw.document.write(`<!DOCTYPE html>
<html lang="fr-FR">
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  <style>
    ${styles}
    @page { size: A4 landscape; margin: 10mm; }
    html, body { margin: 0; padding: 0; background: white; height: 100%; overflow: hidden; }
    body { display: flex; align-items: center; justify-content: center; }
    #bracket-chart { margin: 0 !important; }
  </style>
</head>
<body>
  ${chartEl.outerHTML}
  <script>
    window.addEventListener('load', function () {
      var el = document.getElementById('bracket-chart');
      if (el) {
        el.style.margin = '0';
        var rect = el.getBoundingClientRect();
        var availW = 1047, availH = 718;
        var scale = Math.min(availW / (rect.width || availW), availH / (rect.height || availH));
        if (scale < 1) { el.style.zoom = scale.toString(); }
      }
      setTimeout(function () { window.print(); window.close(); }, 300);
    });
  </script>
</body>
</html>`);
    pw.document.close();
  }

  private buildPrintFilename(): string {
    const t = this.tournament();
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9\u00C0-\u017E]/g, '_');
    const name = sanitize(t.name ?? 'tournoi');
    const category = sanitize(t.category ?? '');
    const date = t.start_date
      ? new Date(t.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
      : '';
    return [name, category, date].filter(Boolean).join('_');
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

  canSetScore(node: TreeNode): boolean {
    if (!node.children) return false
    const childrenFilled = node.children.map(children => !!children.data.pair.id)
    return childrenFilled.filter(filled => filled).length === 2;
  }

  saveScore(): void {
    if (this.scoreForm.invalid) return
    const {game_format, score, winner_pair_id} = this.scoreForm.value;
    const winner_pair = this.pairs().find(pair => pair.id === winner_pair_id);
    let selectedNode = this.selectNodeForScore();
    if (!selectedNode) return;
    const bracketData = structuredClone(this.bracketData());
    const node = this.bracketService.findNode(bracketData, selectedNode.data.title);
    if (!node?.data) return;

    node.data.pair = winner_pair;
    node.data.score = score;
    node.data.game_format = game_format;

    this.bracketData.set(bracketData);
    this.closeScoreDialog();
  }

  isDisabled(node: TreeNode): boolean {
    const bracketData = structuredClone(this.bracketData());
    const parentNode = this.bracketService.findParent(bracketData, node.data.title);
    return !!parentNode && !node.data.pair.id && !!parentNode.data?.pair?.id
  }

  openScoreDialog(node: TreeNode): void {
    if (!this.canSetScore(node)) return
    this.scoreDialogVisible.set(true);
    this.selectNodeForScore.set(node);
  }

  closeScoreDialog(): void {
    this.scoreDialogVisible.set(false);
    this.selectNodeForScore.set(null);
    const tournament = this.tournament();
    this.scoreForm.reset({
      game_format: tournament.game_format
    });
  }

  private buildForm() {
    return this.formBuilder.group({
      bracketDimension: [64, [Validators.required]],
      nbTopSeeds: [0, [Validators.required, Validators.min(1)]],
    })
  }

  private buildScoreForm() {
    return this.formBuilder.group({
      game_format: [null, [Validators.required]],
      score: ['', [Validators.required]],
      winner_pair_id: [null, [Validators.required]],
    }, { validators: validScoreBasedOnGameFormat });
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
      this.hoveredSlot.set({ title: matchData.title, pair: matchData.pair });
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
    const node = this.bracketService.findNode(bracketData, matchData.title);
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
    const node = this.bracketService.findNode(bracketData, matchData.title);
    if (!node?.data) return;

    node.data.pair = undefined;
    this.bracketData.set(bracketData);
    this.pairsPlaced.set(this.pairsPlaced().filter(p => p.id !== removedPair.id));
  }
}
