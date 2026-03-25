import {
  Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal, viewChild,
  ChangeDetectionStrategy, effect, untracked
} from '@angular/core';
import {Tournament} from '../../../../shared/models/tournament.models';
import {Pair} from '../../../../shared/models/pair.models';
import {TreeNode} from 'primeng/api';
import {OrganizationChartModule} from 'primeng/organizationchart';
import {BracketService} from '../../../../shared/services/bracket.service';
import {SelectModule} from 'primeng/select';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {DragDropModule} from 'primeng/dragdrop';
import {MatchData} from '../../../../shared/models/bracket.models';

@Component({
  selector: 'app-brackets',
  imports: [
    OrganizationChartModule,
    SelectModule,
    ReactiveFormsModule,
    DragDropModule,
  ],
  templateUrl: './brackets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BracketsComponent {
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();

  private destroyRef = inject(DestroyRef);
  private bracketService = inject(BracketService);
  private formBuilder = inject(FormBuilder);
  form: FormGroup = this.buildForm();
  bracketData = signal<TreeNode<MatchData>[]>([]);
  availableNumberOfTopSeeds = signal<number[]>([]);
  selectedPair = signal<Pair | null>(null);
  remainingPairsToBePlaced = signal<Pair[]>([]);
  pairsPlaced = signal<Pair[]>([]);

  chartContainer = viewChild<ElementRef<HTMLElement>>('chartContainer');
  private chartNaturalWidth = signal(0);
  private chartNaturalHeight = signal(0);
  chartMargin = computed(() => Math.max(0, (this.chartNaturalWidth() - this.chartNaturalHeight()) / 2));
  containerHeight = computed(() => this.chartNaturalWidth() || 400);

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
        this.pairs().filter(pair => !pairsPlaced.find(pairPlaced => pairPlaced.id === pair.id))
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
  }

  drop(matchData: MatchData): void {
    const selectedPair = this.selectedPair();
    if (!selectedPair) return;

    const bracketData = structuredClone(this.bracketData());
    const node = this.findNode(bracketData, matchData.title);
    if (!node?.data) return;

    if (!node.data.pair1.id) {
      node.data.pair1 = selectedPair;
    } else if (!node.data.pair2.id) {
      node.data.pair2 = selectedPair;
    } else {
      return;
    }

    this.bracketData.set(bracketData);
    this.pairsPlaced.set([...this.pairsPlaced(), selectedPair]);
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
